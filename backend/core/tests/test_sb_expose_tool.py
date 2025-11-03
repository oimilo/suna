import os

os.environ.setdefault("DAYTONA_API_KEY", "test-key")
os.environ.setdefault("DAYTONA_API_URL", "https://example.com")
os.environ.setdefault("DAYTONA_TARGET", "test-target")
os.environ.setdefault("DAYTONA_SERVER_URL", "https://example.com")

import sys
import types

import pytest

sandbox_stub = types.ModuleType("core.sandbox.sandbox")

async def _sandbox_stub(*args, **kwargs):
    raise RuntimeError("Sandbox access should not occur in URL helper tests")

sandbox_stub.get_or_start_sandbox = _sandbox_stub
sandbox_stub.create_sandbox = _sandbox_stub
sandbox_stub.delete_sandbox = _sandbox_stub
sandbox_stub.AsyncSandbox = object

sys.modules.setdefault("core.sandbox.sandbox", sandbox_stub)

from core.tools.sb_expose_tool import SandboxExposeTool


ENV_KEYS = (
    "NEXT_PUBLIC_BACKEND_URL",
    "BACKEND_URL",
    "APP_BACKEND_URL",
    "NEXT_PUBLIC_APP_URL",
    "APP_URL",
)


def _clear_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)


def test_normalize_base_candidate_strips_api_suffix() -> None:
    normalized = SandboxExposeTool._normalize_base_candidate("https://app.example.com/api")
    assert normalized == "https://app.example.com"


def test_normalize_base_candidate_handles_bare_domain() -> None:
    normalized = SandboxExposeTool._normalize_base_candidate("app.example.com")
    assert normalized == "https://app.example.com"


def test_build_proxy_url_preserves_nested_path() -> None:
    base = "https://app.example.com/workspace"
    url = SandboxExposeTool._build_proxy_url(base, "proj-123", 8080)
    assert url == "https://app.example.com/workspace/api/preview/proj-123/p/8080/"


def test_build_proxy_url_fallback_to_default_base() -> None:
    url = SandboxExposeTool._build_proxy_url("", "proj-123", 3000)
    assert url == "https://www.prophet.build/api/preview/proj-123/p/3000/"


def test_get_proxy_base_url_uses_first_valid_env(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    monkeypatch.setenv("NEXT_PUBLIC_APP_URL", "https://workspace.example.dev/api")
    tool = SandboxExposeTool(project_id="proj-123", thread_manager=None)
    assert tool._get_proxy_base_url() == "https://workspace.example.dev"


def test_get_proxy_base_url_falls_back_when_no_env(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_env(monkeypatch)
    tool = SandboxExposeTool(project_id="proj-123", thread_manager=None)
    assert tool._get_proxy_base_url() == "https://www.prophet.build"

