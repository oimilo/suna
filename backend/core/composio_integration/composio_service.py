import os
from uuid import uuid4
from typing import Optional, List, Dict, Any
from composio_client import APIError, APIConnectionError, APITimeoutError, ComposioError
from core.utils.logger import logger
from pydantic import BaseModel
from core.services.supabase import DBConnection

from .client import get_composio_client
from .toolkit_service import ToolkitService, ToolkitInfo
from .auth_config_service import AuthConfigService, AuthConfig
from .connected_account_service import ConnectedAccountService, ConnectedAccount
from .mcp_server_service import MCPServerService, MCPServer, MCPUrlResponse
from .composio_profile_service import ComposioProfileService


class ComposioIntegrationResult(BaseModel):
    toolkit: ToolkitInfo
    auth_config: AuthConfig
    connected_account: ConnectedAccount
    mcp_server: MCPServer
    mcp_url_response: MCPUrlResponse
    final_mcp_url: str
    profile_id: Optional[str] = None


class ComposioIntegrationService:
    def __init__(self, api_key: Optional[str] = None, db_connection: Optional[DBConnection] = None):
        self.api_key = api_key
        self.client = get_composio_client(api_key)
        self.toolkit_service = ToolkitService(api_key)
        self.auth_config_service = AuthConfigService(api_key)
        self.connected_account_service = ConnectedAccountService(api_key)
        self.mcp_server_service = MCPServerService(api_key)
        self.profile_service = ComposioProfileService(db_connection) if db_connection else None

    # --- Universal MCP Search helpers ---------------------------------------------------------
    _UNIVERSAL_SEARCH_PATH = "/api/v3/labs/tool_router/search-tools"

    def _coerce_to_dict(self, value: Any) -> Dict[str, Any]:
        if value is None:
            return {}
        if isinstance(value, dict):
            return value
        if hasattr(value, "model_dump"):
            try:
                return value.model_dump()
            except Exception:
                pass
        if hasattr(value, "__dict__"):
            return dict(value.__dict__)
        return dict(value) if hasattr(value, "keys") else {}

    def _truncate(self, text: Optional[str], limit: int = 360) -> str:
        if not text:
            return ""
        text = str(text)
        if len(text) <= limit:
            return text
        return text[: limit - 3].rstrip() + "..."

    def _format_toolkit_result(self, raw: Any) -> Dict[str, Any]:
        data = self._coerce_to_dict(raw)

        name = data.get("name") or data.get("display_name") or data.get("toolkit_name") or ""
        slug = data.get("slug") or data.get("toolkit_slug") or data.get("app_slug") or ""

        description = (
            data.get("description")
            or data.get("summary")
            or data.get("long_description")
            or ""
        )

        logo = (
            data.get("logo_url")
            or data.get("logo")
            or data.get("icon")
            or (data.get("meta") or {}).get("logo")
        )

        categories = data.get("categories") or data.get("tags") or []
        if isinstance(categories, dict):
            categories = list(categories.values())
        if not isinstance(categories, list):
            categories = [categories] if categories else []

        auth_schemes = data.get("auth_schemes") or data.get("supported_auth") or []
        if isinstance(auth_schemes, str):
            auth_schemes = [auth_schemes]

        tags = data.get("tags") or []
        if isinstance(tags, dict):
            tags = list(tags.values())
        if not isinstance(tags, list):
            tags = [tags] if tags else []

        return {
            "name": name,
            "toolkit_slug": slug,
            "app_slug": slug,
            "description": self._truncate(description),
            "logo_url": logo,
            "auth_schemes": auth_schemes[:5] if isinstance(auth_schemes, list) else auth_schemes,
            "categories": categories[:10],
            "tags": tags[:10],
            "is_verified": bool(data.get("is_verified") or data.get("verified")),
            "source": data.get("source") or "composio",
        }

    def _infer_auth_type(self, auth_schemes: Optional[List[str]]) -> str:
        if not auth_schemes:
            return "unknown"
        normalized = [scheme.lower() for scheme in auth_schemes if isinstance(scheme, str)]
        if any("oauth" in scheme for scheme in normalized):
            return "oauth"
        if any("api" in scheme for scheme in normalized):
            return "api_key"
        return normalized[0] if normalized else "unknown"

    async def search_toolkits_with_queries(
        self,
        queries: List[Dict[str, Any]],
        *,
        limit: int = 10,
        session: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Use Composio's universal search when available, with graceful fallback."""
        if not queries:
            raise ValueError("At least one query is required for universal search.")

        payload: Dict[str, Any] = {
            "queries": queries,
            "limit": max(1, limit),
        }

        session_payload = session or {"generate_id": True}
        payload["session"] = session_payload

        search_source = "universal_search"
        formatted_results: List[Dict[str, Any]] = []
        session_info: Dict[str, Any] = {}

        try:
            response = self.client.post(  # type: ignore[attr-defined]
                self._UNIVERSAL_SEARCH_PATH,
                cast_to=dict,
                body=payload,
            )
            session_info = self._coerce_to_dict(response.get("session")) or session_payload
            raw_items = (
                response.get("results")
                or response.get("toolkits")
                or response.get("items")
                or []
            )
            if isinstance(raw_items, dict):
                raw_items = raw_items.get("data") or raw_items.get("items") or []

            if not isinstance(raw_items, list):
                raw_items = []

            formatted_results = []
            for item in raw_items[: max(1, limit)]:
                formatted = self._format_toolkit_result(item)
                formatted["auth_type"] = self._infer_auth_type(formatted.get("auth_schemes"))
                formatted_results.append(formatted)

            if not formatted_results:
                search_source = "fallback_empty"

        except (APIError, APIConnectionError, APITimeoutError, ComposioError, ValueError) as e:
            logger.warning(
                "Universal MCP search unavailable or failed, falling back to toolkit search: %s",
                e,
            )
            search_source = "fallback_error"
        except Exception as e:
            logger.error("Unexpected universal search failure: %s", e, exc_info=True)
            search_source = "fallback_error"

        if not formatted_results:
            primary_query = ""
            for query_entry in queries:
                if isinstance(query_entry, dict):
                    primary_query = (
                        query_entry.get("use_case")
                        or query_entry.get("query")
                        or query_entry.get("text")
                        or ""
                    )
                if primary_query:
                    break

            fallback_response = await self.toolkit_service.search_toolkits(
                primary_query,
                limit=limit,
            )
            fallback_items = fallback_response.get("items", [])
            formatted_results = []
            for item in fallback_items[: max(1, limit)]:
                formatted = self._format_toolkit_result(item)
                formatted["auth_type"] = self._infer_auth_type(formatted.get("auth_schemes"))
                formatted_results.append(formatted)

            if not session_info:
                session_info = {
                    "id": f"local-{uuid4()}",
                    "generated": True,
                }

        return {
            "results": formatted_results,
            "session": session_info,
            "limit": limit,
            "source": search_source,
        }

    async def start_mcp_session(
        self,
        session_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate or refresh a Composio MCP session for tool execution."""
        payload = session_payload or {"generate_id": True}

        try:
            response = self.client.post(  # type: ignore[attr-defined]
                "/api/v3/labs/tool_router/session",
                cast_to=dict,
                body=payload,
            )

            session_data = (
                response.get("session")
                if isinstance(response, dict)
                else None
            ) or response

            if not isinstance(session_data, dict):
                session_data = {}

            session_id = (
                session_data.get("id")
                or session_data.get("session_id")
                or session_data.get("sessionId")
            )

            ttl_value = (
                session_data.get("ttl")
                or session_data.get("ttl_seconds")
                or session_data.get("expires_in")
            )
            ttl_seconds: Optional[int] = None
            try:
                if ttl_value is not None:
                    ttl_seconds = int(ttl_value)
            except (TypeError, ValueError):
                ttl_seconds = None

            if session_id:
                result = {
                    "id": session_id,
                    "ttl": ttl_seconds,
                    "generated": session_data.get("generated", payload.get("generate_id", False)),
                }
                logger.debug("Generated Composio MCP session %s (ttl=%s)", session_id, ttl_seconds)
                return result

            logger.warning("Composio session response missing id, falling back to local session: %s", session_data)
        except (APIError, APIConnectionError, APITimeoutError, ComposioError) as e:
            logger.warning("Failed to generate Composio session via API: %s", e)
        except Exception as e:
            logger.error("Unexpected error generating Composio session: %s", e, exc_info=True)

        fallback_session = {
            "id": f"local-{uuid4()}",
            "ttl": 600,
            "generated": True,
        }
        return fallback_session

    async def integrate_toolkit(
        self, 
        toolkit_slug: str, 
        account_id: str,
        user_id: str,
        profile_name: Optional[str] = None,
        display_name: Optional[str] = None,
        mcp_server_name: Optional[str] = None,
        save_as_profile: bool = True,
        initiation_fields: Optional[Dict[str, str]] = None,
        custom_auth_config: Optional[Dict[str, str]] = None,
        use_custom_auth: bool = False
    ) -> ComposioIntegrationResult:
        try:
            logger.debug(f"Starting Composio integration for toolkit: {toolkit_slug}")
            logger.debug(f"Initiation fields: {initiation_fields}")
            logger.debug(f"Custom auth: {use_custom_auth}, Custom auth config: {bool(custom_auth_config)}")
            
            toolkit = await self.toolkit_service.get_toolkit_by_slug(toolkit_slug)
            if not toolkit:
                raise ValueError(f"Toolkit '{toolkit_slug}' not found")
            
            logger.debug(f"Step 1 complete: Verified toolkit {toolkit_slug}")
            
            # if toolkit_slug.lower() == "zendesk":
            #     zendesk_auth_config_id = os.getenv("ZENDESK_AUTH_CONFIG")
            #     if not zendesk_auth_config_id:
            #         raise ValueError("ZENDESK_AUTH_CONFIG environment variable is not set")
                
            #     logger.debug(f"Using existing Zendesk auth config from environment: {zendesk_auth_config_id}")
            #     logger.debug(f"Zendesk connection - User ID: {user_id}, Initiation fields: {initiation_fields}")
                
            #     auth_config = AuthConfig(
            #         id=zendesk_auth_config_id,
            #         auth_scheme="OAUTH2",
            #         is_composio_managed=True,
            #         restrict_to_following_tools=[],
            #         toolkit_slug=toolkit_slug
            #     )
                    
            #     logger.debug(f"Step 2 complete: Using Zendesk auth config {auth_config.id}")
            # else:
            #     auth_config = await self.auth_config_service.create_auth_config(
            #         toolkit_slug, 
            #         initiation_fields=initiation_fields
            #     )
            #     logger.debug(f"Step 2 complete: Created auth config {auth_config.id}")

            auth_config = await self.auth_config_service.create_auth_config(
                toolkit_slug, 
                initiation_fields=initiation_fields,
                custom_auth_config=custom_auth_config,
                use_custom_auth=use_custom_auth
            )
            logger.debug(f"Step 2 complete: Created {'custom' if use_custom_auth else 'managed'} auth config {auth_config.id}")
            
            connected_account = await self.connected_account_service.create_connected_account(
                auth_config_id=auth_config.id,
                user_id=user_id,
                initiation_fields=initiation_fields,
                auth_scheme=auth_config.auth_scheme
            )
            logger.debug(f"Step 3 complete: Connected account {connected_account.id}")
            
            mcp_server = await self.mcp_server_service.create_mcp_server(
                auth_config_ids=[auth_config.id],
                name=mcp_server_name,
                toolkit_name=toolkit.name
            )
            logger.debug(f"Step 4 complete: Created MCP server {mcp_server.id}")
            
            mcp_url_response = await self.mcp_server_service.generate_mcp_url(
                mcp_server_id=mcp_server.id,
                connected_account_ids=[connected_account.id],
                user_ids=[user_id]
            )
            logger.debug(f"Step 5 complete: Generated MCP URLs")
            
            final_mcp_url = mcp_url_response.user_ids_url[0] if mcp_url_response.user_ids_url else mcp_url_response.mcp_url
            
            profile_id = None
            if save_as_profile and self.profile_service:
                profile_name = profile_name or f"{toolkit.name} Integration"
                display_name = display_name or f"{toolkit.name} via Composio"
                
                composio_profile = await self.profile_service.create_profile(
                    account_id=account_id,
                    profile_name=profile_name,
                    toolkit_slug=toolkit_slug,
                    toolkit_name=toolkit.name,
                    mcp_url=final_mcp_url,
                    redirect_url=connected_account.redirect_url,
                    user_id=user_id,
                    is_default=False,
                    connected_account_id=connected_account.id
                )
                profile_id = composio_profile.profile_id
                logger.debug(f"Step 6 complete: Saved Composio credential profile {profile_id}")
            
            result = ComposioIntegrationResult(
                toolkit=toolkit,
                auth_config=auth_config,
                connected_account=connected_account,
                mcp_server=mcp_server,
                mcp_url_response=mcp_url_response,
                final_mcp_url=final_mcp_url,
                profile_id=profile_id
            )
            
            logger.debug(f"Successfully completed Composio integration for {toolkit_slug}")
            logger.debug(f"Final MCP URL: {final_mcp_url}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to integrate toolkit {toolkit_slug}: {e}", exc_info=True)
            raise
    
    async def list_available_toolkits(self, limit: int = 100, cursor: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
        return await self.toolkit_service.list_toolkits(limit=limit, cursor=cursor, category=category)
    
    async def search_toolkits(self, query: str, category: Optional[str] = None, limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        return await self.toolkit_service.search_toolkits(query, category=category, limit=limit, cursor=cursor)
    
    async def get_integration_status(self, connected_account_id: str) -> Dict[str, Any]:
        return await self.connected_account_service.get_auth_status(connected_account_id)


def get_integration_service(api_key: Optional[str] = None, db_connection: Optional[DBConnection] = None) -> ComposioIntegrationService:
    return ComposioIntegrationService(api_key, db_connection)
