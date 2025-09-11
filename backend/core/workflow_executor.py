"""
Workflow Executor for Prophet/Suna
Executes workflow steps defined in the database instead of treating them as chat conversations.
"""

import json
import asyncio
import traceback
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from utils.logger import logger, structlog
from services.supabase import DBConnection
from services.redis import redis
from services.langfuse import langfuse


class WorkflowExecutor:
    """Executes workflow steps sequentially."""
    
    def __init__(self, db: DBConnection):
        self.db = db
        self.tool_instances = {}
        
    async def execute_workflow(
        self,
        workflow_id: str,
        workflow_input: Dict[str, Any],
        agent_run_id: str,
        thread_id: str,
        project_id: str,
        user_id: str,
        trace: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Execute a workflow by processing its steps sequentially.
        
        Returns:
            Dict with status and results
        """
        logger.info(f"Starting workflow execution: {workflow_id}")
        
        try:
            # Get workflow definition from database
            client = await self.db.client
            workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).execute()
            
            if not workflow_result.data:
                raise ValueError(f"Workflow {workflow_id} not found")
            
            workflow = workflow_result.data[0]
            steps = workflow.get('steps', [])
            
            logger.info(f"Executing workflow '{workflow['name']}' with {len(steps)} steps")
            
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
        
        # Special handling for specific tools
        if tool_name == 'browser_navigate_to':
            return await self._execute_browser_navigate(tool_args, context)
        elif tool_name == 'gmail_send_email':
            return await self._execute_gmail_send(tool_args, context, user_id)
        elif tool_name == 'create_file':
            return await self._execute_create_file(tool_args, context)
        else:
            # Generic tool execution (would need proper tool registry)
            logger.warning(f"Tool {tool_name} not implemented in workflow executor")
            return {
                'status': 'not_implemented',
                'tool': tool_name,
                'message': f'Tool {tool_name} execution not yet implemented'
            }
    
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