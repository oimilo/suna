from typing import Dict, Any, List, Optional

from utils.logger import logger
from agentpress.tool import Tool, ToolResult, openapi_schema


class ToolDiscoveryTool(Tool):
    """Discovery helpers available to any agent run.

    - list_available_tools: Enumerate all registered tools (post-filter), with optional descriptions
    - list_mcp_tools: Alias that redirects discovery attempts to the same list, to avoid LLM errors
    """

    def __init__(self, thread_manager):
        super().__init__()
        self.thread_manager = thread_manager

    def _enumerate_tools(self, include_descriptions: bool = False) -> Dict[str, Any]:
        try:
            registry = getattr(self.thread_manager, 'tool_registry', None)
            if not registry or not hasattr(registry, 'tools'):
                return {
                    "message": "No tool registry available",
                    "tools": [],
                    "total": 0
                }

            tools: Dict[str, Dict[str, Any]] = dict(registry.tools)

            # Base: names already registrados no registry
            registry_names: List[str] = list(tools.keys())

            # Unir com integrações habilitadas no agente (configured/custom MCPs -> enabledTools)
            combined_names: List[str] = []
            combined_names.extend(registry_names)

            try:
                agent_cfg = getattr(self.thread_manager, 'agent_config', {}) or {}
                enabled_from_mcps: List[str] = []
                for coll_key in ['configured_mcps', 'custom_mcps']:
                    for mcp in agent_cfg.get(coll_key, []) or []:
                        for t in mcp.get('enabledTools', []) or []:
                            if isinstance(t, str) and t.strip():
                                enabled_from_mcps.append(t.strip())
                combined_names.extend(enabled_from_mcps)
            except Exception:
                pass

            # Apply allowlist se existir (aceita nome qualificado ou sufixo curto)
            try:
                agent_cfg = getattr(self.thread_manager, 'agent_config', {}) or {}
                allowed = agent_cfg.get('allowed_tools') or []
                if not isinstance(allowed, list):
                    allowed = []
                normalized_allowed = set(str(t).strip() for t in allowed if str(t).strip())

                def passes_allowlist(name: str) -> bool:
                    if not normalized_allowed:
                        return True
                    if name in normalized_allowed:
                        return True
                    for short in normalized_allowed:
                        if name.endswith(f":{short}"):
                            return True
                    return False

                # Always manter as funções de descoberta
                always_keep = {"list_available_tools", "list_mcp_tools", "call_mcp_tool"}
                filtered = []
                for n in combined_names:
                    if n in always_keep or passes_allowlist(n):
                        filtered.append(n)
                combined_names = filtered
            except Exception:
                pass

            # Dedup + sort
            seen = set()
            deduped: List[str] = []
            for n in combined_names:
                if n not in seen:
                    seen.add(n)
                    deduped.append(n)

            tool_names: List[str] = sorted(deduped)

            if not include_descriptions:
                return {
                    "message": f"Found {len(tool_names)} available tool(s)",
                    "tools": tool_names,
                    "total": len(tool_names),
                }

            described: List[Dict[str, str]] = []
            for name in tool_names:
                try:
                    desc = ""
                    if name in tools:
                        schema = tools[name]["schema"].schema or {}
                        func = schema.get("function", {}) if isinstance(schema, dict) else {}
                        desc = func.get("description", "")
                    described.append({"name": name, "description": desc})
                except Exception:
                    described.append({"name": name, "description": ""})

            return {
                "message": f"Found {len(tool_names)} available tool(s)",
                "tools": described,
                "total": len(tool_names)
            }
        except Exception as e:
            logger.error(f"Error enumerating tools: {e}")
            return {
                "message": f"Error enumerating tools: {str(e)}",
                "tools": [],
                "total": 0
            }

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_available_tools",
            "description": "List all tools currently registered for this run (after allowlist/filtering).",
            "parameters": {
                "type": "object",
                "properties": {
                    "include_descriptions": {
                        "type": "boolean",
                        "description": "Include descriptions if available",
                        "default": False
                    }
                },
                "required": []
            }
        }
    })
    async def list_available_tools(self, include_descriptions: bool = False) -> ToolResult:
        data = self._enumerate_tools(include_descriptions=include_descriptions)
        return self.success_response({
            "message": data["message"],
            "tools": data["tools"],
            "total": data["total"],
            "tip": "Use the exact names returned here when calling tools."
        })

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_mcp_tools",
            "description": "Alias for discovery: returns the same listing as list_available_tools. Prefer calling list_available_tools directly.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    })
    async def list_mcp_tools(self) -> ToolResult:
        data = self._enumerate_tools(include_descriptions=False)
        return self.success_response({
            "message": "MCP tool discovery redirected: using unified available tools list",
            "tools": data["tools"],
            "total": data["total"],
            "tip": "Call list_available_tools for full discovery."
        })


