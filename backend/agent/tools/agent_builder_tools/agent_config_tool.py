import json
from typing import Optional, Dict, Any
from agentpress.tool import ToolResult, openapi_schema, xml_schema
from agentpress.thread_manager import ThreadManager
from .base_tool import AgentBuilderBaseTool
from utils.logger import logger
from agent.config_helper import build_unified_config


class AgentConfigTool(AgentBuilderBaseTool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__(thread_manager, db_connection, agent_id)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "update_agent",
            "description": "Update the agent's configuration including name, description, system prompt, tools, and MCP servers. Call this whenever the user wants to modify any aspect of the agent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the agent. Should be descriptive and indicate the agent's purpose."
                    },
                    "description": {
                        "type": "string",
                        "description": "A brief description of what the agent does and its capabilities."
                    },
                    "system_prompt": {
                        "type": "string",
                        "description": "The system instructions that define the agent's behavior, expertise, and approach. This should be comprehensive and well-structured."
                    },
                    "agentpress_tools": {
                        "type": "object",
                        "description": "Configuration for AgentPress tools. Each key is a tool name, and the value is an object with 'enabled' (boolean) and 'description' (string) properties.",
                        "additionalProperties": {
                            "type": "object",
                            "properties": {
                                "enabled": {"type": "boolean"},
                                "description": {"type": "string"}
                            }
                        }
                    },
                    "configured_mcps": {
                        "type": "array",
                        "description": "List of configured MCP servers for external integrations.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "qualifiedName": {"type": "string"},
                                "config": {"type": "object"},
                                "enabledTools": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            }
                        }
                    },

                    "avatar": {
                        "type": "string",
                        "description": "Emoji to use as the agent's avatar."
                    },
                    "avatar_color": {
                        "type": "string",
                        "description": "Hex color code for the agent's avatar background."
                    }
                },
                "required": []
            }
        }
    })
    @xml_schema(
        tag_name="update-agent",
        mappings=[
            {"param_name": "name", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "description", "node_type": "element", "path": "description", "required": False},
            {"param_name": "system_prompt", "node_type": "element", "path": "system_prompt", "required": False},
            {"param_name": "agentpress_tools", "node_type": "element", "path": "agentpress_tools", "required": False},
            {"param_name": "configured_mcps", "node_type": "element", "path": "configured_mcps", "required": False},
            {"param_name": "avatar", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "avatar_color", "node_type": "attribute", "path": ".", "required": False}
        ],
        example='''
        <function_calls>
        <invoke name="update_agent">
        <parameter name="name">Research Assistant</parameter>
        <parameter name="description">An AI assistant specialized in conducting research and providing comprehensive analysis</parameter>
        <parameter name="system_prompt">You are a research assistant with expertise in gathering, analyzing, and synthesizing information. Your approach is thorough and methodical...</parameter>
        <parameter name="agentpress_tools">{"web_search": {"enabled": true, "description": "Search the web for information"}, "sb_files": {"enabled": true, "description": "Read and write files"}}</parameter>
        <parameter name="avatar">🔬</parameter>
        <parameter name="avatar_color">#4F46E5</parameter>
        </invoke>
        </function_calls>
        '''
    )
    async def update_agent(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        system_prompt: Optional[str] = None,
        agentpress_tools: Optional[Dict[str, Dict[str, Any]]] = None,
        configured_mcps: Optional[list] = None,
        avatar: Optional[str] = None,
        avatar_color: Optional[str] = None
    ) -> ToolResult:
        try:
            client = await self.db.client
            
            agent_result = await client.table('agents').select('*').eq('agent_id', self.agent_id).execute()
            if not agent_result.data:
                return self.fail_response("Agent not found")
            
            current_agent = agent_result.data[0]

            metadata = current_agent.get('metadata', {})
            is_suna_default = metadata.get('is_suna_default', False)
            
            if is_suna_default:
                restricted_fields = []
                if name is not None:
                    restricted_fields.append("name")
                if description is not None:
                    restricted_fields.append("description") 
                if system_prompt is not None:
                    restricted_fields.append("system prompt")
                if agentpress_tools is not None:
                    restricted_fields.append("default tools")
                
                if restricted_fields:
                    return self.fail_response(
                        f"Cannot modify {', '.join(restricted_fields)} for the default Prophet agent. "
                        f"Prophet's core identity is managed centrally. However, you can still add MCP integrations, "
                        f"create scheduled triggers (agent execution) and customize other aspects of the agent."
                    )
            
            update_fields = {}
            if name is not None:
                update_fields["name"] = name
            if description is not None:
                update_fields["description"] = description
                
            config_changed = (system_prompt is not None or agentpress_tools is not None or 
                            configured_mcps is not None or avatar is not None or avatar_color is not None)
            
            if not update_fields and not config_changed:
                return self.fail_response("No fields provided to update")
            
            current_config = current_agent.get('config', {})
            
            current_system_prompt = system_prompt if system_prompt is not None else current_config.get('system_prompt', '')
            
            if agentpress_tools is not None:
                formatted_tools = {}
                for tool_name, tool_config in agentpress_tools.items():
                    if isinstance(tool_config, dict):
                        formatted_tools[tool_name] = tool_config.get("enabled", False)
                    else:
                        formatted_tools[tool_name] = bool(tool_config)
                current_agentpress_tools = formatted_tools
            else:
                current_agentpress_tools = current_config.get('tools', {}).get('agentpress', {})
            
            current_configured_mcps = current_config.get('tools', {}).get('mcp', [])
            if configured_mcps is not None:
                if isinstance(configured_mcps, str):
                    configured_mcps = json.loads(configured_mcps)
                
                existing_mcps_by_name = {mcp.get('qualifiedName', ''): mcp for mcp in current_configured_mcps}
                
                for new_mcp in configured_mcps:
                    qualified_name = new_mcp.get('qualifiedName', '')
                    if qualified_name:
                        existing_mcps_by_name[qualified_name] = new_mcp
                    else:
                        current_configured_mcps.append(new_mcp)
                
                current_configured_mcps = list(existing_mcps_by_name.values())

            current_custom_mcps = current_config.get('tools', {}).get('custom_mcp', [])
            
            current_metadata = current_config.get('metadata', {})
            current_avatar = avatar if avatar is not None else current_metadata.get('avatar')
            current_avatar_color = avatar_color if avatar_color is not None else current_metadata.get('avatar_color')
            
            unified_config = build_unified_config(
                system_prompt=current_system_prompt,
                agentpress_tools=current_agentpress_tools,
                configured_mcps=current_configured_mcps,
                custom_mcps=current_custom_mcps,
                avatar=current_avatar,
                avatar_color=current_avatar_color
            )
            
            update_data = update_fields.copy()
            update_data["config"] = unified_config
                
            result = await client.table('agents').update(update_data).eq('agent_id', self.agent_id).execute()
            
            if not result.data:
                return self.fail_response("Failed to update agent")

            return self.success_response({
                "message": "Agent updated successfully",
                "updated_fields": list(update_data.keys()),
                "agent": result.data[0]
            })
            
        except Exception as e:
            return self.fail_response(f"Error updating agent: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_current_agent_config",
            "description": "Get the current configuration of the agent being edited. Use this to check what's already configured before making updates.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    })
    @xml_schema(
        tag_name="get-current-agent-config",
        mappings=[],
        example='''
        <function_calls>
        <invoke name="get_current_agent_config">
        </invoke>
        </function_calls>
        '''
    )
    async def get_current_agent_config(self) -> ToolResult:
        try:
            agent_data = await self._get_agent_data()
            
            if not agent_data:
                return self.fail_response("Agent not found")
            
            version_data = None
            if agent_data.get('current_version_id'):
                try:
                    from agent.versioning.facade import version_manager
                    account_id = await self._get_current_account_id()
                    version_dict = await version_manager.get_version(
                        agent_id=self.agent_id,
                        version_id=agent_data['current_version_id'],
                        user_id=account_id
                    )
                    version_data = version_dict
                except Exception as e:
                    logger.warning(f"Failed to get version data for agent config tool: {e}")

            from agent.config_helper import extract_agent_config
            agent_config = extract_agent_config(agent_data, version_data)
            
            config_summary = {
                "agent_id": agent_config["agent_id"],
                "name": agent_config.get("name", "Untitled Agent"),
                "description": agent_config.get("description", "No description set"),
                "system_prompt": agent_config.get("system_prompt", "No system prompt set"),
                "avatar": agent_config.get("avatar", "🤖"),
                "avatar_color": agent_config.get("avatar_color", "#6B7280"),
                "agentpress_tools": agent_config.get("agentpress_tools", {}),
                "configured_mcps": agent_config.get("configured_mcps", []),
                "custom_mcps": agent_config.get("custom_mcps", []),
                "created_at": agent_data.get("created_at"),
                "updated_at": agent_data.get("updated_at"),
                "current_version": agent_config.get("version_name", "v1") if version_data else "No version data"
            }
            
            tools_count = len([t for t, cfg in config_summary["agentpress_tools"].items() if cfg.get("enabled")])
            mcps_count = len(config_summary["configured_mcps"])
            custom_mcps_count = len(config_summary["custom_mcps"])
            
            summary_text = f"Agent '{config_summary['name']}' (version: {config_summary['current_version']}) has {tools_count} tools enabled, {mcps_count} MCP servers configured, and {custom_mcps_count} custom MCP integrations."
            
            return self.success_response({
                "summary": summary_text,
                "configuration": config_summary
            })
            
        except Exception as e:
            return self.fail_response(f"Error getting agent configuration: {str(e)}") 