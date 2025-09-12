"""
Workflow Executor for Prophet/Suna
Executes workflow steps defined in the database instead of treating them as chat conversations.
"""

import json
import uuid
import asyncio
import traceback
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from utils.logger import logger, structlog
from services.supabase import DBConnection
from services.redis import redis
from services.langfuse import langfuse
from agentpress.thread_manager import ThreadManager
from agent.tools.mcp_tool_wrapper import MCPToolWrapper
from agentpress.tool import SchemaType


class WorkflowExecutor:
    """Executes workflow steps sequentially."""
    
    def __init__(self, db: DBConnection):
        self.db = db
        self.tool_instances = {}
        self.thread_manager = None
        self.mcp_wrapper = None

    async def _log_tool_message(self, thread_id: str, tool_name: str, args: Dict[str, Any], result: Any):
        """Persist a 'tool' message in the messages table for observability/monitoring."""
        try:
            client = await self.db.client
            content = {
                'tool_name': tool_name,
                'args': args,
                'result': getattr(result, 'output', result)
            }
            await client.table('messages').insert({
                'message_id': str(uuid.uuid4()),
                'thread_id': thread_id,
                'type': 'tool',
                'is_llm_message': False,
                'content': content
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log tool message: {e}")

    async def _log_status_message(self, thread_id: str, data: Dict[str, Any]):
        """Persist a 'workflow_status' message for step/status visibility in UI/monitor."""
        try:
            client = await self.db.client
            await client.table('messages').insert({
                'message_id': str(uuid.uuid4()),
                'thread_id': thread_id,
                'type': 'workflow_status',
                'is_llm_message': False,
                'content': data
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log workflow status message: {e}")

    async def _post_assistant_summary(self, thread_id: str, context: Dict[str, Any]):
        """Post a concise assistant message summarizing workflow outcome so the UI shows content."""
        try:
            client = await self.db.client
            status = context.get('status')
            results = context.get('results', {})
            lines = [f"Workflow status: {status}"]
            if results:
                lines.append("Results:")
                for step_name, result in results.items():
                    # Create a short one-liner per step
                    if isinstance(result, dict):
                        summary = result.get('message') or result.get('status') or 'done'
                    else:
                        summary = str(result)[:120]
                    lines.append(f"- {step_name}: {summary}")
            content = { 'role': 'assistant', 'content': "\n".join(lines) }
            await client.table('messages').insert({
                'message_id': str(uuid.uuid4()),
                'thread_id': thread_id,
                'type': 'assistant',
                'is_llm_message': False,
                'content': json.dumps(content)
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to post assistant summary: {e}")
        
    async def _initialize_tools(self, agent_config: Dict[str, Any], thread_id: str, project_id: str, user_id: str):
        """Initialize tool registry with MCP tools from agent configuration."""
        if self.thread_manager:
            logger.info("Thread manager already initialized, skipping tool initialization")
            return  # Already initialized
            
        logger.info("Initializing tool registry for workflow executor")
        
        # Log the received agent configuration
        logger.info(f"Agent config keys: {list(agent_config.keys())}")
        logger.info(f"Configured MCPs count: {len(agent_config.get('configured_mcps', []))}")
        logger.info(f"Custom MCPs count: {len(agent_config.get('custom_mcps', []))}")
        
        # Create thread manager with proper signature
        # Pass agent_config to enable MCP tool registration paths
        self.thread_manager = ThreadManager(agent_config=agent_config)
        
        # Check for MCPs in agent config
        all_mcps = []
        
        # Add standard configured MCPs (normalize shape)
        if agent_config.get('configured_mcps'):
            logger.info(f"Processing {len(agent_config['configured_mcps'])} configured MCPs")
            for base_mcp in agent_config['configured_mcps']:
                try:
                    cfg = dict(base_mcp)
                    cfg.setdefault('config', {})
                    custom_type = cfg.get('customType') or cfg.get('type') or 'sse'

                    # Pipedream helpers: infer app_slug from headers if present
                    if 'headers' in cfg.get('config', {}) and 'x-pd-app-slug' in cfg['config']['headers']:
                        cfg['config']['app_slug'] = cfg['config']['headers']['x-pd-app-slug']

                    # Ensure external_user_id for pipedream when possible
                    if custom_type == 'pipedream' and not cfg['config'].get('external_user_id'):
                        try:
                            from pipedream.profiles import get_profile_manager
                            from services.supabase import DBConnection as _DB
                            profile_db = _DB()
                            profile_manager = get_profile_manager(profile_db)
                            profile = await profile_manager.get_profile(user_id, cfg['config'].get('profile_id'))
                            if profile and getattr(profile, 'external_user_id', None):
                                cfg['config']['external_user_id'] = profile.external_user_id
                                logger.info(f"Configured MCP external_user_id via profile for {cfg.get('name')}")
                        except Exception as e:
                            logger.debug(f"Could not resolve external_user_id for configured MCP {cfg.get('name')}: {e}")

                    qualified_name = cfg.get('qualifiedName') or f"custom_{custom_type}_{(cfg.get('name') or 'server').replace(' ', '_').lower()}"
                    norm = {
                        'name': cfg.get('name') or 'server',
                        'qualifiedName': qualified_name,
                        'config': cfg.get('config') or {},
                        'enabledTools': cfg.get('enabledTools', []),
                        'instructions': cfg.get('instructions', ''),
                        'isCustom': False,
                        'customType': custom_type
                    }
                    all_mcps.append(norm)
                except Exception as e:
                    logger.warning(f"Failed to normalize configured MCP {base_mcp}: {e}")
        
        # Add custom MCPs (including Pipedream)
        if agent_config.get('custom_mcps'):
            logger.info(f"Processing {len(agent_config['custom_mcps'])} custom MCPs")
            for custom_mcp in agent_config['custom_mcps']:
                logger.info(f"Custom MCP: {custom_mcp.get('name')} - Type: {custom_mcp.get('type')} - Enabled tools: {custom_mcp.get('enabledTools', [])}")
                custom_type = custom_mcp.get('customType', custom_mcp.get('type', 'sse'))
                
                # For Pipedream MCPs, ensure proper config
                if custom_type == 'pipedream':
                    if 'config' not in custom_mcp:
                        custom_mcp['config'] = {}
                    
                    # Get external_user_id from profile if needed
                    if not custom_mcp['config'].get('external_user_id'):
                        profile_id = custom_mcp['config'].get('profile_id')
                        if profile_id:
                            try:
                                # Get the profile to retrieve external_user_id
                                profile_result = await self.db.client.table('credential_profiles').select('*').eq('id', profile_id).execute()
                                if profile_result.data:
                                    custom_mcp['config']['external_user_id'] = profile_result.data[0].get('external_user_id')
                                    logger.info(f"Retrieved external_user_id from profile {profile_id}")
                            except Exception as e:
                                logger.error(f"Error retrieving external_user_id: {e}")
                    
                    if 'headers' in custom_mcp['config'] and 'x-pd-app-slug' in custom_mcp['config']['headers']:
                        custom_mcp['config']['app_slug'] = custom_mcp['config']['headers']['x-pd-app-slug']

                    # Ensure external_user_id using Pipedream Profile Manager when available
                    if not custom_mcp['config'].get('external_user_id'):
                        try:
                            from pipedream.profiles import get_profile_manager
                            from services.supabase import DBConnection
                            profile_db = DBConnection()
                            profile_manager = get_profile_manager(profile_db)
                            # user_id is the account_id in our context
                            profile = await profile_manager.get_profile(user_id, custom_mcp['config'].get('profile_id'))
                            if profile and getattr(profile, 'external_user_id', None):
                                custom_mcp['config']['external_user_id'] = profile.external_user_id
                                logger.info(f"Resolved external_user_id via Pipedream profiles for profile {custom_mcp['config'].get('profile_id')}")
                        except Exception as e:
                            logger.warning(f"Failed to resolve external_user_id via Pipedream profiles: {e}")
                
                mcp_config = {
                    'name': custom_mcp['name'],
                    'qualifiedName': f"custom_{custom_type}_{custom_mcp['name'].replace(' ', '_').lower()}",
                    'config': custom_mcp['config'],
                    'enabledTools': custom_mcp.get('enabledTools', []),
                    'instructions': custom_mcp.get('instructions', ''),
                    'isCustom': True,
                    'customType': custom_type
                }
                all_mcps.append(mcp_config)
        
        if all_mcps:
            logger.info(f"Registering MCP wrapper with {len(all_mcps)} MCP servers")

            # Register wrapper in thread manager (creates the managed instance)
            self.thread_manager.add_tool(MCPToolWrapper, mcp_configs=all_mcps)

            # Get the managed wrapper instance
            for _, tool_info in self.thread_manager.tool_registry.tools.items():
                if isinstance(tool_info['instance'], MCPToolWrapper):
                    self.mcp_wrapper = tool_info['instance']
                    break

            # Initialize the managed instance and update registry with dynamic schemas
            if self.mcp_wrapper:
                await self.mcp_wrapper.initialize_and_register_tools(self.thread_manager.tool_registry)

                updated_schemas = self.mcp_wrapper.get_schemas() or {}
                logger.info(f"MCP wrapper has {len(updated_schemas)} schemas available after init")

                for method_name, schema_list in updated_schemas.items():
                    if method_name == 'call_mcp_tool':
                        continue
                    for schema in schema_list:
                        if schema.schema_type == SchemaType.OPENAPI:
                            self.thread_manager.tool_registry.tools[method_name] = {
                                "instance": self.mcp_wrapper,
                                "schema": schema
                            }
                            logger.info(f"Registered MCP tool: {method_name}")

                # Log all registered tools
                all_tools = list(self.thread_manager.tool_registry.tools.keys())
                logger.info(f"Workflow executor registered tools: {all_tools}")

    def _slugify(self, value: str) -> str:
        try:
            import re
            s = value.strip().lower().replace(' ', '_').replace('-', '_')
            s = re.sub(r"[^a-z0-9_]+", "", s)
            return s
        except Exception:
            return value.lower()

    def _resolve_mcp_method_name(self, tool_name: str, agent_config: Dict[str, Any]) -> Optional[str]:
        """Try to resolve a generic tool_name (e.g., gmail_send_email) to a concrete MCP dynamic method name.

        Strategy:
        1) Construct candidates like mcp_{server}_{tool_name} for each configured/custom MCP (server from customType/app_slug/name)
        2) Check if any candidate exists in wrapper (hasattr)
        3) Fallback: scan wrapper schemas and find a method whose name endswith _{tool_name}
        """
        try:
            candidates: List[str] = []
            all_mcps = []
            if agent_config.get('configured_mcps'):
                all_mcps.extend(agent_config['configured_mcps'])
            if agent_config.get('custom_mcps'):
                all_mcps.extend(agent_config['custom_mcps'])

            for mcp in all_mcps:
                server = mcp.get('customType') or mcp.get('type') or ''
                app_slug = (mcp.get('config') or {}).get('app_slug')
                name = mcp.get('name')
                server_slug = self._slugify(app_slug or server or name or 'mcp')
                candidates.append(f"mcp_{server_slug}_{tool_name}")

            # Check direct attributes
            for cand in candidates:
                if hasattr(self.mcp_wrapper, cand):
                    logger.info(f"Resolved tool '{tool_name}' to MCP method '{cand}' via server candidate")
                    return cand

            # Fallback: scan schemas
            try:
                schemas = self.mcp_wrapper.get_schemas()
                for method_name in schemas.keys():
                    if method_name.endswith(f"_{tool_name}") or method_name == tool_name:
                        logger.info(f"Resolved tool '{tool_name}' to MCP method '{method_name}' via schema scan")
                        return method_name
            except Exception:
                pass
        except Exception as e:
            logger.debug(f"Resolver failed for tool {tool_name}: {e}")
        return None
    
    async def execute_workflow(
        self,
        workflow_id: str,
        workflow_input: Dict[str, Any],
        agent_run_id: str,
        thread_id: str,
        project_id: str,
        user_id: str,
        agent_config: Dict[str, Any] = None,
        trace: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Execute a workflow by processing its steps sequentially.
        
        Returns:
            Dict with status and results
        """
        logger.info(f"Starting workflow execution: {workflow_id}")
        
        # Initialize tools if agent config provided
        if agent_config:
            await self._initialize_tools(agent_config, thread_id, project_id, user_id)
        
        try:
            # Get workflow definition from database
            client = await self.db.client
            workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).execute()
            
            if not workflow_result.data:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            workflow = workflow_result.data[0]
            steps = workflow.get('steps', [])
            
            logger.info(f"Executing workflow '{workflow['name']}' with {len(steps)} steps")
            logger.info(f"Workflow steps: {json.dumps(steps, indent=2)}")
            
            # Initialize execution context
            context = {
                'workflow_id': workflow_id,
                'workflow_name': workflow['name'],
                'input': workflow_input,
                'results': {},
                'current_step': None,
                'status': 'running',
                'errors': []
            }
            
            # Store initial status in Redis
            await self._publish_status(agent_run_id, thread_id, {
                'type': 'workflow_start',
                'workflow_name': workflow['name'],
                'total_steps': len(steps),
                'input': workflow_input
            })
            # Also persist as message
            await self._log_status_message(thread_id, {
                'type': 'workflow_start',
                'workflow_name': workflow['name'],
                'total_steps': len(steps),
                'input': workflow_input
            })
            
            # Execute each step
            for i, step in enumerate(steps):
                step_name = step.get('name', f'Step {i+1}')
                step_type = step.get('type', 'instruction')
                
                logger.info(f"Executing step {i+1}/{len(steps)}: {step_name} (type: {step_type})")
                
                # Update context
                context['current_step'] = step_name
                
                # Publish step start
                await self._publish_status(agent_run_id, thread_id, {
                    'type': 'step_start',
                    'step_number': i + 1,
                    'step_name': step_name,
                    'step_type': step_type
                })
                await self._log_status_message(thread_id, {
                    'type': 'step_start',
                    'step_number': i + 1,
                    'step_name': step_name,
                    'step_type': step_type
                })
                
                try:
                    # Execute based on step type
                    if step_type == 'tool':
                        result = await self._execute_tool_step(
                            step, context, agent_run_id, thread_id, project_id, user_id, trace
                        )
                    elif step_type == 'instruction':
                        result = await self._execute_instruction_step(
                            step, context, agent_run_id, thread_id
                        )
                    elif step_type == 'condition':
                        result = await self._execute_condition_step(
                            step, context, agent_run_id, thread_id, project_id, user_id, trace
                        )
                    else:
                        logger.warning(f"Unknown step type: {step_type}")
                        result = {'status': 'skipped', 'reason': f'Unknown step type: {step_type}'}
                    
                    # Store result
                    context['results'][step_name] = result
                    
                    # Publish step completion
                    await self._publish_status(agent_run_id, thread_id, {
                        'type': 'step_complete',
                        'step_number': i + 1,
                        'step_name': step_name,
                        'result': result
                    })
                    await self._log_status_message(thread_id, {
                        'type': 'step_complete',
                        'step_number': i + 1,
                        'step_name': step_name,
                        'result': result
                    })
                    
                except Exception as e:
                    error_msg = f"Error in step '{step_name}': {str(e)}"
                    logger.error(error_msg, exc_info=True)
                    context['errors'].append(error_msg)
                    
                    # Publish step error
                    await self._publish_status(agent_run_id, thread_id, {
                        'type': 'step_error',
                        'step_number': i + 1,
                        'step_name': step_name,
                        'error': str(e)
                    })
                    await self._log_status_message(thread_id, {
                        'type': 'step_error',
                        'step_number': i + 1,
                        'step_name': step_name,
                        'error': str(e)
                    })
                    
                    # Continue to next step or fail based on configuration
                    if workflow.get('stop_on_error', True):
                        context['status'] = 'failed'
                        break
            
            # Set final status
            if context['status'] == 'running':
                context['status'] = 'completed' if not context['errors'] else 'completed_with_errors'
            
            # Publish workflow completion
            await self._publish_status(agent_run_id, thread_id, {
                'type': 'workflow_complete',
                'status': context['status'],
                'results': context['results'],
                'errors': context['errors']
            })
            await self._log_status_message(thread_id, {
                'type': 'workflow_complete',
                'status': context['status'],
                'results': context['results'],
                'errors': context['errors']
            })

            # Post assistant summary so UI shows a visible message
            await self._post_assistant_summary(thread_id, context)
            
            logger.info(f"Workflow execution completed: {context['status']}")
            return context
            
        except Exception as e:
            logger.error(f"Fatal error in workflow execution: {e}", exc_info=True)
            
            # Publish fatal error
            await self._publish_status(agent_run_id, thread_id, {
                'type': 'workflow_error',
                'error': str(e),
                'traceback': traceback.format_exc()
            })
            await self._log_status_message(thread_id, {
                'type': 'workflow_error',
                'error': str(e),
                'traceback': traceback.format_exc()
            })

            # Also post assistant error summary
            await self._post_assistant_summary(thread_id, {
                'status': 'failed',
                'results': {},
                'errors': [str(e)]
            })
            
            return {
                'status': 'failed',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    async def _execute_tool_step(
        self,
        step: Dict[str, Any],
        context: Dict[str, Any],
        agent_run_id: str,
        thread_id: str,
        project_id: str,
        user_id: str,
        trace: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Execute a tool step."""
        config = step.get('config', {})
        tool_name = config.get('tool_name')
        tool_args = config.get('args', {})
        
        if not tool_name:
            return {'status': 'error', 'error': 'No tool_name specified in step config'}
        
        logger.info(f"Executing tool: {tool_name} with args: {tool_args}")
        
        # Process arguments to replace variables from context
        processed_args = self._process_tool_args(tool_args, context)
        
        # Check if we have the tool in our registry
        logger.info(f"Checking tool availability - thread_manager: {bool(self.thread_manager)}, mcp_wrapper: {bool(self.mcp_wrapper)}")
        if self.thread_manager and self.mcp_wrapper:
            # Try to execute through MCP wrapper
            try:
                # Check if it's a registered MCP tool
                if hasattr(self.mcp_wrapper, tool_name):
                    logger.info(f"Executing MCP tool: {tool_name}")
                    method = getattr(self.mcp_wrapper, tool_name)
                    result = await method(**processed_args)
                    # Persist tool call
                    await self._log_tool_message(thread_id, tool_name, processed_args, result)
                    
                    # Convert ToolResult to dict
                    if hasattr(result, 'output'):
                        return {
                            'status': 'completed',
                            'output': result.output,
                            'metadata': getattr(result, 'metadata', {})
                        }
                    else:
                        return {
                            'status': 'completed',
                            'output': str(result)
                        }
                        
                # Try as a generic MCP tool call
                elif tool_name.startswith('mcp_'):
                    logger.info(f"Executing MCP tool via call_mcp_tool: {tool_name}")
                    result = await self.mcp_wrapper.call_mcp_tool(
                        tool_name=tool_name,
                        arguments=processed_args
                    )
                    await self._log_tool_message(thread_id, tool_name, processed_args, result)
                    
                    if hasattr(result, 'output'):
                        return {
                            'status': 'completed',
                            'output': result.output,
                            'metadata': getattr(result, 'metadata', {})
                        }
                    else:
                        return {
                            'status': 'completed',
                            'output': str(result)
                        }

                # Resolve generic tool_name to MCP dynamic method name
                else:
                    resolved = self._resolve_mcp_method_name(tool_name, self.thread_manager.agent_config or agent_config)
                    if resolved:
                        if hasattr(self.mcp_wrapper, resolved):
                            logger.info(f"Executing resolved MCP tool: {resolved} for '{tool_name}'")
                            method = getattr(self.mcp_wrapper, resolved)
                            result = await method(**processed_args)
                        else:
                            logger.info(f"Executing resolved MCP tool via call_mcp_tool: {resolved}")
                            result = await self.mcp_wrapper.call_mcp_tool(tool_name=resolved, arguments=processed_args)
                        await self._log_tool_message(thread_id, resolved, processed_args, result)
                        if hasattr(result, 'output'):
                            return {
                                'status': 'completed',
                                'output': result.output,
                                'metadata': getattr(result, 'metadata', {})
                            }
                        else:
                            return {
                                'status': 'completed',
                                'output': str(result)
                            }
                        
            except Exception as e:
                logger.error(f"Error executing MCP tool {tool_name}: {e}")
                return {
                    'status': 'error',
                    'error': str(e),
                    'tool': tool_name
                }
        
        # Fallback to simulated implementations for testing
        logger.warning(f"Tool {tool_name} not available in registry, using fallback")
        
        if tool_name == 'browser_navigate_to':
            sim = await self._execute_browser_navigate(processed_args, context)
            await self._log_tool_message(thread_id, tool_name, processed_args, sim)
            return sim
        elif tool_name == 'gmail_send_email':
            sim = await self._execute_gmail_send(processed_args, context, user_id)
            await self._log_tool_message(thread_id, tool_name, processed_args, sim)
            return sim
        elif tool_name == 'create_file':
            sim = await self._execute_create_file(processed_args, context)
            await self._log_tool_message(thread_id, tool_name, processed_args, sim)
            return sim
        else:
            return {
                'status': 'not_available',
                'tool': tool_name,
                'message': f'Tool {tool_name} not available in tool registry'
            }
    
    def _process_tool_args(self, args: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process tool arguments, replacing variables with context values."""
        processed = {}
        
        for key, value in args.items():
            if isinstance(value, str) and '{' in value:
                # Try to format with context values
                try:
                    # Allow access to context.input and context.results
                    format_context = {
                        'input': context.get('input', {}),
                        'results': context.get('results', {})
                    }
                    # Flatten for easier access
                    for k, v in context.get('input', {}).items():
                        format_context[k] = v
                    
                    processed[key] = value.format(**format_context)
                except:
                    processed[key] = value  # Keep original if formatting fails
            else:
                processed[key] = value
        
        return processed
    
    async def _execute_instruction_step(
        self,
        step: Dict[str, Any],
        context: Dict[str, Any],
        agent_run_id: str,
        thread_id: str
    ) -> Dict[str, Any]:
        """Execute an instruction step (for logging/documentation)."""
        config = step.get('config', {})
        instruction = config.get('instruction', step.get('description', ''))
        
        logger.info(f"Processing instruction: {instruction}")
        
        # Instructions are typically just for documentation/logging
        # Could potentially call LLM here if needed
        return {
            'status': 'completed',
            'instruction': instruction,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _execute_condition_step(
        self,
        step: Dict[str, Any],
        context: Dict[str, Any],
        agent_run_id: str,
        thread_id: str,
        project_id: str,
        user_id: str,
        trace: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Execute a conditional step."""
        conditions = step.get('conditions', {})
        children = step.get('children', [])
        
        # Evaluate condition (simplified for now)
        condition_met = await self._evaluate_condition(conditions, context)
        
        if condition_met and children:
            # Execute child steps
            results = []
            for child_step in children:
                child_result = await self._execute_tool_step(
                    child_step, context, agent_run_id, thread_id, project_id, user_id, trace
                )
                results.append(child_result)
            
            return {
                'status': 'completed',
                'condition_met': True,
                'child_results': results
            }
        
        return {
            'status': 'completed',
            'condition_met': condition_met,
            'message': 'No child steps executed' if not condition_met else 'No child steps defined'
        }
    
    async def _evaluate_condition(self, conditions: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Evaluate a condition based on context."""
        # Simplified condition evaluation
        # In a real implementation, this would parse and evaluate complex conditions
        
        # For now, check if previous step had changes (for monitoring workflows)
        if 'check_changes' in str(conditions).lower():
            prev_results = list(context['results'].values())
            if prev_results:
                last_result = prev_results[-1]
                return last_result.get('has_changes', False)
        
        # Default to true for now
        return True
    
    async def _execute_browser_navigate(self, args: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Navigate to a URL and capture content."""
        url = args.get('url', context['input'].get('url'))
        
        if not url:
            return {'status': 'error', 'error': 'No URL provided'}
        
        # In a real implementation, this would use a headless browser
        # For now, we'll simulate
        logger.info(f"Navigating to: {url}")
        
        # Simulate capturing data
        return {
            'status': 'completed',
            'url': url,
            'content': f'Simulated content from {url}',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _execute_gmail_send(self, args: Dict[str, Any], context: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Send email via Gmail."""
        to_email = args.get('to', context['input'].get('email'))
        subject = args.get('subject', 'Workflow Notification')
        body = args.get('body', '')
        
        # Format body with context data
        if '{' in body:
            try:
                body = body.format(**context['results'])
            except:
                pass  # Keep original if formatting fails
        
        logger.info(f"Sending email to: {to_email}")
        
        # In a real implementation, this would use Gmail API
        # For now, we'll simulate
        return {
            'status': 'completed',
            'to': to_email,
            'subject': subject,
            'message': 'Email sent successfully (simulated)',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _execute_create_file(self, args: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a file (for snapshots)."""
        filename = args.get('filename', 'snapshot.json')
        content = args.get('content', json.dumps(context['results']))
        
        logger.info(f"Creating file: {filename}")
        
        # In a real implementation, this would save to storage
        # For now, we'll simulate
        return {
            'status': 'completed',
            'filename': filename,
            'size': len(content),
            'message': 'File created successfully (simulated)',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _publish_status(self, agent_run_id: str, thread_id: str, data: Dict[str, Any]):
        """Publish status update to Redis."""
        try:
            response_channel = f"agent_run:{agent_run_id}:new_response"
            response_list_key = f"agent_run:{agent_run_id}:responses"
            
            # Add metadata
            data['timestamp'] = datetime.now(timezone.utc).isoformat()
            data['thread_id'] = thread_id
            
            # Store in Redis
            await redis.rpush(response_list_key, json.dumps(data))
            await redis.publish(response_channel, "new")
            
            # Set TTL
            await redis.expire(response_list_key, 3600)  # 1 hour
            
        except Exception as e:
            logger.error(f"Failed to publish status: {e}")