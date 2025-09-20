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

            # Apenas ferramentas realmente registradas (executáveis via function calling)
            combined_names: List[str] = list(tools.keys())

            # Apply allowlist se existir (aceita nome qualificado ou sufixo curto) — não mistura nomes MCP remotos aqui
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
                    "message": f"Found {len(tool_names)} registered tool(s)",
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
                    described.append({"name": name, "description": desc, "source": "registry"})
                except Exception:
                    described.append({"name": name, "description": "", "source": "registry"})

            return {
                "message": f"Found {len(tool_names)} registered tool(s)",
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
        """Listar SOMENTE ferramentas remotas do MCP (nomes com hífen), não registradas.

        Percorre o registry para achar o MCPToolWrapper ativo e consulta as tools remotas.
        """
        try:
            registry = getattr(self.thread_manager, 'tool_registry', None)
            if not registry or not hasattr(registry, 'tools'):
                return self.success_response({
                    "message": "No tool registry available",
                    "tools": [],
                    "total": 0
                })

            # Localizar MCPToolWrapper
            mcp_wrapper = None
            for _, info in registry.tools.items():
                try:
                    inst = info.get('instance') if isinstance(info, dict) else None
                    # Evitar importar aqui para não quebrar dependências
                    if inst and inst.__class__.__name__ == 'MCPToolWrapper':
                        mcp_wrapper = inst
                        break
                except Exception:
                    continue

            if not mcp_wrapper or not hasattr(mcp_wrapper, 'get_available_tools'):
                return self.success_response({
                    "message": "No MCP wrapper initialized",
                    "tools": [],
                    "total": 0
                })

            remotes = await mcp_wrapper.get_available_tools()
            names: List[str] = []
            described: List[Dict[str, str]] = []
            for t in remotes or []:
                try:
                    name = t.get('name') or ((t.get('function') or {}).get('name'))
                    desc = t.get('description') or ((t.get('function') or {}).get('description') or '')
                    if not name:
                        continue
                    names.append(name)
                    described.append({"name": name, "description": desc, "source": "mcp"})
                except Exception:
                    continue

            names = sorted(set(names))
            return self.success_response({
                "message": f"Found {len(names)} MCP remote tool(s)",
                "tools": described,
                "total": len(names),
                "tip": "Use call_mcp_tool com o nome remoto exato (com hífen)."
            })
        except Exception as e:
            logger.error(f"Error listing MCP remote tools: {e}")
            return self.fail_response(f"Error listing MCP tools: {str(e)}")


