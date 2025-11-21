import httpx
import pytest
from unittest.mock import AsyncMock

from core.composio_integration.composio_service import ComposioIntegrationService


class DummyResponse:
    def __init__(self, data: dict, status_code: int = 200):
        self._data = data
        self.status_code = status_code

    def json(self):
        return self._data

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("POST", "https://example.com")
            response = httpx.Response(self.status_code, request=request)
            raise httpx.HTTPStatusError("error", request=request, response=response)


class DummyClient:
    def __init__(self, response=None, exc: Exception | None = None):
        self._response = response
        self._exc = exc

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def post(self, *args, **kwargs):
        if self._exc:
            raise self._exc
        return self._response


@pytest.mark.asyncio
async def test_search_toolkits_with_queries_success(monkeypatch):
    payload = {
        "session": {"id": "session-123", "ttl": 30},
        "results": [
            {
                "query": {"use_case": "github"},
                "results": [
                    {
                        "toolkit": {"name": "GitHub", "slug": "github"},
                        "description": "Manage repositories",
                        "logo": "https://logo",
                        "tags": ["code"],
                        "categories": ["devops"],
                    }
                ],
                "total_results": 1,
            }
        ],
    }

    dummy_response = DummyResponse(payload)
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *args, **kwargs: DummyClient(response=dummy_response),
    )

    service = ComposioIntegrationService(api_key="test-key")
    result = await service.search_toolkits_with_queries(
        queries=[{"use_case": "github"}],
        limit=5,
    )

    assert result["source"] == "composio"
    assert result["session"]["id"] == "session-123"
    assert result["results"][0]["results"][0]["name"] == "GitHub"
    assert result["results"][0]["total_results"] == 1


@pytest.mark.asyncio
async def test_search_toolkits_with_queries_fallback(monkeypatch):
    request = httpx.Request("POST", "https://backend.composio.dev/api/v3/labs/tool_router/search-tools")
    response = httpx.Response(500, request=request)
    error = httpx.HTTPStatusError("boom", request=request, response=response)

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *args, **kwargs: DummyClient(exc=error),
    )

    fallback_result = {"source": "fallback", "results": []}
    fallback_mock = AsyncMock(return_value=fallback_result)
    monkeypatch.setattr(
        ComposioIntegrationService,
        "_search_toolkits_fallback",
        fallback_mock,
    )

    service = ComposioIntegrationService(api_key="test-key")
    result = await service.search_toolkits_with_queries(
        queries=[{"use_case": "crm"}],
        limit=3,
    )

    fallback_mock.assert_awaited_once()
    assert result == fallback_result


@pytest.mark.asyncio
async def test_start_mcp_session_success(monkeypatch):
    payload = {"session": {"id": "session-xyz", "ttl": 120, "generated": True}}
    dummy_response = DummyResponse(payload)

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *args, **kwargs: DummyClient(response=dummy_response),
    )

    service = ComposioIntegrationService(api_key="test-key")
    session_info = await service.start_mcp_session()

    assert session_info["id"] == "session-xyz"
    assert session_info["source"] == "composio"
    assert session_info["generated"] is True


@pytest.mark.asyncio
async def test_start_mcp_session_local_fallback(monkeypatch):
    error = RuntimeError("network down")

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *args, **kwargs: DummyClient(exc=error),
    )

    service = ComposioIntegrationService(api_key="test-key")
    session_info = await service.start_mcp_session()

    assert session_info["id"].startswith("local-")
    assert session_info["source"] == "local"
    assert session_info["generated"] is False

