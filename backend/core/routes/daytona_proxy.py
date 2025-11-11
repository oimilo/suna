"""
Proxy endpoints that forward Daytona sandbox preview traffic through the backend.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException, Request, Response, status

from core.services.supabase import DBConnection
from core.utils.config import config
from core.utils.logger import logger
from core.sandbox.sandbox import get_or_start_sandbox

router = APIRouter()

_db: Optional[DBConnection] = None


def initialize(db: DBConnection) -> None:
    """
    Initialize module level state.

    Parameters
    ----------
    db:
        Shared Supabase connection manager created during app startup.
    """

    global _db
    _db = db
    logger.debug("Daytona preview proxy initialized with database connection")


async def _get_project_sandbox_metadata(sandbox_id: str) -> Dict[str, Any]:
    if _db is None:
        logger.error("Daytona preview proxy accessed before initialization")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Preview proxy not initialized")

    client = await _db.client
    query = (
        client.table("projects")
        .select("project_id,sandbox")
        .filter("sandbox->>id", "eq", sandbox_id)
        .limit(1)
    )

    result = await query.execute()
    if not result.data:
        logger.warning("No sandbox metadata found for sandbox_id=%s", sandbox_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sandbox preview not found")

    project_row = result.data[0]
    sandbox_info = project_row.get("sandbox") or {}

    sandbox_url = sandbox_info.get("sandbox_url")
    if not sandbox_url:
        logger.error("Sandbox metadata missing sandbox_url for sandbox_id=%s", sandbox_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sandbox preview URL is not available"
        )

    preview_token = sandbox_info.get("preview_token") or sandbox_info.get("token")

    if _should_refresh_preview_token(sandbox_info):
        try:
            sandbox_info = await _refresh_preview_target(client, project_row.get("project_id"), sandbox_id, sandbox_info)
            sandbox_url = sandbox_info.get("sandbox_url", sandbox_url)
            preview_token = sandbox_info.get("preview_token") or sandbox_info.get("token")
        except Exception as exc:
            logger.error(
                "Failed to refresh Daytona preview token for sandbox_id=%s: %s",
                sandbox_id,
                exc,
            )

    return {
        "project_id": project_row.get("project_id"),
        "sandbox_url": sandbox_url.rstrip("/"),
        "preview_token": preview_token,
    }


def _build_target_url(base_url: str, relative_path: str, query_string: str) -> str:
    if relative_path:
        target = f"{base_url}/{relative_path.lstrip('/')}"
    else:
        target = base_url

    if query_string:
        return f"{target}?{query_string}"
    return target


def _prepare_forward_headers(request: Request, preview_token: Optional[str]) -> Dict[str, str]:
    forward_headers: Dict[str, str] = {}
    for key, value in request.headers.items():
        # Skip hop-by-hop headers
        if key.lower() in ("host", "content-length", "connection", "keep-alive"):
            continue
        forward_headers[key] = value

    if config.DAYTONA_PREVIEW_SKIP_WARNING:
        forward_headers.setdefault("X-Daytona-Skip-Preview-Warning", "true")
    if config.DAYTONA_PREVIEW_DISABLE_CORS:
        forward_headers.setdefault("X-Daytona-Disable-CORS", "true")
    if preview_token and "X-Daytona-Preview-Token" not in forward_headers:
        forward_headers["X-Daytona-Preview-Token"] = preview_token

    # Forward proxy metadata
    client_host = request.client.host if request.client else None
    if client_host:
        existing_forwarded_for = forward_headers.get("X-Forwarded-For")
        forward_headers["X-Forwarded-For"] = (
            f"{existing_forwarded_for}, {client_host}"
            if existing_forwarded_for
            else client_host
        )

    forward_headers.setdefault("X-Forwarded-Proto", request.url.scheme)
    forward_headers.setdefault("X-Forwarded-Host", request.url.hostname or "")

    return forward_headers


def _transform_response_headers(upstream_headers: httpx.Headers) -> Dict[str, str]:
    excluded = {
        "content-length",
        "transfer-encoding",
        "connection",
    }
    return {
        key: value
        for key, value in upstream_headers.items()
        if key.lower() not in excluded
    }


async def _proxy_request(sandbox_id: str, path: str, request: Request) -> Response:
    metadata = await _get_project_sandbox_metadata(sandbox_id)
    upstream_url = _build_target_url(
        metadata["sandbox_url"],
        path,
        request.url.query
    )

    headers = _prepare_forward_headers(request, metadata["preview_token"])
    body = await request.body()

    timeout = httpx.Timeout(30.0, connect=10.0)
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
            upstream_response = await client.request(
                request.method,
                upstream_url,
                headers=headers,
                content=body if body else None,
            )
    except httpx.RequestError as exc:
        logger.error(
            "Failed to proxy preview request for sandbox_id=%s target=%s: %s",
            sandbox_id,
            upstream_url,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to reach sandbox preview",
        ) from exc

    response_headers = _transform_response_headers(upstream_response.headers)
    logger.debug(
        "Proxied preview request sandbox_id=%s path=%s status=%s",
        sandbox_id,
        path or "/",
        upstream_response.status_code,
    )

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
        media_type=upstream_response.headers.get("content-type"),
    )


@router.api_route("/{sandbox_id}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_preview_root(sandbox_id: str, request: Request) -> Response:
    """
    Forward requests hitting the base sandbox preview URL.
    """

    return await _proxy_request(sandbox_id, "", request)


@router.api_route("/{sandbox_id}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_preview_path(sandbox_id: str, path: str, request: Request) -> Response:
    """
    Forward requests to nested paths for a sandbox preview.
    """

    return await _proxy_request(sandbox_id, path, request)


def _should_refresh_preview_token(sandbox_info: Dict[str, Any]) -> bool:
    """Determine whether the preview token should be refreshed."""
    ttl_seconds = config.DAYTONA_PREVIEW_TOKEN_TTL
    if not ttl_seconds:
        return False

    generated_raw = sandbox_info.get("preview_token_generated_at")
    if not preview_token:
        return generated_raw is None

    if not generated_raw:
        return True

    try:
        generated_at = datetime.fromisoformat(generated_raw)
        if generated_at.tzinfo is None:
            generated_at = generated_at.replace(tzinfo=timezone.utc)
    except ValueError:
        return True

    age_seconds = (datetime.now(timezone.utc) - generated_at).total_seconds()
    return age_seconds >= ttl_seconds


async def _refresh_preview_target(client, project_id: Optional[str], sandbox_id: str, sandbox_info: Dict[str, Any]) -> Dict[str, Any]:
    """Refresh sandbox preview metadata (URL + token) and persist it."""
    if not project_id:
        raise RuntimeError("Project ID is required to refresh preview metadata")

    sandbox = await get_or_start_sandbox(sandbox_id)
    website_link = await sandbox.get_preview_link(8080)
    sandbox_url = website_link.url if hasattr(website_link, "url") else _parse_link_field(website_link, "url")
    preview_token = _extract_link_token(website_link)
    preview_token_generated_at = datetime.now(timezone.utc).isoformat()

    updated_metadata = dict(sandbox_info)
    updated_metadata["sandbox_url"] = sandbox_url
    updated_metadata["preview_token"] = preview_token
    updated_metadata["preview_token_generated_at"] = preview_token_generated_at

    await client.table("projects").update({"sandbox": updated_metadata}).eq("project_id", project_id).execute()
    logger.debug("Refreshed Daytona preview metadata for sandbox_id=%s", sandbox_id)
    return updated_metadata


def _extract_link_token(link: Any) -> Optional[str]:
    if hasattr(link, "token"):
        return link.token
    return _parse_link_field(link, "token")


def _parse_link_field(link: Any, field: str) -> Optional[str]:
    if not link:
        return None

    marker = f"{field}='"
    raw = str(link)
    if marker in raw:
        try:
            return raw.split(marker)[1].split("'")[0]
        except IndexError:
            return None
    return None

