"""Utility script to normalize Composio credential profiles and agent MCP configs.

Run with:

    python -m backend.scripts.normalize_composio_configs

Requires the same environment variables used by the backend (Supabase keys,
ENCRYPTION_KEY, etc.).
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Tuple

import os
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))


def load_env() -> None:
    env_file = BASE_DIR / ".env.local"
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        if key and value and key not in os.environ:
            os.environ[key] = value


load_env()

from core.composio_integration.composio_profile_service import ComposioProfileService
from core.services.supabase import DBConnection
from core.utils.logger import logger


def _canonical_slug(mcp_qualified_name: str) -> str:
    if not mcp_qualified_name:
        return ""
    if mcp_qualified_name.startswith("composio."):
        return mcp_qualified_name.split(".", 1)[1]
    if mcp_qualified_name.startswith("custom_composio_"):
        return mcp_qualified_name.split("custom_composio_", 1)[1]
    return mcp_qualified_name


async def normalize_profiles() -> Tuple[Dict[str, str], Dict[str, str]]:
    service = ComposioProfileService(DBConnection())
    client = await service.db.client

    profile_slug_map: Dict[str, str] = {}
    profile_name_map: Dict[str, str] = {}

    start = 0
    page_size = 1000
    total = 0
    updated = 0

    while True:
        response = await client.table('user_mcp_credential_profiles') \
            .select('*') \
            .range(start, start + page_size - 1) \
            .execute()

        rows = response.data or []
        if not rows:
            break

        for row in rows:
            total += 1
            profile_id = row['profile_id']
            canonical_slug = _canonical_slug(row.get('mcp_qualified_name', ''))
            profile_slug_map[profile_id] = canonical_slug
            profile_name_map[profile_id] = row.get('display_name') or row.get('profile_name') or ''

            try:
                config = service._decrypt_config(row['encrypted_config'])  # type: ignore[attr-defined]
            except Exception:  # pragma: no cover - defensive
                logger.exception("Failed to decrypt profile %s", profile_id)
                continue

            current_slug = config.get('toolkit_slug')
            current_qn = config.get('mcp_qualified_name')
            desired_qn = f"composio.{canonical_slug}" if canonical_slug else current_qn

            needs_update = False
            if canonical_slug and current_slug != canonical_slug:
                config['toolkit_slug'] = canonical_slug
                needs_update = True
            if desired_qn and current_qn != desired_qn:
                config['mcp_qualified_name'] = desired_qn
                needs_update = True

            if not needs_update:
                continue

            config_json = json.dumps(config, sort_keys=True)
            encrypted_config = service._encrypt_config(config_json)  # type: ignore[attr-defined]
            config_hash = service._generate_config_hash(config_json)  # type: ignore[attr-defined]

            await client.table('user_mcp_credential_profiles').update({
                'encrypted_config': encrypted_config,
                'config_hash': config_hash,
                'updated_at': datetime.now(timezone.utc).isoformat(),
            }).eq('profile_id', profile_id).execute()

            updated += 1
            logger.debug("Updated profile %s with slug %s", profile_id, canonical_slug)

        start += page_size

    logger.info("Profiles scanned: %s. Profiles updated: %s", total, updated)
    return profile_slug_map, profile_name_map


async def normalize_agent_versions(
    profile_slug_map: Dict[str, str],
    profile_name_map: Dict[str, str],
) -> None:
    db = DBConnection()
    client = await db.client

    page_size = 200
    start = 0
    total_updated = 0

    while True:
        response = await client.table('agent_versions') \
            .select('version_id, config') \
            .range(start, start + page_size - 1) \
            .execute()

        rows = response.data or []
        if not rows:
            break

        for row in rows:
            config = row.get('config') or {}
            tools = config.get('tools') or {}
            custom_mcps = tools.get('custom_mcp')
            if not isinstance(custom_mcps, list):
                continue

            changed = False
            for mcp in custom_mcps:
                if not isinstance(mcp, dict):
                    continue

                custom_type = mcp.get('customType') or mcp.get('type')
                qualified_name = mcp.get('qualifiedName') or mcp.get('mcp_qualified_name')
                config_block = mcp.setdefault('config', {})
                profile_id = config_block.get('profile_id')

                if custom_type != 'composio' and not (qualified_name or '').startswith('composio.'):
                    continue

                slug = None
                if profile_id and profile_id in profile_slug_map:
                    slug = profile_slug_map[profile_id]
                elif qualified_name and qualified_name.startswith('composio.'):
                    slug = qualified_name.split('.', 1)[1]

                if not slug:
                    continue

                canonical_qn = f"composio.{slug}"

                if mcp.get('qualifiedName') != canonical_qn:
                    mcp['qualifiedName'] = canonical_qn
                    changed = True
                if config_block.get('mcp_qualified_name') != canonical_qn:
                    config_block['mcp_qualified_name'] = canonical_qn
                    changed = True
                if config_block.get('toolkit_slug') != slug:
                    config_block['toolkit_slug'] = slug
                    changed = True

                if mcp.get('customType') != 'composio':
                    mcp['customType'] = 'composio'
                    changed = True
                if mcp.get('type') != 'composio':
                    mcp['type'] = 'composio'
                    changed = True

                profile_name = None
                if profile_id and profile_id in profile_name_map:
                    profile_name = profile_name_map[profile_id]
                if profile_name and mcp.get('name') != profile_name:
                    mcp['name'] = profile_name
                    changed = True

            if changed:
                config.setdefault('tools', {})['custom_mcp'] = custom_mcps
                await client.table('agent_versions').update({
                    'config': config,
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                }).eq('version_id', row['version_id']).execute()
                total_updated += 1

        start += page_size

    logger.info("Agent versions updated: %s", total_updated)


async def main() -> None:
    profile_slug_map, profile_name_map = await normalize_profiles()
    await normalize_agent_versions(profile_slug_map, profile_name_map)


if __name__ == "__main__":
    asyncio.run(main())
