"""Backfill to normalize Composio enabled tools to canonical MCP names.

Run with:

    python3 backend/scripts/backfill_composio_enabled_tools.py

Requires the same environment variables used by the backend (Supabase keys,
ENCRYPTION_KEY, COMPOSIO_API_KEY, etc.).
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys
from typing import Dict, List


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
from core.composio_integration.toolkit_service import ToolkitService  # noqa: E402
from core.utils.logger import logger  # noqa: E402


_tool_cache: Dict[str, Dict[str, str]] = {}


def _normalize_key(value: str | None) -> str:
    if not value:
        return ""
    return value.strip().lower().replace("-", "_")


async def get_tool_mapping(toolkit_slug: str) -> Dict[str, str]:
    slug = (toolkit_slug or "").strip()
    if not slug:
        return {}
    if slug in _tool_cache:
        return _tool_cache[slug]

    service = ToolkitService()
    tools_response = await service.get_toolkit_tools(slug)

    mapping: Dict[str, str] = {}
    for tool in tools_response.items:
        name = tool.name
        slug_value = getattr(tool, "slug", "") or ""
        candidates = {name, slug_value}
        candidates.add(slug_value.replace("_", "-"))

        for candidate in filter(None, candidates):
            mapping[_normalize_key(candidate)] = name

    _tool_cache[slug] = mapping
    logger.debug("Loaded %s tool mappings for %s", len(mapping), slug)
    return mapping


def normalize_enabled_tools(enabled_tools: List[str], mapping: Dict[str, str]) -> List[str]:
    if not enabled_tools:
        return []

    deduped: List[str] = []
    seen = set()

    for entry in enabled_tools:
        key = _normalize_key(entry)
        candidate = mapping.get(key)
        value = candidate or entry
        if value not in seen:
            deduped.append(value)
            seen.add(value)

    return deduped


def infer_toolkit_slug(mcp: Dict[str, object]) -> str:
    config_block = mcp.get("config") if isinstance(mcp.get("config"), dict) else {}
    if isinstance(config_block, dict):
        slug = config_block.get("toolkit_slug") or config_block.get("toolkitSlug")
        if slug:
            return str(slug)

    slug = mcp.get("toolkit_slug")
    if slug:
        return str(slug)

    qualified_name = mcp.get("qualifiedName") or mcp.get("mcp_qualified_name")
    if isinstance(qualified_name, str) and qualified_name.startswith("composio."):
        return qualified_name.split(".", 1)[1]

    return ""


async def backfill_agent_versions() -> None:
    db = DBConnection()
    client = await db.client

    page_size = 200
    offset = 0
    total_rows = 0
    updated_rows = 0

    while True:
        response = await client.table("agent_versions").select("version_id, config").range(
            offset, offset + page_size - 1
        ).execute()
        rows = response.data or []
        if not rows:
            break

        for row in rows:
            total_rows += 1
            config = row.get("config") or {}
            tools_block = config.get("tools") or {}
            custom_mcps = tools_block.get("custom_mcp")

            if not isinstance(custom_mcps, list):
                continue

            changed = False

            for mcp in custom_mcps:
                if not isinstance(mcp, dict):
                    continue

                if (mcp.get("type") or mcp.get("customType")) not in {"composio", "COMPOSIO"} and not str(
                    mcp.get("qualifiedName", "")
                ).startswith("composio."):
                    continue

                enabled = mcp.get("enabledTools") or mcp.get("enabled_tools")
                if not isinstance(enabled, list) or not enabled:
                    continue

                toolkit_slug = infer_toolkit_slug(mcp)
                mapping = await get_tool_mapping(toolkit_slug)
                normalized = normalize_enabled_tools(enabled, mapping)

                if normalized != enabled:
                    mcp["enabledTools"] = normalized
                    if "enabled_tools" in mcp:
                        mcp["enabled_tools"] = normalized
                    changed = True

            if changed:
                config.setdefault("tools", {})["custom_mcp"] = custom_mcps
                await client.table("agent_versions").update(
                    {
                        "config": config,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                ).eq("version_id", row["version_id"]).execute()
                updated_rows += 1

        offset += page_size

    logger.info("Backfill completed. Agent versions scanned: %s, updated: %s", total_rows, updated_rows)


async def main() -> None:
    await backfill_agent_versions()


if __name__ == "__main__":
    asyncio.run(main())
