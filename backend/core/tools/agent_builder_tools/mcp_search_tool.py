import json
from typing import Optional, Iterable
from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.agentpress.thread_manager import ThreadManager
from .base_tool import AgentBuilderBaseTool
from core.composio_integration.toolkit_service import ToolkitService
from core.composio_integration.composio_service import get_integration_service
from core.utils.logger import logger

@tool_metadata(
    display_name="MCP Server Search",
    description="Find and add external integrations and tools via MCP",
    icon="Plug",
    color="bg-blue-100 dark:bg-blue-800/50",
    weight=170,
    visible=True
)
class MCPSearchTool(AgentBuilderBaseTool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__(thread_manager, db_connection, agent_id)
        self._toolkit_service = ToolkitService()
        self._full_tool_cache: dict[str, dict] = {}

    def _summarize_text(self, text: str, max_length: int = 200) -> str:
        if not text:
            return ""
        text = text.strip()
        if len(text) <= max_length:
            return text
        return text[: max_length - 3].rstrip() + "..."

    def _serialize_toolkit(self, toolkit) -> dict:
        name = getattr(toolkit, "name", None) or getattr(toolkit, "toolkit_name", "") or ""
        slug = getattr(toolkit, "slug", None) or getattr(toolkit, "toolkit_slug", "") or ""
        description = getattr(toolkit, "description", None)
        if not description and name:
            description = f"{name} integration"

        auth_schemes = getattr(toolkit, "auth_schemes", None) or []
        managed_schemes = getattr(toolkit, "managed_auth_schemes", None) or []

        logo = getattr(toolkit, "logo", None)
        if not logo:
            meta = getattr(toolkit, "meta", None)
            if isinstance(meta, dict):
                logo = meta.get("logo")

        return {
            "name": name,
            "toolkit_slug": slug,
            "description": self._summarize_text(description),
            "auth_schemes": list(auth_schemes)[:4],
            "managed_auth_schemes": list(managed_schemes)[:4],
            "supports_managed_auth": bool(getattr(toolkit, "supports_managed_auth", False)),
            "logo_url": logo or "",
        }

    def _build_tool_result(self, toolkits: Iterable, limit: int) -> ToolResult:
        trimmed = []
        for toolkit in toolkits:
            if len(trimmed) >= limit:
                break
            trimmed.append(self._serialize_toolkit(toolkit))

        if not trimmed:
            return ToolResult(
                success=False,
                output=json.dumps([], ensure_ascii=False)
            )

        return ToolResult(
            success=True,
            output=json.dumps(trimmed, ensure_ascii=False)
        )

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "search_mcp_servers",
            "description": "Search for Composio toolkits based on user requirements. Use this when the user wants to add MCP tools to their agent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query for finding relevant Composio toolkits (e.g., 'linear', 'github', 'database', 'search')"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of toolkits to return (default: 10)",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        }
    })
    async def search_mcp_servers(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 10
    ) -> ToolResult:
        try:
            integration_service = get_integration_service()
            
            if query:
                toolkits_response = await integration_service.search_toolkits(query, category=category, limit=limit)
                toolkits = toolkits_response.get("items", [])
            else:
                toolkits_response = await self._toolkit_service.list_toolkits(limit=limit, category=category)
                toolkits = toolkits_response.get("items", [])
            
            return self._build_tool_result(toolkits, limit)
                
        except Exception as e:
            logger.error(f"Error searching Composio toolkits: {str(e)}")
            return self.fail_response("Error searching Composio toolkits")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "search_composio_toolkits",
            "description": "Lightweight search for Composio toolkits using server-side query/filtering. Prefer this over search_mcp_servers to avoid huge payloads.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query (e.g., 'trello', 'zendesk', 'crm'). MUST be a specific service name."
                    },
                    "category": {
                        "type": "string",
                        "description": "Optional category filter (e.g., 'crm', 'communication')"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return (default 8, max 25)",
                        "default": 8
                    }
                },
                "required": ["query"]
            }
        }
    })
    async def search_composio_toolkits(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 8
    ) -> ToolResult:
        try:
            safe_limit = max(1, min(limit, 25))
            response = await self._toolkit_service.search_toolkits(
                query=query,
                category=category,
                limit=safe_limit
            )
            toolkits = response.get("items", [])
            return self._build_tool_result(toolkits, safe_limit)
        except Exception as e:
            logger.error(f"Error performing targeted Composio search: {str(e)}")
            return self.fail_response("Error searching Composio toolkits")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_app_details",
            "description": "Get detailed information about a specific Composio toolkit, including available tools and authentication requirements.",
            "parameters": {
                "type": "object",
                "properties": {
                    "toolkit_slug": {
                        "type": "string",
                        "description": "The toolkit slug to get details for (e.g., 'github', 'linear', 'slack')"
                    }
                },
                "required": ["toolkit_slug"]
            }
        }
    })
    async def get_app_details(self, toolkit_slug: str) -> ToolResult:
        try:
            toolkit_service = ToolkitService()
            toolkit_data = await toolkit_service.get_toolkit_by_slug(toolkit_slug)
            
            if not toolkit_data:
                return self.fail_response(f"Could not find toolkit details for '{toolkit_slug}'")
            
            formatted_toolkit = {
                "name": toolkit_data.name,
                "toolkit_slug": toolkit_data.slug,
                "description": toolkit_data.description or f"Toolkit for {toolkit_data.name}",
                "logo_url": toolkit_data.logo or '',
                "auth_schemes": toolkit_data.auth_schemes,
                "tags": toolkit_data.tags,
                "categories": toolkit_data.categories
            }
            
            result = {
                "message": f"Retrieved details for {formatted_toolkit['name']}",
                "toolkit": formatted_toolkit,
                "supports_oauth": "OAUTH2" in toolkit_data.auth_schemes,
                "auth_schemes": toolkit_data.auth_schemes
            }
            
            return self.success_response(result)
            
        except Exception as e:
            logger.error(f"Error getting toolkit details: {str(e)}")
            return self.fail_response("Error getting toolkit details")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "discover_user_mcp_servers",
            "description": "Discover available MCP tools for a specific Composio profile. Use this to see what MCP tools are available for a connected profile.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile_id": {
                        "type": "string",
                        "description": "The profile ID from the Composio credential profile"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of tools to return (default 10, max 25)",
                        "default": 10
                    },
                    "search": {
                        "type": "string",
                        "description": "Optional keyword filter to narrow tools (e.g., 'card', 'webhook')"
                    },
                    "tool_slugs": {
                        "type": "array",
                        "description": "Specific tool slugs to retrieve (exact matches)",
                        "items": {"type": "string"}
                    },
                    "scopes": {
                        "type": "array",
                        "description": "Filter by required OAuth scopes",
                        "items": {"type": "string"}
                    }
                },
                "required": ["profile_id"]
            }
        }
    })
    async def discover_user_mcp_servers(
        self,
        profile_id: str,
        limit: int = 10,
        search: Optional[str] = None,
        tool_slugs: Optional[list[str]] = None,
        scopes: Optional[list[str]] = None,
    ) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            from core.composio_integration.composio_profile_service import ComposioProfileService
            from core.mcp_module.mcp_service import mcp_service
            
            profile_service = ComposioProfileService(self.db)
            profiles = await profile_service.get_profiles(account_id)
            
            profile = None
            for p in profiles:
                if p.profile_id == profile_id:
                    profile = p
                    break
            
            if not profile:
                return self.fail_response(f"Composio profile {profile_id} not found")
            
            if not profile.is_connected:
                return self.fail_response("Profile is not connected yet. Please connect the profile first.")
            
            if not profile.mcp_url:
                return self.fail_response("Profile has no MCP URL")
            
            request_limit = max(1, min(limit, 25))
            discover_config = {
                "url": profile.mcp_url,
                "options": {
                    "limit": request_limit,
                    "toolkits": [profile.toolkit_slug] if profile.toolkit_slug else None,
                    "search": search,
                    "tools": tool_slugs,
                    "scopes": scopes,
                }
            }
            result = await mcp_service.discover_custom_tools(
                request_type="http",
                config=discover_config
            )
            
            if not result.success:
                return self.fail_response("Failed to discover tools")
            
            available_tools = result.tools or []

            def _summarize_tool(tool: dict) -> dict:
                slug = tool.get("name") or tool.get("slug") or ""
                return {
                    "slug": slug,
                    "name": tool.get("display_name") or tool.get("name") or slug,
                    "description": self._summarize_text(tool.get("description") or "", 240),
                    "scopes": tool.get("scopes") or [],
                }

            summarized_tools = [_summarize_tool(tool) for tool in available_tools[:request_limit]]
            for tool in available_tools:
                slug = tool.get("name") or tool.get("slug")
                if slug:
                    self._full_tool_cache[slug] = tool

            response_payload = {
                "message": (
                    f"Found {len(summarized_tools)} MCP tools "
                    f"for {profile.toolkit_name} profile '{profile.profile_name}'"
                ),
                "profile_info": {
                    "profile_name": profile.profile_name,
                    "toolkit_name": profile.toolkit_name,
                    "toolkit_slug": profile.toolkit_slug,
                    "is_connected": profile.is_connected
                },
                "tools": summarized_tools,
                "total_tools": result.total_tools if hasattr(result, "total_tools") else len(available_tools)
            }

            if available_tools and len(available_tools) > request_limit:
                response_payload["note"] = (
                    f"Showing first {request_limit} tools. "
                    "Provide 'search', 'tool_slugs' or increase 'limit' (<=25) for more."
                )
            
            return self.success_response(response_payload)
            
        except Exception as e:
            logger.error(f"Error discovering MCP tools: {str(e)}")
            return self.fail_response("Error discovering MCP tools") 

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_discovered_tool_details",
            "description": "Fetch the full schema/details for a tool discovered via discover_user_mcp_servers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tool_slug": {
                        "type": "string",
                        "description": "Exact slug returned by discover_user_mcp_servers"
                    }
                },
                "required": ["tool_slug"]
            }
        }
    })
    async def get_discovered_tool_details(self, tool_slug: str) -> ToolResult:
        tool_data = self._full_tool_cache.get(tool_slug)
        if not tool_data:
            return self.fail_response(
                "Tool not found in cache. Run discover_user_mcp_servers first "
                "or specify the correct slug."
            )

        # Return sanitized payload
        sanitized = {
            "slug": tool_slug,
            "name": tool_data.get("display_name") or tool_data.get("name"),
            "description": tool_data.get("description"),
            "scopes": tool_data.get("scopes"),
            "inputs": tool_data.get("input_schema") or tool_data.get("input"),
            "outputs": tool_data.get("output_schema") or tool_data.get("output"),
            "raw": tool_data,  # allow access if needed downstream
        }
        return self.success_response({
            "message": f"Full schema for tool '{tool_slug}'",
            "tool": sanitized
        })