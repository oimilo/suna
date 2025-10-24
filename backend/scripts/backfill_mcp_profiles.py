"""Backfill legacy MCP credential profiles that stored plain JSON configs.

Usage:
    python3 backend/scripts/backfill_mcp_profiles.py

The script detects profiles whose `encrypted_config` column is not valid
base64. For those rows we interpret the value as JSON, re-encrypt it with the
standard `EncryptionService`, and persist the encoded payload together with the
updated hash so it matches the format expected by the current code (and by the
original Suna repository).
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
from datetime import datetime, timezone
from pathlib import Path
import sys
from typing import Any, Dict, Optional


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))


def load_env() -> None:
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

from core.services.supabase import DBConnection  # noqa: E402
from core.credentials.credential_service import EncryptionService  # noqa: E402
from core.utils.logger import logger  # noqa: E402


def _normalize_urlsafe_token(value: str) -> Optional[str]:
    stripped = value.strip()
    if not stripped:
        return None
    if "-" not in stripped and "_" not in stripped:
        return None
    padding = "=" * ((4 - len(stripped) % 4) % 4)
    try:
        base64.urlsafe_b64decode(stripped + padding)
        # Re-encode so the stored value matches the new expectation
        return base64.b64encode(stripped.encode("utf-8")).decode("utf-8")
    except Exception:
        return None


def _is_base64_encoded(value: str) -> bool:
    if not value:
        return False
    stripped = value.strip()
    padding = "=" * ((4 - len(stripped) % 4) % 4)
    try:
        base64.b64decode(stripped + padding, validate=True)
        return True
    except Exception:
        return False


def _parse_legacy_config(value: str) -> Optional[Dict[str, Any]]:
    if not value:
        return None
    try:
        parsed = json.loads(value)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        return None
    return None


async def backfill_profiles() -> None:
    encryption = EncryptionService()
    db = DBConnection()
    client = await db.client

    logger.info("Fetching MCP credential profiles for backfill")
    response = await client.table("user_mcp_credential_profiles").select(
        "profile_id, account_id, mcp_qualified_name, encrypted_config, config_hash, updated_at"
    ).execute()

    rows = response.data or []
    total = len(rows)
    updated = 0
    skipped = 0

    for row in rows:
        profile_id = row["profile_id"]
        encoded_config = row.get("encrypted_config") or ""

        normalized_token = _normalize_urlsafe_token(encoded_config)
        if normalized_token is not None:
            await client.table("user_mcp_credential_profiles").update(
                {
                    "encrypted_config": normalized_token,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("profile_id", profile_id).execute()
            updated += 1
            logger.debug(
                "Normalized urlsafe token for profile %s (%s)",
                profile_id,
                row.get("mcp_qualified_name"),
            )
            continue

        if _is_base64_encoded(encoded_config):
            continue

        legacy_config = _parse_legacy_config(encoded_config)
        if legacy_config is None:
            logger.warning(
                "Skipping profile %s: unable to parse legacy config",
                profile_id,
            )
            skipped += 1
            continue

        encrypted_config, config_hash = encryption.encrypt_config(legacy_config)
        encoded_value = base64.b64encode(encrypted_config).decode("utf-8")

        await client.table("user_mcp_credential_profiles").update(
            {
                "encrypted_config": encoded_value,
                "config_hash": config_hash,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("profile_id", profile_id).execute()

        updated += 1
        logger.debug(
            "Backfilled profile %s (%s) for %s",
            profile_id,
            legacy_config.get("profile_name") if isinstance(legacy_config, dict) else "unknown",
            row.get("mcp_qualified_name"),
        )

    logger.info(
        "Backfill complete: total=%s updated=%s skipped=%s",
        total,
        updated,
        skipped,
    )


def main() -> None:
    asyncio.run(backfill_profiles())


if __name__ == "__main__":
    main()
