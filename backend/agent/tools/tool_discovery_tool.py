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

            # Merge MCP dynamic tools if wrapper is present
            try:
                mcp_wrapper = None
                for _, info in tools.items():
                    from agent.tools.mcp_tool_wrapper import MCPToolWrapper  # local import to avoid cycles
                    if isinstance(info.get("instance"), MCPToolWrapper):
                        mcp_wrapper = info.get("instance")
                        break
                if mcp_wrapper and hasattr(mcp_wrapper, "get_available_tools"):
                    mcp_tools = self.thread_manager.tool_registry.tools
                    # Already registered dynamic tools are in registry; if needed, could call wrapper.get_available_tools()
            except Exception:
                pass

            tool_names: List[str] = sorted(list(tools.keys()))

            if not include_descriptions:
                return {
                    "message": f"Found {len(tool_names)} available tool(s)",
                    "tools": tool_names,
                    "total": len(tool_names),
                }

            described: List[Dict[str, str]] = []
            for name in tool_names:
                try:
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


