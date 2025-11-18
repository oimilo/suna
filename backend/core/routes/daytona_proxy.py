"""
Proxy endpoints that forward Daytona sandbox preview traffic through the backend.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from datetime import datetime, timezone
import asyncio

import httpx
import aiohttp
from aiohttp import (
    ClientSession,
    ClientTimeout,
    ClientWebSocketResponse,
    ClientConnectorError,
    WSServerHandshakeError,
    WSMsgType,
)
from fastapi import APIRouter, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, status
from starlette.websockets import WebSocketState

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

    vnc_preview = sandbox_info.get("vnc_preview")
    if vnc_preview:
        vnc_preview = vnc_preview.rstrip("/")

    preview_token = sandbox_info.get("preview_token") or sandbox_info.get("token")

    if _should_refresh_preview_token(sandbox_info):
        try:
            sandbox_info = await _refresh_preview_target(client, project_row.get("project_id"), sandbox_id, sandbox_info)
            sandbox_url = sandbox_info.get("sandbox_url", sandbox_url)
            refreshed_vnc_preview = sandbox_info.get("vnc_preview")
            if refreshed_vnc_preview:
                vnc_preview = refreshed_vnc_preview.rstrip("/")
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
        "vnc_preview": vnc_preview,
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


def _is_vnc_request(path: str, request: Request) -> bool:
    """
    Determine whether the incoming request should target the VNC preview endpoint.

    The VNC UI serves multiple asset paths (HTML, JS, WebSocket upgrades) that all need
    to be proxied to the Daytona 6080 port. We first inspect the requested path and then
    fall back to the Referer header to catch secondary asset loads.
    """

    normalized_path = (path or "").lstrip("/").lower()
    if not normalized_path:
        return False

    vnc_path_prefixes = (
        "vnc",
        "websockify",
    )
    if normalized_path.startswith(vnc_path_prefixes):
        return True

    referer = (request.headers.get("referer") or "").lower()
    if referer:
        referer_markers = ("vnc_lite.html", "vnc.html", "vnc_auto.html", "vnc_playback.html", "/novnc/")
        if any(marker in referer for marker in referer_markers):
            return True

    return False


async def _proxy_request(sandbox_id: str, path: str, request: Request) -> Response:
    metadata = await _get_project_sandbox_metadata(sandbox_id)

    base_url = metadata["sandbox_url"]
    if metadata.get("vnc_preview") and _is_vnc_request(path, request):
        base_url = metadata["vnc_preview"]

    upstream_url = _build_target_url(
        base_url,
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


def _build_websocket_target_url(base_url: str, path: str, query_string: str) -> str:
    base = base_url.rstrip("/")
    if base.startswith("https://"):
        base = "wss://" + base.removeprefix("https://")
    elif base.startswith("http://"):
        base = "ws://" + base.removeprefix("http://")

    target = f"{base}/{path.lstrip('/')}" if path else base
    if query_string:
        return f"{target}?{query_string}"
    return target


def _prepare_websocket_headers(websocket: WebSocket, preview_token: Optional[str]) -> Dict[str, str]:
    headers: Dict[str, str] = {}

    origin = websocket.headers.get("origin")
    if origin:
        headers["Origin"] = origin

    user_agent = websocket.headers.get("user-agent")
    if user_agent:
        headers["User-Agent"] = user_agent

    if config.DAYTONA_PREVIEW_SKIP_WARNING:
        headers.setdefault("X-Daytona-Skip-Preview-Warning", "true")
    if config.DAYTONA_PREVIEW_DISABLE_CORS:
        headers.setdefault("X-Daytona-Disable-CORS", "true")
    if preview_token:
        headers["X-Daytona-Preview-Token"] = preview_token

    client_host = websocket.client.host if websocket.client else None
    if client_host:
        headers["X-Forwarded-For"] = client_host

    headers.setdefault("X-Forwarded-Proto", websocket.url.scheme)
    headers.setdefault("X-Forwarded-Host", websocket.url.hostname or "")
    return headers


async def _relay_client_to_upstream(websocket: WebSocket, upstream: ClientWebSocketResponse) -> None:
    try:
        while True:
            message = await websocket.receive()
            message_type = message.get("type")
            if message_type == "websocket.disconnect":
                await upstream.close(code=message.get("code", 1000))
                break
            if message.get("text") is not None:
                await upstream.send_str(message["text"])
            elif message.get("bytes") is not None:
                await upstream.send_bytes(message["bytes"])
    except WebSocketDisconnect as exc:
        await upstream.close(code=exc.code or 1000)


async def _relay_upstream_to_client(upstream: ClientWebSocketResponse, websocket: WebSocket) -> None:
    try:
        async for message in upstream:
            if message.type == WSMsgType.TEXT:
                await websocket.send_text(message.data)
            elif message.type == WSMsgType.BINARY:
                await websocket.send_bytes(message.data)
            elif message.type == WSMsgType.PING:
                await upstream.pong(message.data)
            elif message.type == WSMsgType.PONG:
                continue
            elif message.type == WSMsgType.CLOSE:
                if websocket.application_state == WebSocketState.CONNECTED:
                    await websocket.close(code=upstream.close_code or 1000)
                break
            elif message.type == WSMsgType.ERROR:
                if websocket.application_state == WebSocketState.CONNECTED:
                    await websocket.close(code=1011, reason=str(upstream.exception()))
                break
    except aiohttp.ClientConnectionError as exc:
        if websocket.application_state == WebSocketState.CONNECTED:
            await websocket.close(code=1011, reason=str(exc))


def _get_query_string_from_websocket(websocket: WebSocket) -> str:
    raw = websocket.scope.get("query_string")
    if raw:
        if isinstance(raw, bytes):
            return raw.decode()
        return str(raw)
    return ""


async def _proxy_websocket_request(sandbox_id: str, path: str, websocket: WebSocket) -> None:
    metadata = await _get_project_sandbox_metadata(sandbox_id)
    vnc_base = metadata.get("vnc_preview")
    if not vnc_base:
        logger.error("VNC preview URL missing for sandbox_id=%s", sandbox_id)
        await websocket.close(code=1011, reason="Sandbox VNC endpoint unavailable")
        return

    query_string = _get_query_string_from_websocket(websocket)
    target_url = _build_websocket_target_url(vnc_base, path, query_string)
    headers = _prepare_websocket_headers(websocket, metadata.get("preview_token"))

    await websocket.accept()

    try:
        timeout = ClientTimeout(total=None, sock_connect=10)
        async with ClientSession(timeout=timeout) as session:
            async with session.ws_connect(
                target_url,
                headers=headers,
                receive_timeout=None,
                autoping=True,
            ) as upstream:
                logger.debug(
                    "Proxied VNC websocket sandbox_id=%s target=%s",
                    sandbox_id,
                    target_url,
                )
                await asyncio.gather(
                    _relay_client_to_upstream(websocket, upstream),
                    _relay_upstream_to_client(upstream, websocket),
                )
    except (WSServerHandshakeError, ClientConnectorError, aiohttp.ClientError) as exc:
        logger.error(
            "Failed to proxy VNC websocket for sandbox_id=%s target=%s: %s",
            sandbox_id,
            target_url,
            exc,
        )
        await websocket.close(code=1011, reason="Failed to reach sandbox VNC")


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


@router.websocket("/{sandbox_id}/websockify")
async def proxy_preview_websocket(sandbox_id: str, websocket: WebSocket) -> None:
    await _proxy_websocket_request(sandbox_id, "websockify", websocket)


@router.websocket("/{sandbox_id}/websockify/{path:path}")
async def proxy_preview_websocket_path(sandbox_id: str, path: str, websocket: WebSocket) -> None:
    target_path = f"websockify/{path.lstrip('/')}" if path else "websockify"
    await _proxy_websocket_request(sandbox_id, target_path, websocket)


def _should_refresh_preview_token(sandbox_info: Dict[str, Any]) -> bool:
    """Determine whether the preview token should be refreshed."""
    ttl_seconds = config.DAYTONA_PREVIEW_TOKEN_TTL
    if not ttl_seconds:
        return False
    preview_token = sandbox_info.get("preview_token") or sandbox_info.get("token")
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

