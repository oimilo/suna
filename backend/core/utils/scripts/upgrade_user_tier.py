#!/usr/bin/env python3
"""
Utility script to manually upgrade a user account to a paid tier.

Example usage:
    poetry run python backend/core/utils/scripts/upgrade_user_tier.py \\
        --user-id d574a478-4483-4610-98d0-49fdfcd86463 \\
        --tier tier_6_50
"""

import argparse
import asyncio
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Optional, Tuple
from uuid import uuid4

BACKEND_DIR = Path(__file__).parent.parent.parent
CORE_DIR = BACKEND_DIR / "core"

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(CORE_DIR))

from billing.config import TIERS, get_tier_by_name  # noqa: E402
from core.services.supabase import DBConnection  # noqa: E402
from core.utils.logger import logger  # noqa: E402


def parse_decimal(value: str) -> Decimal:
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise argparse.ArgumentTypeError(f"Invalid decimal value: {value}") from exc


async def resolve_account_id(client, email: Optional[str], user_id: Optional[str]) -> Tuple[str, Optional[str]]:
    """
    Resolve the primary account/user ID using either an email address or an explicit UUID.

    Returns the account_id and the resolved email (if available).
    """
    if user_id:
        return user_id, email

    if not email:
        raise ValueError("Either --user-id or --email must be provided.")

    try:
        result = await client.rpc(
            "get_user_account_by_email",
            {"email_input": email},
        ).execute()
    except Exception as exc:
        raise RuntimeError(f"Failed to resolve account by email: {exc}") from exc

    if not result.data:
        raise ValueError(f"No account found for email: {email}")

    account_data = result.data
    account_id = account_data.get("id")
    if not account_id:
        raise ValueError(f"RPC get_user_account_by_email did not return an account id for {email}")

    resolved_email = email
    if not resolved_email:
        resolved_email = account_data.get("email")

    return account_id, resolved_email


async def fetch_credit_account(client, account_id: str) -> Optional[dict]:
    response = await client.from_("credit_accounts").select("*").eq("account_id", account_id).execute()
    if not response.data:
        return None
    return response.data[0]


def decimal_from_record(record: Optional[dict], field: str) -> Decimal:
    if not record:
        return Decimal("0")
    value = record.get(field)
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


async def upgrade_account(
    account_id: str,
    tier_name: str,
    grant_amount: Decimal,
    description: str,
    dry_run: bool = False,
) -> None:
    db = DBConnection()
    client = await db.client

    tier_config = get_tier_by_name(tier_name)
    if not tier_config:
        raise ValueError(f"Unknown tier '{tier_name}'. Available tiers: {', '.join(sorted(TIERS.keys()))}")

    account_record = await fetch_credit_account(client, account_id)
    now = datetime.now(timezone.utc)
    next_grant = now + timedelta(days=30)

    current_balance = decimal_from_record(account_record, "balance")
    current_expiring = decimal_from_record(account_record, "expiring_credits")
    current_lifetime_granted = decimal_from_record(account_record, "lifetime_granted")

    new_balance = current_balance + grant_amount
    new_expiring = current_expiring + grant_amount
    new_lifetime_granted = current_lifetime_granted + grant_amount

    update_payload = {
        "tier": tier_name,
        "balance": str(new_balance),
        "expiring_credits": str(new_expiring),
        "lifetime_granted": str(new_lifetime_granted),
        "last_grant_date": now.isoformat(),
        "next_credit_grant": next_grant.isoformat(),
        "updated_at": now.isoformat(),
    }

    if account_record:
        logger.info(
            "Updating existing credit account",
            extra={"account_id": account_id, "tier": tier_name, "grant_amount": str(grant_amount)},
        )
        if not dry_run:
            await client.from_("credit_accounts").update(update_payload).eq("account_id", account_id).execute()
    else:
        logger.info(
            "Creating credit account for upgrade",
            extra={"account_id": account_id, "tier": tier_name, "grant_amount": str(grant_amount)},
        )
        insert_payload = {
            "account_id": account_id,
            "balance": str(new_balance),
            "expiring_credits": str(new_expiring),
            "non_expiring_credits": "0",
            "lifetime_granted": str(new_lifetime_granted),
            "lifetime_purchased": "0",
            "lifetime_used": "0",
            "tier": tier_name,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "last_grant_date": now.isoformat(),
            "next_credit_grant": next_grant.isoformat(),
        }
        if not dry_run:
            await client.from_("credit_accounts").insert(insert_payload).execute()

    if grant_amount > 0:
        ledger_entry = {
            "id": str(uuid4()),
            "account_id": account_id,
            "amount": str(grant_amount),
            "balance_after": str(new_balance),
            "type": "tier_grant",
            "description": description or f"Manual upgrade to {tier_config.display_name}",
            "is_expiring": True,
            "created_at": now.isoformat(),
        }
        if not dry_run:
            await client.from_("credit_ledger").insert(ledger_entry).execute()

    logger.info(
        "Upgrade summary",
        extra={
            "account_id": account_id,
            "tier": tier_name,
            "granted_credits": str(grant_amount),
            "new_balance": str(new_balance),
            "dry_run": dry_run,
        },
    )


async def main():
    parser = argparse.ArgumentParser(description="Manually upgrade a user account to a paid tier.")
    parser.add_argument("--user-id", dest="user_id", help="Target account/user UUID")
    parser.add_argument("--email", dest="email", help="User email (resolved via get_user_account_by_email)")
    parser.add_argument("--tier", dest="tier", default="tier_6_50", help="Tier name (default: tier_6_50)")
    parser.add_argument(
        "--grant",
        dest="grant",
        type=parse_decimal,
        help="Credits to grant. Defaults to the tier's monthly credits.",
    )
    parser.add_argument(
        "--description",
        dest="description",
        default=None,
        help="Ledger entry description (optional).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview the changes without persisting them.",
    )

    args = parser.parse_args()

    if not args.user_id and not args.email:
        parser.error("You must provide either --user-id or --email.")

    tier_config = get_tier_by_name(args.tier)
    if not tier_config:
        parser.error(f"Unknown tier '{args.tier}'. Available tiers: {', '.join(sorted(TIERS.keys()))}")

    grant_amount = args.grant if args.grant is not None else tier_config.monthly_credits

    if grant_amount <= 0:
        parser.error("Grant amount must be greater than zero.")

    db = DBConnection()
    client = await db.client
    account_id, resolved_email = await resolve_account_id(client, args.email, args.user_id)

    logger.info(
        "Upgrading account",
        extra={
            "account_id": account_id,
            "email": resolved_email,
            "tier": args.tier,
            "grant_amount": str(grant_amount),
            "dry_run": args.dry_run,
        },
    )

    description = args.description or f"Manual upgrade to {tier_config.display_name} (script)"
    await upgrade_account(
        account_id=account_id,
        tier_name=args.tier,
        grant_amount=grant_amount,
        description=description,
        dry_run=args.dry_run,
    )

    if args.dry_run:
        logger.info("Dry-run mode enabled: no changes were persisted.")


if __name__ == "__main__":
    asyncio.run(main())

