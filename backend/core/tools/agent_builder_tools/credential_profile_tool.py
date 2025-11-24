from typing import Optional, List, Dict
from uuid import uuid4
from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.agentpress.thread_manager import ThreadManager
from .base_tool import AgentBuilderBaseTool
from core.composio_integration.composio_service import get_integration_service
from core.composio_integration.composio_profile_service import ComposioProfileService
from core.composio_integration.toolkit_service import ToolkitService
from core.mcp_module.mcp_service import mcp_service
from .mcp_search_tool import MCPSearchTool
from core.utils.logger import logger

@tool_metadata(
    display_name="Credentials Manager",
    description="Manage API keys and authentication for external services",
    icon="Key",
    color="bg-red-100 dark:bg-red-800/50",
    weight=180,
    visible=True
)
class CredentialProfileTool(AgentBuilderBaseTool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__(thread_manager, db_connection, agent_id)
        self.composio_search = MCPSearchTool(thread_manager, db_connection, agent_id)
        self.toolkit_service = ToolkitService()
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_toolkit_auth_requirements",
            "description": "Inspect a Composio toolkit and list the required/optional auth fields (API keys, tokens, secrets). Use this before requesting credentials from the user for custom auth flows.",
            "parameters": {
                "type": "object",
                "properties": {
                    "toolkit_slug": {
                        "type": "string",
                        "description": "Toolkit slug to inspect (e.g., 'trello', 'zendesk')."
                    }
                },
                "required": ["toolkit_slug"]
            }
        }
    })
    async def get_toolkit_auth_requirements(self, toolkit_slug: str) -> ToolResult:
        try:
            detailed_info = await self.toolkit_service.get_detailed_toolkit_info(toolkit_slug)
            if not detailed_info:
                return self.fail_response(f"Unable to fetch auth requirements for '{toolkit_slug}'.")

            modes_summary = []
            for config in detailed_info.auth_config_details or []:
                fields = config.fields or {}
                for scheme_key, requirement_map in fields.items():
                    required_fields = []
                    optional_fields = []
                    for requirement, field_list in requirement_map.items():
                        target = required_fields if requirement == "required" else optional_fields
                        for field in field_list:
                            target.append({
                                "name": field.name,
                                "display_name": field.displayName or field.name,
                                "type": field.type,
                                "description": field.description,
                                "required": requirement == "required" or field.required
                            })
                    modes_summary.append({
                        "scheme": scheme_key,
                        "required_fields": required_fields,
                        "optional_fields": optional_fields
                    })

            if not modes_summary:
                return self.success_response({
                    "message": f"{detailed_info.name} does not expose structured auth requirements. Default to managed auth if available.",
                    "toolkit_slug": toolkit_slug,
                    "auth_modes": []
                })

            response_text = f"## Auth requirements for {detailed_info.name}\n\n"
            for mode in modes_summary:
                response_text += f"- **Scheme:** {mode['scheme']}\n"
                if mode["required_fields"]:
                    response_text += "  - Required: " + ", ".join(field["display_name"] for field in mode["required_fields"]) + "\n"
                if mode["optional_fields"]:
                    response_text += "  - Optional: " + ", ".join(field["display_name"] for field in mode["optional_fields"]) + "\n"
            response_text += "\nUse `auth_mode='custom'` plus the listed fields if managed auth fails or is unavailable."

            return self.success_response({
                "message": response_text,
                "toolkit_slug": toolkit_slug,
                "auth_modes": modes_summary
            })
        except Exception as e:
            logger.error("Failed to fetch auth requirements for %s: %s", toolkit_slug, e, exc_info=True)
            return self.fail_response("Error retrieving toolkit auth requirements")


    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_credential_profiles",
            "description": "Get all existing Composio credential profiles for the current user. Use this to show the user their available profiles.",
            "parameters": {
                "type": "object",
                "properties": {
                    "toolkit_slug": {
                        "type": "string",
                        "description": "Optional filter to show only profiles for a specific toolkit"
                    }
                },
                "required": []
            }
        }
    })
    async def get_credential_profiles(self, toolkit_slug: Optional[str] = None) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            profile_service = ComposioProfileService(self.db)
            profiles = await profile_service.get_profiles(account_id, toolkit_slug)
            
            formatted_profiles = []
            for profile in profiles:
                formatted_profiles.append({
                    "profile_id": profile.profile_id,
                    "connected_account_id": getattr(profile, 'connected_account_id', None),
                    "account_id": profile.account_id,
                    "profile_name": profile.profile_name,
                    "display_name": profile.display_name,
                    "toolkit_slug": profile.toolkit_slug,
                    "toolkit_name": profile.toolkit_name,
                    "is_connected": profile.is_connected,
                    "is_default": profile.is_default
                })
            
            return self.success_response({
                "message": f"Found {len(formatted_profiles)} credential profiles",
                "profiles": formatted_profiles,
                "total_count": len(formatted_profiles)
            })
            
        except Exception as e:
            return self.fail_response("Error getting credential profiles")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_credential_profile",
            "description": "Create a new Composio credential profile for a specific toolkit. Supports both managed (OAuth) and custom credential flows. Always gather required API keys/secrets from the user before using custom mode.",
            "parameters": {
                "type": "object",
                "properties": {
                    "toolkit_slug": {
                        "type": "string",
                        "description": "Toolkit slug to integrate (e.g., 'trello', 'github', 'linear')."
                    },
                    "profile_name": {
                        "type": "string",
                        "description": "Friendly name for this credential profile."
                    },
                    "display_name": {
                        "type": "string",
                        "description": "Optional label shown to the user (defaults to profile_name)."
                    },
                    "auth_mode": {
                        "type": "string",
                        "enum": ["managed", "custom"],
                        "description": "Use 'managed' for Composio-managed OAuth (default) or 'custom' to send manual credentials (API keys, secrets, etc.).",
                        "default": "managed"
                    },
                    "auth_scheme": {
                        "type": "string",
                        "description": "Optional auth scheme to target (e.g., 'OAUTH2', 'API_KEY'). Useful when a toolkit exposes multiple schemes."
                    },
                    "credentials": {
                        "type": "object",
                        "additionalProperties": {"type": "string"},
                        "description": "Key/value credentials required by the toolkit (e.g., {\"key\": \"trello-api-key\", \"token\": \"...\"}). These are sent to Composio as initiation/custom auth fields."
                    }
                },
                "required": ["toolkit_slug", "profile_name"]
            }
        }
    })
    async def create_credential_profile(
        self,
        toolkit_slug: str,
        profile_name: str,
        display_name: Optional[str] = None,
        auth_mode: str = "managed",
        auth_scheme: Optional[str] = None,
        credentials: Optional[Dict[str, str]] = None
    ) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            integration_user_id = str(uuid4())
            logger.debug(f"Generated integration user_id: {integration_user_id} for account: {account_id}")
            normalized_mode = (auth_mode or "managed").lower()
            use_custom_auth = normalized_mode == "custom"
            safe_credentials = credentials or {}
            custom_auth_config = None
            if use_custom_auth:
                custom_auth_config = {}
                if auth_scheme:
                    custom_auth_config["auth_scheme"] = auth_scheme
                custom_auth_config.update(safe_credentials)

            integration_service = get_integration_service(db_connection=self.db)
            result = await integration_service.integrate_toolkit(
                toolkit_slug=toolkit_slug,
                account_id=account_id,
                user_id=integration_user_id,
                profile_name=profile_name,
                display_name=display_name or profile_name,
                save_as_profile=True,
                initiation_fields=safe_credentials or None,
                custom_auth_config=custom_auth_config,
                use_custom_auth=use_custom_auth
            )

            redirect_url = result.connected_account.redirect_url if result.connected_account else None
            response_data = {
                "message": f"Successfully created credential profile '{profile_name}' for {result.toolkit.name}",
                "profile": {
                    "profile_name": profile_name,
                    "display_name": display_name or profile_name,
                    "toolkit_slug": toolkit_slug,
                    "toolkit_name": result.toolkit.name,
                    "is_connected": False,
                    "auth_required": bool(redirect_url),
                    "auth_mode": "custom" if use_custom_auth else "managed"
                }
            }
            
            if redirect_url:
                response_data["connection_link"] = redirect_url
                # Include both the toolkit name and slug in a parseable format
                # Format: [toolkit:slug:name] to help frontend identify the service accurately
                response_data["instructions"] = f"""🔗 **{result.toolkit.name} Authentication Required**

Please authenticate your {result.toolkit.name} account by clicking the link below:

[toolkit:{toolkit_slug}:{result.toolkit.name}] Authentication: {redirect_url}

After connecting, you'll be able to use {result.toolkit.name} tools in your agent."""
            else:
                if use_custom_auth:
                    response_data["instructions"] = (
                        f"Custom credentials for {result.toolkit.name} were saved. No additional authentication steps are required."
                    )
                else:
                    response_data["instructions"] = (
                        f"This {result.toolkit.name} profile has been created and is ready to use."
                    )
            
            return self.success_response(response_data)
            
        except Exception as e:
            logger.error("Failed to create credential profile for %s: %s", toolkit_slug, e, exc_info=True)
            error_message = str(e) or "Unknown error"
            return self.fail_response(f"Error creating credential profile: {error_message}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "configure_profile_for_agent",
            "description": "Configure a connected credential profile to be used by the agent with selected tools. Use this after the profile is connected and you want to add it to the agent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile_id": {
                        "type": "string",
                        "description": "The ID of the connected credential profile"
                    },
                    "enabled_tools": {
                        "type": "array",
                        "description": "List of tool names to enable for this profile",
                        "items": {"type": "string"}
                    },
                    "display_name": {
                        "type": "string",
                        "description": "Optional custom display name for this configuration in the agent"
                    }
                },
                "required": ["profile_id", "enabled_tools"]
            }
        }
    })
    async def configure_profile_for_agent(
        self, 
        profile_id: str, 
        enabled_tools: List[str],
        display_name: Optional[str] = None
    ) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            client = await self.db.client

            profile_service = ComposioProfileService(self.db)
            profiles = await profile_service.get_profiles(account_id)
            
            profile = None
            for p in profiles:
                if p.profile_id == profile_id:
                    profile = p
                    break
            
            if not profile:
                return self.fail_response("Credential profile not found")
            if not profile.is_connected:
                return self.fail_response("Profile is not connected yet. Please connect the profile first.")

            agent_result = await client.table('agents').select('current_version_id').eq('agent_id', self.agent_id).execute()
            if not agent_result.data or not agent_result.data[0].get('current_version_id'):
                return self.fail_response("Agent configuration not found")

            version_result = await client.table('agent_versions')\
                .select('config')\
                .eq('version_id', agent_result.data[0]['current_version_id'])\
                .maybe_single()\
                .execute()
            
            if not version_result.data or not version_result.data.get('config'):
                return self.fail_response("Agent version configuration not found")

            current_config = version_result.data['config']
            current_tools = current_config.get('tools', {})
            current_custom_mcps = current_tools.get('custom_mcp', [])
            
            new_mcp_config = {
                'name': profile.toolkit_name,
                'type': 'composio',
                'config': {
                    'profile_id': profile_id,
                    'toolkit_slug': profile.toolkit_slug,
                    'mcp_qualified_name': profile.mcp_qualified_name
                },
                'enabledTools': enabled_tools
            }
            
            updated_mcps = [mcp for mcp in current_custom_mcps 
                          if mcp.get('config', {}).get('profile_id') != profile_id]
            
            updated_mcps.append(new_mcp_config)
            
            current_tools['custom_mcp'] = updated_mcps
            current_config['tools'] = current_tools
            
            from core.versioning.version_service import get_version_service
            version_service = await get_version_service()
            new_version = await version_service.create_version(
                agent_id=self.agent_id,
                user_id=account_id,
                system_prompt=current_config.get('system_prompt', ''),
                configured_mcps=current_config.get('tools', {}).get('mcp', []),
                custom_mcps=updated_mcps,
                agentpress_tools=current_config.get('tools', {}).get('agentpress', {}),
                change_description=f"Configured {display_name or profile.display_name} with {len(enabled_tools)} tools"
            )

            # Dynamically register the MCP tools in the current runtime
            try:
                from core.tools.mcp_tool_wrapper import MCPToolWrapper
                
                mcp_config_for_wrapper = {
                    'name': profile.toolkit_name,
                    'qualifiedName': f"composio.{profile.toolkit_slug}",
                    'config': {
                        'profile_id': profile_id,
                        'toolkit_slug': profile.toolkit_slug,
                        'mcp_qualified_name': profile.mcp_qualified_name
                    },
                    'enabledTools': enabled_tools,
                    'instructions': '',
                    'isCustom': True,
                    'customType': 'composio'
                }
                
                mcp_wrapper_instance = MCPToolWrapper(mcp_configs=[mcp_config_for_wrapper])
                await mcp_wrapper_instance.initialize_and_register_tools()
                updated_schemas = mcp_wrapper_instance.get_schemas()
                
                for method_name, schema_list in updated_schemas.items():
                    for schema in schema_list:
                        self.thread_manager.tool_registry.tools[method_name] = {
                            "instance": mcp_wrapper_instance,
                            "schema": schema
                        }
                        logger.debug(f"Dynamically registered MCP tool: {method_name}")
                
                logger.debug(f"Successfully registered {len(updated_schemas)} MCP tools dynamically for {profile.toolkit_name}")
                
            except Exception as e:
                logger.warning(f"Could not dynamically register MCP tools in current runtime: {str(e)}. Tools will be available on next agent run.")

            return self.success_response({
                "message": f"Profile '{profile.profile_name}' configured with {len(enabled_tools)} tools and registered in current runtime",
                "enabled_tools": enabled_tools,
                "total_tools": len(enabled_tools),
                "runtime_registration": "success"
            })
            
        except Exception as e:
            logger.error(f"Error configuring profile for agent: {e}", exc_info=True)
            return self.fail_response("Error configuring profile for agent")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "delete_credential_profile",
            "description": "Delete a credential profile that is no longer needed. This will also remove it from any agent configurations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile_id": {
                        "type": "string",
                        "description": "The ID of the credential profile to delete"
                    }
                },
                "required": ["profile_id"]
            }
        }
    })
    async def delete_credential_profile(self, profile_id: str) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            client = await self.db.client
            
            profile_service = ComposioProfileService(self.db)
            profiles = await profile_service.get_profiles(account_id)
            
            profile = None
            for p in profiles:
                if p.profile_id == profile_id:
                    profile = p
                    break
            
            if not profile:
                return self.fail_response("Credential profile not found")
            
            # Remove from agent configuration if it exists
            agent_result = await client.table('agents').select('current_version_id').eq('agent_id', self.agent_id).execute()
            if agent_result.data and agent_result.data[0].get('current_version_id'):
                version_result = await client.table('agent_versions')\
                    .select('config')\
                    .eq('version_id', agent_result.data[0]['current_version_id'])\
                    .maybe_single()\
                    .execute()
                
                if version_result.data and version_result.data.get('config'):
                    current_config = version_result.data['config']
                    current_tools = current_config.get('tools', {})
                    current_custom_mcps = current_tools.get('custom_mcp', [])
                    
                    updated_mcps = [mcp for mcp in current_custom_mcps if mcp.get('config', {}).get('profile_id') != profile_id]
                    
                    if len(updated_mcps) != len(current_custom_mcps):
                        from core.versioning.version_service import get_version_service
                        try:
                            current_tools['custom_mcp'] = updated_mcps
                            current_config['tools'] = current_tools
                            
                            version_service = await get_version_service()
                            await version_service.create_version(
                                agent_id=self.agent_id,
                                user_id=account_id,
                                system_prompt=current_config.get('system_prompt', ''),
                                configured_mcps=current_config.get('tools', {}).get('mcp', []),
                                custom_mcps=updated_mcps,
                                agentpress_tools=current_config.get('tools', {}).get('agentpress', {}),
                                change_description=f"Deleted credential profile {profile.display_name}"
                            )
                        except Exception as e:
                            return self.fail_response("Failed to update agent config")
            
            # Delete the profile
            await profile_service.delete_profile(profile_id)
            
            return self.success_response({
                "message": f"Successfully deleted credential profile '{profile.display_name}' for {profile.toolkit_name}",
                "deleted_profile": {
                    "profile_name": profile.profile_name,
                    "toolkit_name": profile.toolkit_name
                }
            })
            
        except Exception as e:
            return self.fail_response("Error deleting credential profile") 