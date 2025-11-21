import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from uuid import uuid4

import httpx
from composio_client import Composio
from core.services.supabase import DBConnection
from core.utils.config import config
from core.utils.logger import logger
from pydantic import BaseModel

DEFAULT_COMPOSIO_TIMEOUT = 15.0

from .client import ComposioClient, get_composio_client
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
        self.api_key = api_key or config.COMPOSIO_API_KEY or os.getenv("COMPOSIO_API_KEY")
        self.api_base = os.getenv("COMPOSIO_API_BASE", "https://backend.composio.dev").rstrip("/")
        self.toolkit_service = ToolkitService(api_key)
        self.auth_config_service = AuthConfigService(api_key)
        self.connected_account_service = ConnectedAccountService(api_key)
        self.mcp_server_service = MCPServerService(api_key)
        self.profile_service = ComposioProfileService(db_connection) if db_connection else None
    
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
                auth_scheme=auth_config.auth_scheme or "OAUTH2"
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

    async def search_toolkits_with_queries(
        self,
        queries: List[Dict[str, Any]],
        limit: int = 10,
        cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Call Composio's universal search endpoint (labs/tool_router/search-tools) with a list of queries.
        Falls back to the legacy ToolkitService search when Composio search fails or returns no results.
        """
        if not queries:
            raise ValueError("At least one query is required to search Composio toolkits")

        api_base, api_key = self._ensure_api_credentials()
        url = f"{api_base}/api/v3/labs/tool_router/search-tools"
        payload = {"queries": queries, "limit": limit}
        if cursor:
            payload["cursor"] = cursor

        try:
            async with httpx.AsyncClient(timeout=DEFAULT_COMPOSIO_TIMEOUT) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"x-api-key": api_key, "Content-Type": "application/json"},
                )
                response.raise_for_status()
                data = response.json()
                session_payload = self._normalize_session_info(data.get("session"), source="composio")
                normalized_results = self._normalize_search_results(
                    data.get("results"),
                    queries,
                    limit,
                )
                if normalized_results:
                    total = sum(len(entry["results"]) for entry in normalized_results)
                    return {
                        "source": "composio",
                        "session": session_payload,
                        "results": normalized_results,
                        "total_results": total,
                    }
                logger.info("Composio search returned no results, falling back to local search")
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Composio search API failed with status %s: %s",
                exc.response.status_code,
                exc.response.text,
            )
        except Exception as exc:
            logger.warning("Composio search API error", error=str(exc))

        return await self._search_toolkits_fallback(queries, limit)

    async def start_mcp_session(self) -> Dict[str, Any]:
        """
        Generate a Composio MCP session via session.generate({"generate_id": true}).
        Returns normalized payload with id, ttl and expires_at. Falls back to local session metadata on failure.
        """
        api_base, api_key = self._ensure_api_credentials()
        url = f"{api_base}/api/v3/labs/tool_router/session"
        payload = {"generate_id": True}
        try:
            async with httpx.AsyncClient(timeout=DEFAULT_COMPOSIO_TIMEOUT) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"x-api-key": api_key, "Content-Type": "application/json"},
                )
                response.raise_for_status()
                data = response.json()
                session_info = data.get("session") or data
                return self._normalize_session_info(session_info, source="composio")
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Composio session.generate failed with status %s: %s",
                exc.response.status_code,
                exc.response.text,
            )
        except Exception as exc:
            logger.warning("Composio session.generate error", error=str(exc))

        return self._build_local_session_payload()

    def _ensure_api_credentials(self) -> Tuple[str, str]:
        api_key = self.api_key or config.COMPOSIO_API_KEY or os.getenv("COMPOSIO_API_KEY")
        if not api_key:
            raise ValueError("COMPOSIO_API_KEY is not configured")
        return self.api_base, api_key

    def _normalize_session_info(self, session_data: Optional[Dict[str, Any]], source: str) -> Dict[str, Any]:
        if not isinstance(session_data, dict):
            return self._build_local_session_payload(source=source)

        session_id = (
            session_data.get("id")
            or session_data.get("session_id")
            or session_data.get("sessionId")
        )
        ttl = (
            session_data.get("ttl")
            or session_data.get("ttl_seconds")
            or session_data.get("ttlSeconds")
        )
        expires_at = session_data.get("expires_at") or session_data.get("expiresAt")
        generated = session_data.get("generated")

        if ttl is None and expires_at:
            parsed = self._parse_timestamp(expires_at)
            if parsed:
                ttl = max(int((parsed - datetime.now(timezone.utc)).total_seconds()), 0)

        payload = {
            "id": session_id,
            "ttl": ttl,
            "expires_at": expires_at,
            "generated": generated if generated is not None else bool(session_id),
            "source": source,
        }

        if not payload["id"]:
            return self._build_local_session_payload(source=source)

        return payload

    def _parse_timestamp(self, value: Optional[str]) -> Optional[datetime]:
        if not value or not isinstance(value, str):
            return None
        try:
            normalized = value.rstrip("Z")
            if value.endswith("Z"):
                normalized = f"{value[:-1]}+00:00"
            return datetime.fromisoformat(normalized)
        except ValueError:
            try:
                return datetime.fromisoformat(value)
            except Exception:
                return None

    def _build_local_session_payload(self, source: str = "local") -> Dict[str, Any]:
        return {
            "id": f"{source}-{uuid4()}",
            "ttl": None,
            "expires_at": None,
            "generated": False,
            "source": source,
        }

    def _normalize_search_results(
        self,
        raw_results: Optional[Any],
        queries: List[Dict[str, Any]],
        limit: int,
    ) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        if not raw_results:
            return normalized

        if isinstance(raw_results, list) and raw_results and isinstance(raw_results[0], dict) and "results" in raw_results[0]:
            for idx, entry in enumerate(raw_results[: len(queries)]):
                query_payload = entry.get("query") or queries[idx]
                normalized_results = [
                    self._normalize_toolkit_from_search(item)
                    for item in (entry.get("results") or [])[:limit]
                ]
                normalized.append(
                    {
                        "query": query_payload,
                        "results": normalized_results,
                        "total_results": len(normalized_results),
                    }
                )
            return normalized

        if isinstance(raw_results, list):
            # Treat as a flat list of toolkits
            normalized.append(
                {
                    "query": queries[0],
                    "results": [
                        self._normalize_toolkit_from_search(item)
                        for item in raw_results[:limit]
                    ],
                    "total_results": min(len(raw_results), limit),
                }
            )
            return normalized

        if isinstance(raw_results, dict):
            nested_results = raw_results.get("results")
            if isinstance(nested_results, list):
                normalized.append(
                    {
                        "query": raw_results.get("query") or queries[0],
                        "results": [
                            self._normalize_toolkit_from_search(item)
                            for item in nested_results[:limit]
                        ],
                        "total_results": min(len(nested_results), limit),
                    }
                )
        return normalized

    def _normalize_toolkit_from_search(self, item: Any) -> Dict[str, Any]:
        if hasattr(item, "__dict__"):
            item = item.__dict__

        if not isinstance(item, dict):
            return {
                "name": str(item),
                "toolkit_slug": "",
                "description": "",
                "logo_url": "",
                "auth_schemes": [],
                "managed_auth_schemes": [],
                "supports_managed_auth": False,
                "tags": [],
                "categories": [],
            }

        toolkit_info = item.get("toolkit") or item.get("app") or {}
        if hasattr(toolkit_info, "__dict__"):
            toolkit_info = toolkit_info.__dict__

        slug = item.get("toolkit_slug") or toolkit_info.get("slug") or item.get("slug") or ""
        logo = (
            item.get("logo")
            or toolkit_info.get("logo")
            or item.get("logo_url")
            or toolkit_info.get("logo_url")
        )
        description = (
            item.get("description")
            or toolkit_info.get("description")
            or ""
        )
        tags = item.get("tags") or toolkit_info.get("tags") or []
        categories = item.get("categories") or toolkit_info.get("categories") or []
        auth_schemes = item.get("auth_schemes") or toolkit_info.get("auth_schemes") or []
        managed_auth = item.get("managed_auth_schemes") or toolkit_info.get("managed_auth_schemes") or item.get("composio_managed_auth_schemes") or []
        supports_managed_auth = bool(item.get("supports_managed_auth") or ("OAUTH2" in [scheme.upper() for scheme in managed_auth if isinstance(scheme, str)]))

        return {
            "name": item.get("toolkit_name") or toolkit_info.get("name") or item.get("name", ""),
            "toolkit_slug": slug,
            "description": description,
            "logo_url": logo or "",
            "auth_schemes": auth_schemes,
            "managed_auth_schemes": managed_auth,
            "supports_managed_auth": supports_managed_auth,
            "tags": tags,
            "categories": categories,
        }

    def _toolkit_info_to_dict(self, toolkit: ToolkitInfo) -> Dict[str, Any]:
        return {
            "name": toolkit.name,
            "toolkit_slug": toolkit.slug,
            "description": toolkit.description or "",
            "logo_url": toolkit.logo or "",
            "auth_schemes": toolkit.auth_schemes,
            "managed_auth_schemes": getattr(toolkit, "managed_auth_schemes", []),
            "supports_managed_auth": getattr(toolkit, "supports_managed_auth", False),
            "tags": toolkit.tags,
            "categories": toolkit.categories,
        }

    async def _search_toolkits_fallback(self, queries: List[Dict[str, Any]], limit: int) -> Dict[str, Any]:
        fallback_query = queries[0]
        filters = fallback_query.get("filters") or {}
        use_case = (
            fallback_query.get("use_case")
            or fallback_query.get("query")
            or fallback_query.get("text")
            or ""
        )
        category = filters.get("category")

        toolkits_response = await self.toolkit_service.search_toolkits(
            use_case,
            category=category,
            limit=limit,
        )
        items = toolkits_response.get("items", [])[:limit]

        normalized_items = [
            self._toolkit_info_to_dict(item) if isinstance(item, ToolkitInfo) else item
            for item in items
        ]

        session_payload = self._build_local_session_payload()
        return {
            "source": "fallback",
            "session": session_payload,
            "results": [
                {
                    "query": fallback_query,
                    "results": normalized_items,
                    "total_results": len(normalized_items),
                }
            ],
            "total_results": len(normalized_items),
        }


def get_integration_service(api_key: Optional[str] = None, db_connection: Optional[DBConnection] = None) -> ComposioIntegrationService:
    return ComposioIntegrationService(api_key, db_connection)