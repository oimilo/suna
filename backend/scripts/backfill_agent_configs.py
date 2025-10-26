"""Backfill script to normalize `agents.config`/`agents.metadata` payloads.

Usage:
    python3 backend/scripts/backfill_agent_configs.py

Loads environment variables from `backend/.env.local` if present and uses the
shared `build_agent_config` helper to regenerate configuration JSON for agents
that were created before the recent refactor.
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional, Tuple


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
from core.utils.agent_config_builder import (  # noqa: E402
    build_agent_config,
    normalize_mcp_entries,
)
from core.utils.core_tools_helper import ensure_core_tools_enabled  # noqa: E402
from core.utils.logger import logger  # noqa: E402


def _parse_json(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value:
        try:
            parsed = json.loads(value)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            logger.warning("Failed to decode JSON column: %s", value[:120])
    return {}


def _parse_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value:
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            logger.warning("Failed to decode JSON list: %s", value[:120])
    return []


def _extract_version_fields(
    version_row: Optional[Dict[str, Any]],
    fallback_config: Dict[str, Any],
) -> Tuple[str, Optional[str], Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    if not version_row:
        system_prompt = fallback_config.get("system_prompt", "")
        model = fallback_config.get("model")
        tools_block = fallback_config.get("tools", {})
        return (
            system_prompt,
            model,
            tools_block.get("agentpress", {}) if isinstance(tools_block, dict) else {},
            normalize_mcp_entries(tools_block.get("mcp")),
            normalize_mcp_entries(tools_block.get("custom_mcp")),
        )

    version_config = _parse_json(version_row.get("config"))
    tools_block = version_config.get("tools") if isinstance(version_config.get("tools"), dict) else {}

    system_prompt = version_config.get("system_prompt") or fallback_config.get("system_prompt") or ""
    model = version_config.get("model") or fallback_config.get("model")

    agentpress_tools = tools_block.get("agentpress")
    if not isinstance(agentpress_tools, dict):
        fallback_tools = fallback_config.get("tools") if isinstance(fallback_config.get("tools"), dict) else {}
        agentpress_tools = fallback_tools.get("agentpress") if isinstance(fallback_tools, dict) else {}
        if not isinstance(agentpress_tools, dict):
            agentpress_tools = {}

    configured_mcps = tools_block.get("mcp")
    if not isinstance(configured_mcps, list):
        configured_mcps = _parse_list(fallback_config.get("tools", {}).get("mcp"))

    custom_mcps = tools_block.get("custom_mcp")
    if not isinstance(custom_mcps, list):
        custom_mcps = _parse_list(fallback_config.get("tools", {}).get("custom_mcp"))

    return (
        system_prompt,
        model,
        agentpress_tools,
        normalize_mcp_entries(configured_mcps),
        normalize_mcp_entries(custom_mcps),
    )


def _needs_backfill(agent_config: Dict[str, Any]) -> bool:
    if not agent_config:
        return True
    if not isinstance(agent_config, dict):
        return True
    if "system_prompt" not in agent_config or "tools" not in agent_config or "metadata" not in agent_config:
        return True
    tools = agent_config.get("tools")
    if not isinstance(tools, dict):
        return True
    if "agentpress" not in tools or "mcp" not in tools or "custom_mcp" not in tools:
        return True
    return False


async def fetch_versions_map(client, version_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    if not version_ids:
        return {}

    chunks: List[List[str]] = []
    chunk_size = 200
    for idx in range(0, len(version_ids), chunk_size):
        chunks.append(version_ids[idx : idx + chunk_size])

    results: Dict[str, Dict[str, Any]] = {}
    for chunk in chunks:
        response = await client.table("agent_versions").select(
            "version_id, config"
        ).in_("version_id", chunk).execute()
        for row in response.data or []:
            results[row["version_id"]] = row
    return results


async def backfill_agents() -> None:
    db = DBConnection()
    client = await db.client

    offset = 0
    page_size = 200
    scanned = 0
    updated = 0
    skipped_missing_version = 0

    while True:
        response = await client.table("agents").select(
            "agent_id, account_id, current_version_id, config, metadata, icon_name, icon_color, "
            "icon_background, is_default, version_count"
        ).range(offset, offset + page_size - 1).execute()
        agents = response.data or []
        if not agents:
            break

        version_ids = [a.get("current_version_id") for a in agents if a.get("current_version_id")]
        versions_map = await fetch_versions_map(client, [vid for vid in version_ids if vid])

        for agent in agents:
            scanned += 1
            agent_id = agent["agent_id"]
            existing_config = _parse_json(agent.get("config"))
            existing_metadata = _parse_json(agent.get("metadata"))

            version_id = agent.get("current_version_id")
            version_row = versions_map.get(version_id)
            if version_id and not version_row:
                skipped_missing_version += 1

            system_prompt, model, agentpress_tools, configured_mcps, custom_mcps = _extract_version_fields(
                version_row,
                existing_config,
            )

            agentpress_tools = ensure_core_tools_enabled(agentpress_tools or {})

            new_config, new_metadata = build_agent_config(
                system_prompt=system_prompt,
                model=model,
                agentpress_tools=agentpress_tools,
                configured_mcps=configured_mcps,
                custom_mcps=custom_mcps,
                icon_name=agent.get("icon_name"),
                icon_color=agent.get("icon_color"),
                icon_background=agent.get("icon_background"),
                is_default=bool(agent.get("is_default")),
                base_metadata=existing_metadata,
            )

            if not _needs_backfill(existing_config) and existing_config == new_config and existing_metadata == new_metadata:
                continue

            await client.table("agents").update(
                {
                    "config": new_config,
                    "metadata": new_metadata,
                }
            ).eq("agent_id", agent_id).execute()
            updated += 1

        offset += page_size

    logger.info(
        "Backfill complete. Agents scanned: %s, updated: %s, missing versions skipped: %s",
        scanned,
        updated,
        skipped_missing_version,
    )


async def main() -> None:
    await backfill_agents()


if __name__ == "__main__":
    asyncio.run(main())
