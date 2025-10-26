import os

import pytest

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

from core.agent_loader import AgentLoader


def test_row_to_agent_data_parses_metadata_string():
    loader = AgentLoader(db=object())
    row = {
        "agent_id": "abc",
        "name": "Test",
        "description": None,
        "account_id": "acct",
        "is_default": False,
        "is_public": False,
        "tags": [],
        "icon_name": None,
        "icon_color": None,
        "icon_background": None,
        "created_at": "2024-10-24T00:00:00Z",
        "updated_at": "2024-10-24T00:00:00Z",
        "current_version_id": None,
        "version_count": 1,
        "metadata": '{"is_suna_default": false, "restrictions": {"name_editable": true}}',
    }

    agent = loader._row_to_agent_data(row)
    assert agent.metadata["restrictions"]["name_editable"] is True
    assert agent.restrictions == {"name_editable": True}


def test_apply_version_config_handles_missing_lists():
    loader = AgentLoader(db=object())
    agent = loader._row_to_agent_data(
        {
            "agent_id": "abc",
            "name": "Test",
            "description": None,
            "account_id": "acct",
            "is_default": False,
            "is_public": False,
            "tags": [],
            "icon_name": None,
            "icon_color": None,
            "icon_background": None,
            "created_at": "2024-10-24T00:00:00Z",
            "updated_at": "2024-10-24T00:00:00Z",
            "current_version_id": None,
            "version_count": 1,
            "metadata": {},
        }
    )

    loader._apply_version_config(
        agent,
        {
            "version_name": "v1",
            "version_number": 1,
            "config": {
                "system_prompt": "hi",
                "model": "gpt-4",
                "tools": {
                    "agentpress": {"foo": {"enabled": True}},
                    "mcp": None,
                    "custom_mcp": None,
                },
                "triggers": None,
            },
        },
    )

    assert agent.system_prompt == "hi"
    assert agent.configured_mcps == []
    assert agent.custom_mcps == []
    assert agent.triggers == []
    assert agent.agentpress_tools["foo"]["enabled"] is True


def test_load_fallback_config_preserves_metadata_restrictions():
    loader = AgentLoader(db=object())
    agent = loader._row_to_agent_data(
        {
            "agent_id": "abc",
            "name": "Test",
            "description": None,
            "account_id": "acct",
            "is_default": False,
            "is_public": False,
            "tags": [],
            "icon_name": None,
            "icon_color": None,
            "icon_background": None,
            "created_at": "2024-10-24T00:00:00Z",
            "updated_at": "2024-10-24T00:00:00Z",
            "current_version_id": None,
            "version_count": 1,
            "metadata": {"restrictions": {"tools_editable": False}},
        }
    )

    loader._load_fallback_config(agent)
    assert agent.restrictions == {"tools_editable": False}
