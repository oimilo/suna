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
import binascii
import json
import os
import string
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
from cryptography.fernet import InvalidToken  # noqa: E402

from core.credentials.credential_service import EncryptionService  # noqa: E402
from core.utils.logger import logger  # noqa: E402


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


BASE64_CHARS = set(string.ascii_letters + string.digits + '+/_-')


def _decode_layers(value: str, max_layers: int = 4) -> Optional[bytes]:
    current = value.strip()
    if not current:
        return None

    for _ in range(max_layers):
        padding = '=' * ((4 - len(current) % 4) % 4)
        decoded: Optional[bytes] = None
        for decoder in (base64.b64decode, base64.urlsafe_b64decode):
            try:
                decoded = decoder(current + padding)
                break
            except binascii.Error:
                decoded = None
        if decoded is None:
            return None

        try:
            candidate = decoded.decode('utf-8')
        except UnicodeDecodeError:
            return decoded

        candidate_stripped = candidate.strip()
        if not candidate_stripped:
            return decoded

        if set(candidate_stripped) <= BASE64_CHARS:
            current = candidate_stripped
            continue

        return decoded

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

        normalized_bytes = _decode_layers(encoded_config)
        if normalized_bytes is not None:
            try:
                encryption.decrypt_config(normalized_bytes, row["config_hash"])
                encoded_value = base64.b64encode(normalized_bytes).decode("utf-8")
                if encoded_value != encoded_config:
                    await client.table("user_mcp_credential_profiles").update(
                        {
                            "encrypted_config": encoded_value,
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }
                    ).eq("profile_id", profile_id).execute()
                    updated += 1
                    logger.debug(
                        "Normalized token for profile %s (%s)",
                        profile_id,
                        row.get("mcp_qualified_name"),
                    )
                continue
            except (InvalidToken, ValueError):
                pass

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
