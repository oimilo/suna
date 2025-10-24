"""
Utilities to build canonical agent configuration payloads.

The Supabase migrations for Prophet/Suna expect every agent row to carry a
`config` JSON with at least: system_prompt, tools, metadata.  These helpers are
reused by the AgentCreationTool and other backfill/import flows to guarantee a
stable structure.
"""

from __future__ import annotations

import copy
from typing import Any, Dict, List, Optional, Tuple


def normalize_mcp_entries(entries: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """Return a deep-copied list containing only valid MCP configuration dicts."""
    if not entries:
        return []

    normalized: List[Dict[str, Any]] = []
    for entry in entries:
        if isinstance(entry, dict):
            normalized.append(copy.deepcopy(entry))
    return normalized


def build_agent_config(
    *,
    system_prompt: str,
    model: Optional[str],
    agentpress_tools: Optional[Dict[str, Any]],
    configured_mcps: Optional[List[Dict[str, Any]]],
    custom_mcps: Optional[List[Dict[str, Any]]] = None,
    icon_name: Optional[str] = None,
    icon_color: Optional[str] = None,
    icon_background: Optional[str] = None,
    is_default: bool = False,
    base_metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Build the canonical `(config, metadata)` tuple persisted in Supabase.

    Returns:
        Tuple where the first item is the agent_versions/agents `config` JSON and
        the second item is the agents `metadata` column.
    """
    metadata: Dict[str, Any] = {
        "is_suna_default": False,
        "centrally_managed": False,
        "created_with_agent_builder": True,
        "restrictions": {
            "system_prompt_editable": True,
            "tools_editable": True,
            "name_editable": True,
            "description_editable": True,
            "mcps_editable": True,
        },
    }

    if base_metadata:
        base_copy = copy.deepcopy(base_metadata)
        base_restrictions = base_copy.pop("restrictions", None)
        metadata.update(base_copy)
        if isinstance(base_restrictions, dict):
            metadata["restrictions"] = {
                **metadata["restrictions"],
                **base_restrictions,
            }

    # Store a small appearance snapshot so future diffs preserve the origin info.
    config_metadata: Dict[str, Any] = {
        "created_with_agent_builder": True,
    }
    if icon_name is not None:
        config_metadata["icon_name"] = icon_name
    if icon_color is not None:
        config_metadata["icon_color"] = icon_color
    if icon_background is not None:
        config_metadata["icon_background"] = icon_background
    if is_default:
        config_metadata["is_default_agent"] = True

    # Drop explicit None values to keep JSON lean.
    config_metadata = {key: value for key, value in config_metadata.items() if value is not None}

    agent_config = {
        "system_prompt": system_prompt or "",
        "model": model,
        "tools": {
            "agentpress": copy.deepcopy(agentpress_tools or {}),
            "mcp": normalize_mcp_entries(configured_mcps),
            "custom_mcp": normalize_mcp_entries(custom_mcps),
        },
        "metadata": config_metadata,
        "triggers": [],
        "workflows": [],
        "workflow_executions": [],
    }

    return agent_config, metadata
