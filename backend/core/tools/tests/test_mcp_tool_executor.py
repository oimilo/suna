import os

from cryptography.fernet import Fernet
import pytest


os.environ.setdefault("MCP_CREDENTIAL_ENCRYPTION_KEY", Fernet.generate_key().decode())

from core.tools.utils.mcp_tool_executor import MCPToolExecutor


@pytest.mark.asyncio
async def test_build_composio_tool_info_injects_session_header():
    executor = MCPToolExecutor(custom_tools={})

    base_tool = {
        "custom_config": {
            "headers": {"existing": "keep"},
        }
    }

    session_info = {"id": "sess-123"}
    updated = executor._build_composio_tool_info(base_tool, "https://mcp.example", session_info)

    headers = updated["custom_config"]["headers"]
    assert headers[executor._COMPOSIO_SESSION_HEADER] == "sess-123"
    assert headers["existing"] == "keep"
    assert updated["custom_config"]["url"] == "https://mcp.example"


@pytest.mark.asyncio
async def test_build_composio_tool_info_ignores_local_session():
    executor = MCPToolExecutor(custom_tools={})

    base_tool = {
        "custom_config": {
            "headers": {},
        }
    }

    session_info = {"id": "local-abc"}
    updated = executor._build_composio_tool_info(base_tool, "https://mcp.example", session_info)

    headers = updated["custom_config"].get("headers", {})
    assert executor._COMPOSIO_SESSION_HEADER not in headers


@pytest.mark.asyncio
async def test_post_process_payload_small_pass_through():
    executor = MCPToolExecutor(custom_tools={})

    payload = {"foo": "bar"}
    result = await executor._post_process_payload("sample", payload)

    assert result == payload


@pytest.mark.asyncio
async def test_post_process_payload_large_payload_gets_summary(monkeypatch):
    executor = MCPToolExecutor(custom_tools={})

    async def _fake_persist(serialized: str):
        assert serialized.strip().startswith("[")  # garante que a lista foi serializada
        return "https://storage.example/mcp.json"

    monkeypatch.setattr(executor, "_persist_payload", _fake_persist)

    payload = [{"index": i} for i in range(executor._LARGE_ITEM_THRESHOLD + 5)]
    result = await executor._post_process_payload("trello_tool", payload)

    assert result["truncated"] is True
    assert result["summary"]["kind"] == "list"
    assert result["summary"]["item_count"] == len(payload)
    assert len(result["preview"]) == executor._MAX_PREVIEW_ITEMS
    assert result["storage"]["url"] == "https://storage.example/mcp.json"
