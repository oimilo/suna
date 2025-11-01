#!/usr/bin/env python3
"""Utility to clean up legacy Stripe subscriptions stored in "credit_accounts".

Usage:
    # Dry run (default) – only report issues
    python3 backend/scripts/cleanup_legacy_subscriptions.py

    # Apply fixes for all affected accounts
    python3 backend/scripts/cleanup_legacy_subscriptions.py --apply

    # Focus on a single account
    python3 backend/scripts/cleanup_legacy_subscriptions.py --account <ACCOUNT_ID> --apply

The script identifies credit accounts that still reference Stripe subscription
IDs which either no longer exist in Stripe, were fully cancelled, or miss
required fields (like ``current_period_end``) because they pre-date the billing
port. When ``--apply`` is provided, those phantom references are removed so the
application stops querying a non-existent subscription.
"""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
import os
from pathlib import Path
import sys
from typing import Dict, List, Optional

import stripe


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))


def load_env() -> None:
    """Load environment variables from ``backend/.env.local`` when present."""

    env_file = BASE_DIR / ".env.local"
    if not env_file.exists():
        return

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key and value and key not in os.environ:
            os.environ[key] = value


load_env()


from core.billing.stripe_circuit_breaker import StripeAPIWrapper  # noqa: E402
from core.services.supabase import DBConnection  # noqa: E402
from core.utils.config import config  # noqa: E402
from core.utils.logger import logger  # noqa: E402


stripe.api_key = config.STRIPE_SECRET_KEY


@dataclass
class CleanupCandidate:
    account_id: str
    stripe_subscription_id: str
    tier: Optional[str]
    issue: str
    stripe_status: Optional[str]
    cancel_at: Optional[int]
    current_period_end: Optional[int]


class LegacySubscriptionCleanup:
    def __init__(self, apply_changes: bool, target_account: Optional[str]) -> None:
        self.apply_changes = apply_changes
        self.target_account = target_account
        self.db = DBConnection()
        self.client = None
        self.now = datetime.now(timezone.utc)
        self.candidates: List[CleanupCandidate] = []
        self.cleaned: List[CleanupCandidate] = []
        self.skipped: List[CleanupCandidate] = []
        self.errors: List[str] = []

    async def run(self) -> None:
        await self.db.initialize()
        self.client = await self.db.client
        await self._scan_credit_accounts()
        self._report()

    async def _scan_credit_accounts(self) -> None:
        assert self.client is not None
        batch_size = 200
        offset = 0

        while True:
            query = (
                self.client
                .from_("credit_accounts")
                .select("account_id, tier, stripe_subscription_id, trial_status")
                .not_.is_("stripe_subscription_id", "null")
                .range(offset, offset + batch_size - 1)
            )

            if self.target_account:
                query = query.eq("account_id", self.target_account)

            response = await query.execute()
            rows: List[Dict] = response.data or []

            if not rows:
                break

            for row in rows:
                account_id = row.get("account_id")
                subscription_id = row.get("stripe_subscription_id")
                tier = row.get("tier")

                if not account_id or not subscription_id:
                    continue

                candidate = await self._evaluate_subscription(account_id, subscription_id, tier)
                if candidate is None:
                    continue

                self.candidates.append(candidate)

                if self.apply_changes:
                    try:
                        await self._clear_subscription_reference(candidate)
                        self.cleaned.append(candidate)
                    except Exception as exc:  # pragma: no cover - defensive logging
                        logger.error(
                            "[LEGACY SUBSCRIPTIONS] Failed to clean account %s (%s): %s",
                            candidate.account_id,
                            candidate.stripe_subscription_id,
                            exc,
                        )
                        self.errors.append(
                            f"{candidate.account_id}: {candidate.issue} – {exc}"
                        )
                else:
                    self.skipped.append(candidate)

            offset += batch_size
            if len(rows) < batch_size:
                break

    async def _evaluate_subscription(
        self,
        account_id: str,
        subscription_id: str,
        tier: Optional[str],
    ) -> Optional[CleanupCandidate]:
        try:
            subscription = await StripeAPIWrapper.retrieve_subscription(subscription_id)
        except stripe.error.InvalidRequestError:
            logger.warning(
                "[LEGACY SUBSCRIPTIONS] Stripe does not recognize subscription %s (account %s)",
                subscription_id,
                account_id,
            )
            return CleanupCandidate(
                account_id=account_id,
                stripe_subscription_id=subscription_id,
                tier=tier,
                issue="missing_in_stripe",
                stripe_status=None,
                cancel_at=None,
                current_period_end=None,
            )
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error(
                "[LEGACY SUBSCRIPTIONS] Unexpected failure retrieving %s: %s",
                subscription_id,
                exc,
            )
            self.errors.append(f"{account_id}: retrieval_error – {exc}")
            return None

        status = getattr(subscription, "status", None)
        cancel_at = getattr(subscription, "cancel_at", None)
        canceled_at = getattr(subscription, "canceled_at", None)
        current_period_end = getattr(subscription, "current_period_end", None)

        if status == "canceled":
            logger.info(
                "[LEGACY SUBSCRIPTIONS] Account %s has canceled subscription %s",
                account_id,
                subscription_id,
            )
            return CleanupCandidate(
                account_id=account_id,
                stripe_subscription_id=subscription_id,
                tier=tier,
                issue="canceled",
                stripe_status=status,
                cancel_at=canceled_at or cancel_at,
                current_period_end=current_period_end,
            )

        if current_period_end is None:
            logger.info(
                "[LEGACY SUBSCRIPTIONS] Subscription %s (account %s) missing current_period_end",
                subscription_id,
                account_id,
            )
            return CleanupCandidate(
                account_id=account_id,
                stripe_subscription_id=subscription_id,
                tier=tier,
                issue="missing_current_period_end",
                stripe_status=status,
                cancel_at=canceled_at or cancel_at,
                current_period_end=None,
            )

        return None

    async def _clear_subscription_reference(self, candidate: CleanupCandidate) -> None:
        assert self.client is not None

        update_payload: Dict[str, Optional[str]] = {
            "stripe_subscription_id": None,
            "next_credit_grant": None,
            "billing_cycle_anchor": None,
            "updated_at": self.now.isoformat(),
        }

        if candidate.tier and candidate.tier not in {"none", "free"}:
            update_payload["tier"] = "none"

        await self.client.from_("credit_accounts")\
            .update(update_payload)\
            .eq("account_id", candidate.account_id)\
            .execute()

        logger.info(
            "[LEGACY SUBSCRIPTIONS] Cleared legacy subscription %s for account %s (%s)",
            candidate.stripe_subscription_id,
            candidate.account_id,
            candidate.issue,
        )

    def _report(self) -> None:
        total = len(self.candidates)
        print("\n" + "=" * 70)
        print("LEGACY STRIPE SUBSCRIPTION CLEANUP")
        print("=" * 70)
        print(f"Candidates found: {total}")

        if not total:
            print("No legacy subscriptions detected. Nothing to do.")
            return

        reasons = {}
        for candidate in self.candidates:
            reasons[candidate.issue] = reasons.get(candidate.issue, 0) + 1

        print("\nBreakdown by issue:")
        for issue, count in sorted(reasons.items(), key=lambda item: item[0]):
            print(f"  - {issue}: {count}")

        if self.apply_changes:
            print("\n✅ Applied fixes for the accounts above.")
            if self.errors:
                print("⚠️  Some accounts failed to update:")
                for error in self.errors:
                    print(f"    - {error}")
        else:
            print("\nℹ️  Run again with --apply to clear these references.")
            print("    Example: python3 backend/scripts/cleanup_legacy_subscriptions.py --apply")

        if self.skipped and not self.apply_changes:
            print("\nFirst affected accounts (dry-run preview):")
            for candidate in self.skipped[:10]:
                print(
                    f"  - account={candidate.account_id} sub={candidate.stripe_subscription_id} "
                    f"issue={candidate.issue} status={candidate.stripe_status}"
                )

        print("=" * 70)


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clean legacy Stripe subscription references from credit_accounts"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply fixes instead of only reporting.",
    )
    parser.add_argument(
        "--account",
        dest="account_id",
        default=None,
        help="Limit the cleanup to a single account_id.",
    )

    args = parser.parse_args()

    service = LegacySubscriptionCleanup(apply_changes=args.apply, target_account=args.account_id)
    await service.run()


if __name__ == "__main__":
    asyncio.run(main())

