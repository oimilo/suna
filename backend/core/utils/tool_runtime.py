import copy
from typing import Any, Dict, List, Optional

import structlog

from core.utils.logger import logger


RUNTIME_TOOL_NAMES = [
    'sb_shell_tool', 'sb_files_tool', 'sb_expose_tool',
    'web_search_tool', 'image_search_tool', 'sb_vision_tool', 'sb_presentation_tool', 'sb_image_edit_tool',
    'sb_kb_tool', 'sb_design_tool', 'sb_upload_file_tool',
    'sb_docs_tool',
    'data_providers_tool', 'browser_tool', 'people_search_tool', 'company_search_tool',
    'agent_config_tool', 'mcp_search_tool', 'credential_profile_tool', 'trigger_tool',
    'agent_creation_tool'
]


def get_disabled_tools(agent_config: Optional[Dict[str, Any]]) -> List[str]:
    """Determine which tools should be disabled based on agent configuration."""
    disabled_tools: List[str] = []

    if not agent_config or 'agentpress_tools' not in agent_config:
        return disabled_tools

    raw_tools = agent_config.get('agentpress_tools')
    if not isinstance(raw_tools, dict):
        return disabled_tools

    if agent_config.get('is_suna_default', False) and not raw_tools:
        return disabled_tools

    def is_tool_enabled(tool_name: str) -> bool:
        try:
            tool_config = raw_tools.get(tool_name, True)
            if isinstance(tool_config, bool):
                return tool_config
            if isinstance(tool_config, dict):
                return tool_config.get('enabled', True)
            return True
        except Exception:
            return True

    for tool_name in RUNTIME_TOOL_NAMES:
        if not is_tool_enabled(tool_name):
            disabled_tools.append(tool_name)

    return disabled_tools


async def refresh_runtime_tools(
    thread_manager,
    db_connection,
    agent_id: str,
    account_id: str,
    agent_config: Optional[Dict[str, Any]]
) -> None:
    """Re-register tools in the current runtime after agent configuration changes."""
    if not agent_config:
        logger.debug("No agent_config provided; skipping runtime tool refresh")
        return

    context_vars = structlog.contextvars.get_contextvars()
    thread_id = context_vars.get('thread_id')
    if not thread_id:
        logger.debug("No thread_id in context; skipping runtime tool refresh")
        return

    client = await db_connection.client
    try:
        project_result = await client.table('threads')\
            .select('project_id')\
            .eq('thread_id', thread_id)\
            .maybe_single()\
            .execute()
    except Exception as exc:
        logger.warning(f"Failed to load project for runtime tool refresh: {exc}")
        return

    project_id = None
    if project_result.data:
        project_id = project_result.data.get('project_id')

    if not project_id:
        logger.debug(f"No project_id found for thread {thread_id}; skipping runtime tool refresh")
        return

    try:
        from core.run import ToolManager  # Local import to avoid circular dependency

        runtime_config = copy.deepcopy(agent_config)
        runtime_config.setdefault('account_id', account_id)

        tool_manager = ToolManager(thread_manager, project_id, thread_id, runtime_config)

        # Clear existing registrations before reloading
        thread_manager.tool_registry.tools = {}

        disabled_tools = get_disabled_tools(runtime_config)
        tool_manager.register_all_tools(agent_id=agent_id, disabled_tools=disabled_tools)

        logger.info("♻️ Runtime tool registry refreshed for agent %s on thread %s", agent_id, thread_id)
    except Exception as exc:
        logger.warning(f"Failed to refresh runtime tools for agent {agent_id}: {exc}", exc_info=True)

