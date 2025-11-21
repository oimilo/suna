from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from core.utils.logger import logger


class ToolFlowMixin:
    """
    Shared helper for Agent Builder tools to understand and communicate the
    recommended onboarding order for automation capabilities:
    1. MCP integrations
    2. Data providers (public/aggregated feeds only)
    3. Browser automation fallback

    The mixin derives the current status from the agent configuration so the
    language model can see which phases are complete and what should come next.
    """

    TOOL_FLOW_ORDER: List[str] = ["mcp", "data_providers", "browser"]

    async def _load_tool_flow_config_summary(self) -> Optional[Dict[str, Any]]:
        """
        Lightweight snapshot of the agent configuration focusing on tool data.
        """
        agent_data = await self._get_agent_data()
        if not agent_data:
            return None

        version_data = None
        version_id = agent_data.get("current_version_id")
        if version_id:
            try:
                from core.versioning.version_service import get_version_service

                account_id = agent_data.get("account_id")
                try:
                    # Thread context may have a more up-to-date account id
                    account_id = await self._get_current_account_id()
                except Exception:
                    pass

                version_service = await get_version_service()
                version_obj = await version_service.get_version(
                    agent_id=self.agent_id,
                    version_id=version_id,
                    user_id=account_id,
                )
                version_data = version_obj.to_dict()
            except Exception as exc:
                logger.debug(
                    "Could not load version data for tool flow state: %s", exc
                )

        try:
            from core.config_helper import extract_agent_config

            agent_config = extract_agent_config(agent_data, version_data)
        except Exception as exc:
            logger.warning("extract_agent_config failed: %s", exc, exc_info=True)
            return None

        return {
            "agentpress_tools": agent_config.get("agentpress_tools", {}) or {},
            "configured_mcps": agent_config.get("configured_mcps", []) or [],
            "custom_mcps": agent_config.get("custom_mcps", []) or [],
        }

    async def _get_tool_flow_state(self) -> Dict[str, Any]:
        summary = await self._load_tool_flow_config_summary()
        return self._derive_tool_flow_state(summary)

    def _derive_tool_flow_state(
        self, config_summary: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        state = self._empty_tool_flow_state()
        if not config_summary:
            return state

        completed: List[str] = []
        details: Dict[str, Any] = {}

        configured_mcps = config_summary.get("configured_mcps", [])
        custom_mcps = config_summary.get("custom_mcps", [])
        agentpress_tools = config_summary.get("agentpress_tools", {})

        if configured_mcps or custom_mcps:
            completed.append("mcp")
            details["mcp"] = {
                "configured": len(configured_mcps),
                "custom": len(custom_mcps),
            }

        if self._is_tool_enabled(agentpress_tools, "data_providers_tool"):
            completed.append("data_providers")

        if self._is_tool_enabled(agentpress_tools, "browser_tool"):
            completed.append("browser")

        pending = [step for step in self.TOOL_FLOW_ORDER if step not in completed]
        hints: List[str] = []

        if pending:
            nxt = pending[0]
            if nxt == "mcp":
                hints.append(
                    "Configure MCP integrations (credential profiles) before considering fallbacks."
                )
            elif nxt == "data_providers":
                hints.append(
                    "After MCPs, enable data providers for aggregated/public datasets."
                )
            elif nxt == "browser":
                hints.append(
                    "Use browser automation only when neither MCP nor data providers solve the task."
                )
        else:
            hints.append(
                "MCPs, data providers e browser estão configurados – siga direto para tarefas do usuário."
            )

        state.update(
            {
                "completed": completed,
                "pending": pending,
                "next_step": pending[0] if pending else None,
                "details": details,
                "hints": hints,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        return state

    def _empty_tool_flow_state(self) -> Dict[str, Any]:
        return {
            "order": list(self.TOOL_FLOW_ORDER),
            "completed": [],
            "pending": list(self.TOOL_FLOW_ORDER),
            "next_step": self.TOOL_FLOW_ORDER[0],
            "details": {},
            "hints": [
                "Priorize MCPs, depois data providers, e deixe browser como último recurso."
            ],
            "updated_at": None,
        }

    def _is_tool_enabled(self, tools_config: Dict[str, Any], name: str) -> bool:
        config = (tools_config or {}).get(name)
        if isinstance(config, bool):
            return config
        if isinstance(config, dict):
            return config.get("enabled", False)
        return False

