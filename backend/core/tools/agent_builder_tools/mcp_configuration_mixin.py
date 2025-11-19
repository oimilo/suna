from typing import List, Optional, Dict, Any

from core.utils.logger import logger


class MCPConfigurationMixin:
    async def _load_agent_config(self, client) -> Optional[Dict[str, Any]]:
        agent_result = await client.table('agents').select('current_version_id').eq('agent_id', self.agent_id).execute()
        if not agent_result.data or not agent_result.data[0].get('current_version_id'):
            return None

        version_result = await client.table('agent_versions')\
            .select('config')\
            .eq('version_id', agent_result.data[0]['current_version_id'])\
            .maybe_single()\
            .execute()

        if not version_result.data or not version_result.data.get('config'):
            return None

        return version_result.data['config']

    async def _apply_profile_configuration(
        self,
        account_id: str,
        profile,
        enabled_tools: List[str],
        display_name: Optional[str] = None
    ) -> Dict[str, Any]:
        if not enabled_tools:
            raise ValueError("No tools were provided to enable for this profile.")

        client = await self.db.client
        current_config = await self._load_agent_config(client)
        if not current_config:
            raise ValueError("Agent configuration not found.")

        current_tools = current_config.get('tools', {})
        current_custom_mcps = current_tools.get('custom_mcp', [])
        new_mcp_config = {
            'name': profile.toolkit_name,
            'type': 'composio',
            'config': {
                'profile_id': profile.profile_id,
                'toolkit_slug': profile.toolkit_slug,
                'mcp_qualified_name': profile.mcp_qualified_name
            },
            'enabledTools': enabled_tools
        }

        updated_mcps = [mcp for mcp in current_custom_mcps
                        if mcp.get('config', {}).get('profile_id') != profile.profile_id]
        updated_mcps.append(new_mcp_config)

        current_tools['custom_mcp'] = updated_mcps
        current_config['tools'] = current_tools

        from core.versioning.version_service import get_version_service
        version_service = await get_version_service()
        await version_service.create_version(
            agent_id=self.agent_id,
            user_id=account_id,
            system_prompt=current_config.get('system_prompt', ''),
            configured_mcps=current_config.get('tools', {}).get('mcp', []),
            custom_mcps=updated_mcps,
            agentpress_tools=current_config.get('tools', {}).get('agentpress', {}),
            change_description=f"Configured {display_name or profile.display_name} with {len(enabled_tools)} tools"
        )

        try:
            from core.tools.mcp_tool_wrapper import MCPToolWrapper

            mcp_config_for_wrapper = {
                'name': profile.toolkit_name,
                'qualifiedName': f"composio.{profile.toolkit_slug}",
                'config': {
                    'profile_id': profile.profile_id,
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

        await self._refresh_runtime_tools(account_id, current_config)

        return {
            "profile_name": profile.profile_name,
            "display_name": display_name or profile.display_name,
            "enabled_tools": enabled_tools,
            "total_tools": len(enabled_tools)
        }

    async def _auto_configure_profile_if_needed(
        self,
        profile,
        available_tools: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        try:
            client = await self.db.client
            current_config = await self._load_agent_config(client)
            if not current_config:
                return None

            existing_entries = current_config.get('tools', {}).get('custom_mcp', [])
            for entry in existing_entries:
                if entry.get('config', {}).get('profile_id') == profile.profile_id:
                    return None

            enabled_tools = [
                tool.get('name')
                for tool in available_tools
                if isinstance(tool, dict) and tool.get('name')
            ]
            if not enabled_tools:
                return None

            account_id = await self._get_current_account_id()
            summary = await self._apply_profile_configuration(
                account_id=account_id,
                profile=profile,
                enabled_tools=enabled_tools
            )
            summary["auto_configured"] = True
            return summary
        except Exception as auto_error:
            logger.warning(f"Auto configuration for profile {profile.profile_id} failed: {auto_error}", exc_info=True)
            return None

