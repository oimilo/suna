import os

# Minimal configuration required for importing AgentCreationTool without the full env setup
_ENV_DEFAULTS = {
    "SUPABASE_URL": "http://localhost:54321",
    "SUPABASE_ANON_KEY": "anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "service-role-key",
    "SUPABASE_JWT_SECRET": "jwt-secret",
    "REDIS_HOST": "localhost",
    "DAYTONA_API_KEY": "daytona-key",
    "DAYTONA_SERVER_URL": "http://daytona.local",
    "DAYTONA_TARGET": "local",
    "TAVILY_API_KEY": "tavily-key",
    "RAPID_API_KEY": "rapid-key",
    "FIRECRAWL_API_KEY": "firecrawl-key",
}

for key, value in _ENV_DEFAULTS.items():
    os.environ.setdefault(key, value)

from core.utils.agent_config_builder import build_agent_config, normalize_mcp_entries


def test_build_agent_config_includes_required_sections():
    config, metadata = build_agent_config(
        system_prompt="Test prompt",
        model="gpt-4",
        agentpress_tools={
            "ask_tool": True,
            "custom_tool": {"enabled": False, "description": "Custom tool"},
        },
        configured_mcps=[{"name": "gmail", "config": {"profile_id": "123"}}],
        custom_mcps=[{"name": "custom", "type": "sse"}],
        icon_name="rocket",
        icon_color="#FFFFFF",
        icon_background="#000000",
        is_default=False,
    )

    assert config["system_prompt"] == "Test prompt"
    assert config["model"] == "gpt-4"
    assert "agentpress" in config["tools"]
    assert config["tools"]["agentpress"]["ask_tool"] is True
    assert config["tools"]["agentpress"]["custom_tool"]["enabled"] is False
    assert config["tools"]["mcp"] == [{"name": "gmail", "config": {"profile_id": "123"}}]
    assert config["tools"]["custom_mcp"] == [{"name": "custom", "type": "sse"}]
    assert config["metadata"]["created_with_agent_builder"] is True
    assert config["metadata"]["icon_name"] == "rocket"
    assert metadata["created_with_agent_builder"] is True
    assert metadata["restrictions"]["system_prompt_editable"] is True
    assert metadata["restrictions"]["tools_editable"] is True
    assert metadata["is_suna_default"] is False


def test_build_agent_config_filters_invalid_mcp_entries():
    config, _ = build_agent_config(
        system_prompt="",
        model=None,
        agentpress_tools=None,
        configured_mcps=[{"name": "valid"}, None, "oops"],
        custom_mcps=[None, {"name": "also-valid"}],
        icon_name=None,
        icon_color=None,
        icon_background=None,
    )

    assert config["tools"]["mcp"] == [{"name": "valid"}]
    assert config["tools"]["custom_mcp"] == [{"name": "also-valid"}]


def test_build_agent_config_merges_metadata_overrides():
    base_metadata = {
        "centrally_managed": True,
        "restrictions": {"name_editable": False, "mcps_editable": False},
    }

    _, metadata = build_agent_config(
        system_prompt="Prompt",
        model=None,
        agentpress_tools={},
        configured_mcps=[],
        custom_mcps=[],
        icon_name=None,
        icon_color=None,
        icon_background=None,
        base_metadata=base_metadata,
    )

    assert metadata["centrally_managed"] is True
    assert metadata["restrictions"]["name_editable"] is False
    assert metadata["restrictions"]["mcps_editable"] is False
    # Defaults should still be present
    assert metadata["restrictions"]["system_prompt_editable"] is True


def test_normalize_mcp_entries_handles_non_dict_values():
    entries = normalize_mcp_entries([{"name": "valid"}, "oops", None, 123, {"name": "another"}])
    assert entries == [{"name": "valid"}, {"name": "another"}]
