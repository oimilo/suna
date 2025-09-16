import json
from typing import Optional, Dict, Any, List
from agentpress.tool import ToolResult, openapi_schema, xml_schema
from agentpress.thread_manager import ThreadManager
from .base_tool import AgentBuilderBaseTool
from utils.logger import logger
from datetime import datetime
from services.supabase import DBConnection
from triggers import get_trigger_service
from triggers import TriggerType
from triggers.utils import format_workflow_for_llm


class TriggerTool(AgentBuilderBaseTool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__(thread_manager, db_connection, agent_id)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_scheduled_trigger",
            "description": "Create a scheduled trigger for the agent to execute workflows or direct agent runs using cron expressions. This allows the agent to run automatically at specified times.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the scheduled trigger. Should be descriptive of when/why it runs."
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of what this trigger does and when it runs."
                    },
                    "cron_expression": {
                        "type": "string",
                        "description": "Cron expression defining when to run (e.g., '0 9 * * *' for daily at 9am, '*/30 * * * *' for every 30 minutes)"
                    },
                    "execution_type": {
                        "type": "string",
                        "enum": ["workflow", "agent"],
                        "description": "Whether to execute a workflow or run the agent directly. Auto-detected if not provided based on workflow_id or agent_prompt"
                    },
                    "workflow_id": {
                        "type": "string",
                        "description": "ID of the workflow to execute (required if execution_type is 'workflow')"
                    },
                    "workflow_input": {
                        "type": "object",
                        "description": "Input data to pass to the workflow (optional, only for workflow execution)",
                        "additionalProperties": True
                    },
                    "agent_prompt": {
                        "type": "string",
                        "description": "Prompt to send to the agent when triggered (required if execution_type is 'agent')"
                    },
                    "execution_recipe": {
                        "type": "object",
                        "description": "Optional compact execution recipe (goal, tools, recipe steps, success). If provided, the executor will receive it as RECIPE:{json}.",
                        "additionalProperties": True
                    }
                },
                "required": ["name", "cron_expression"]
            }
        }
    })
    @xml_schema(
        tag_name="create-scheduled-trigger",
        mappings=[
            {"param_name": "name", "node_type": "attribute", "path": ".", "required": True},
            {"param_name": "description", "node_type": "element", "path": "description", "required": False},
            {"param_name": "cron_expression", "node_type": "attribute", "path": ".", "required": True},
            {"param_name": "execution_type", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "workflow_id", "node_type": "element", "path": "workflow_id", "required": False},
            {"param_name": "workflow_input", "node_type": "element", "path": "workflow_input", "required": False},
            {"param_name": "agent_prompt", "node_type": "element", "path": "agent_prompt", "required": False}
        ],
        example='''
        <function_calls>
        <invoke name="create_scheduled_trigger">
        <parameter name="name">Daily Report Generation</parameter>
        <parameter name="description">Generates daily reports every morning at 9 AM</parameter>
        <parameter name="cron_expression">0 9 * * *</parameter>
        <parameter name="execution_type">workflow</parameter>
        <parameter name="workflow_id">workflow-123</parameter>
        <parameter name="workflow_input">{"report_type": "daily", "include_charts": true}</parameter>
        </invoke>
        </function_calls>
        '''
    )
    async def create_scheduled_trigger(
        self,
        name: str,
        cron_expression: str,
        execution_type: Optional[str] = None,
        description: Optional[str] = None,
        workflow_id: Optional[str] = None,
        workflow_input: Optional[Dict[str, Any]] = None,
        agent_prompt: Optional[str] = None,
        execution_recipe: Optional[Dict[str, Any]] = None
    ) -> ToolResult:
        try:
            # Always execute as agent for new triggers. If workflow_id is provided,
            # convert it to an agent prompt using the workflow definition.
            client = await self.db.client
            workflow_name: Optional[str] = None
            original_workflow_id = workflow_id

            if workflow_id and not agent_prompt:
                workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).eq('agent_id', self.agent_id).execute()
                if not workflow_result.data:
                    return self.fail_response(f"Workflow {workflow_id} not found or doesn't belong to this agent")
                workflow = workflow_result.data[0]
                workflow_name = workflow.get('name')
                if workflow.get('status') != 'active':
                    return self.fail_response(f"Workflow '{workflow_name}' is not active. Please activate it first.")
                steps_json = workflow.get('steps', [])
                agent_prompt = format_workflow_for_llm(
                    workflow_config=workflow,
                    steps=steps_json,
                    input_data=workflow_input
                )

            if not agent_prompt:
                return self.fail_response("agent_prompt is required (provide it directly or a valid workflow_id to convert)")

            # Force execution_type to agent and clear workflow fields for storage
            execution_type = "agent"
            workflow_id = None
            workflow_input = None

            trigger_config = {
                "cron_expression": cron_expression,
                "execution_type": "agent",
                "provider_id": "schedule",
                "agent_prompt": agent_prompt
            }
            # Attach optional execution recipe for prompt-only flows
            try:
                if execution_recipe and isinstance(execution_recipe, dict):
                    import json as _json
                    # Validate compactness (rough limit)
                    _json.dumps(execution_recipe)  # ensure serializable
                    trigger_config["execution_recipe"] = execution_recipe
            except Exception as _e:
                logger.warning(f"Invalid execution_recipe ignored: {_e}")
            if original_workflow_id:
                trigger_config["converted_from_workflow"] = True
                trigger_config["source_workflow_id"] = original_workflow_id
                # Build a compact execution recipe from workflow steps to help the executor cut discovery
                try:
                    wf = workflow if 'workflow' in locals() else None
                    if not wf:
                        wf_result = await client.table('agent_workflows').select('*').eq('id', original_workflow_id).eq('agent_id', self.agent_id).execute()
                        if wf_result.data:
                            wf = wf_result.data[0]
                    if wf:
                        steps_json = wf.get('steps', []) or []
                        recipe_steps = []
                        required_tools = []
                        for s in steps_json:
                            if s.get('type') == 'tool':
                                tool_name = (s.get('config') or {}).get('tool_name')
                                if tool_name and tool_name not in required_tools:
                                    required_tools.append(tool_name)
                                recipe_steps.append({
                                    "step": s.get('name') or 'Unnamed',
                                    "tool": tool_name,
                                    "args": (s.get('config') or {}).get('args', {})
                                })
                        execution_recipe = {
                            "goal": wf.get('description') or wf.get('name'),
                            "inputs": {},
                            "tools": [{"name": t} for t in required_tools],
                            "recipe": recipe_steps,
                            "success": ["No API error returned", "Outputs match expected format"]
                        }
                        trigger_config["execution_recipe"] = execution_recipe
                except Exception as _e:
                    logger.warning(f"Failed to build execution recipe: {_e}")
            
            trigger_svc = get_trigger_service(self.db)
            
            try:
                trigger = await trigger_svc.create_trigger(
                    agent_id=self.agent_id,
                    provider_id="schedule",
                    name=name,
                    config=trigger_config,
                    description=description
                )
                
                result_message = f"Scheduled trigger '{name}' created successfully!\n\n"
                result_message += f"**Schedule**: {cron_expression}\n"
                result_message += f"**Type**: Agent execution\n"
                if workflow_name:
                    result_message += f"**Converted from Workflow**: {workflow_name}\n"
                result_message += f"**Prompt**: {agent_prompt}\n"
                if trigger_config.get("execution_recipe"):
                    result_message += f"**Recipe**: attached\n"
                
                result_message += f"\nThe trigger is now active and will run according to the schedule."
                
                return self.success_response({
                    "message": result_message,
                    "trigger": {
                        "id": trigger.trigger_id,
                        "name": trigger.name,
                        "description": trigger.description,
                        "cron_expression": cron_expression,
                        "execution_type": execution_type,
                        "is_active": trigger.is_active,
                        "created_at": trigger.created_at.isoformat()
                    }
                })
            except ValueError as ve:
                return self.fail_response(f"Validation error: {str(ve)}")
            except Exception as e:
                logger.error(f"Error creating trigger through manager: {str(e)}")
                return self.fail_response(f"Failed to create trigger: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error creating scheduled trigger: {str(e)}")
            return self.fail_response(f"Error creating scheduled trigger: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_scheduled_triggers",
            "description": "Get all scheduled triggers for the current agent. Shows when the agent will run automatically.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    })
    @xml_schema(
        tag_name="get-scheduled-triggers",
        mappings=[],
        example='''
        <function_calls>
        <invoke name="get_scheduled_triggers">
        </invoke>
        </function_calls>
        '''
    )
    async def get_scheduled_triggers(self) -> ToolResult:
        try:
            trigger_svc = get_trigger_service(self.db)
            
            triggers = await trigger_svc.get_agent_triggers(self.agent_id)
            
            # Filter for schedule type triggers
            schedule_triggers = [t for t in triggers if t.trigger_type == TriggerType.SCHEDULE]
            
            if not schedule_triggers:
                return self.success_response({
                    "message": "No scheduled triggers found for this agent.",
                    "triggers": []
                })
            
            client = await self.db.client
            workflows = {}
            for trigger in schedule_triggers:
                if trigger.config.get("execution_type") == "workflow" and trigger.config.get("workflow_id"):
                    workflow_id = trigger.config["workflow_id"]
                    if workflow_id not in workflows:
                        workflow_result = await client.table('agent_workflows').select('name').eq('id', workflow_id).execute()
                        if workflow_result.data:
                            workflows[workflow_id] = workflow_result.data[0]['name']
            
            formatted_triggers = []
            for trigger in schedule_triggers:
                formatted = {
                    "id": trigger.trigger_id,
                    "name": trigger.name,
                    "description": trigger.description,
                    "cron_expression": trigger.config.get("cron_expression"),
                    "execution_type": trigger.config.get("execution_type", "agent"),
                    "is_active": trigger.is_active,
                    "created_at": trigger.created_at.isoformat()
                }
                
                if trigger.config.get("execution_type") == "workflow":
                    workflow_id = trigger.config.get("workflow_id")
                    formatted["workflow_name"] = workflows.get(workflow_id, "Unknown Workflow")
                    formatted["workflow_input"] = trigger.config.get("workflow_input")
                else:
                    formatted["agent_prompt"] = trigger.config.get("agent_prompt")
                
                formatted_triggers.append(formatted)
            
            return self.success_response({
                "message": f"Found {len(formatted_triggers)} scheduled trigger(s)",
                "triggers": formatted_triggers
            })
                    
        except Exception as e:
            logger.error(f"Error getting scheduled triggers: {str(e)}")
            return self.fail_response(f"Error getting scheduled triggers: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "delete_scheduled_trigger",
            "description": "Delete a scheduled trigger. The agent will no longer run automatically at the scheduled time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "trigger_id": {
                        "type": "string",
                        "description": "ID of the trigger to delete"
                    }
                },
                "required": ["trigger_id"]
            }
        }
    })
    @xml_schema(
        tag_name="delete-scheduled-trigger",
        mappings=[
            {"param_name": "trigger_id", "node_type": "attribute", "path": ".", "required": True}
        ],
        example='''
        <function_calls>
        <invoke name="delete_scheduled_trigger">
        <parameter name="trigger_id">trigger-123</parameter>
        </invoke>
        </function_calls>
        '''
    )
    async def delete_scheduled_trigger(self, trigger_id: str) -> ToolResult:
        try:
            trigger_svc = get_trigger_service(self.db)
            
            trigger_config = await trigger_svc.get_trigger(trigger_id)
            
            if not trigger_config:
                return self.fail_response("Trigger not found")
            
            if trigger_config.agent_id != self.agent_id:
                return self.fail_response("This trigger doesn't belong to the current agent")
            
            success = await trigger_svc.delete_trigger(trigger_id)
            
            if success:
                return self.success_response({
                    "message": f"Scheduled trigger '{trigger_config.name}' deleted successfully",
                    "trigger_id": trigger_id
                })
            else:
                return self.fail_response("Failed to delete trigger")
                    
        except Exception as e:
            logger.error(f"Error deleting scheduled trigger: {str(e)}")
            return self.fail_response(f"Error deleting scheduled trigger: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "toggle_scheduled_trigger",
            "description": "Enable or disable a scheduled trigger. Disabled triggers won't run until re-enabled.",
            "parameters": {
                "type": "object",
                "properties": {
                    "trigger_id": {
                        "type": "string",
                        "description": "ID of the trigger to toggle"
                    },
                    "is_active": {
                        "type": "boolean",
                        "description": "Whether to enable (true) or disable (false) the trigger"
                    }
                },
                "required": ["trigger_id", "is_active"]
            }
        }
    })
    @xml_schema(
        tag_name="toggle-scheduled-trigger",
        mappings=[
            {"param_name": "trigger_id", "node_type": "attribute", "path": ".", "required": True},
            {"param_name": "is_active", "node_type": "attribute", "path": ".", "required": True}
        ],
        example='''
        <function_calls>
        <invoke name="toggle_scheduled_trigger">
        <parameter name="trigger_id">trigger-123</parameter>
        <parameter name="is_active">false</parameter>
        </invoke>
        </function_calls>
        '''
    )
    async def toggle_scheduled_trigger(self, trigger_id: str, is_active: bool) -> ToolResult:
        try:
            trigger_svc = get_trigger_service(self.db)
            
            trigger_config = await trigger_svc.get_trigger(trigger_id)
            
            if not trigger_config:
                return self.fail_response("Trigger not found")
            
            if trigger_config.agent_id != self.agent_id:
                return self.fail_response("This trigger doesn't belong to the current agent")
            
            updated_config = await trigger_svc.update_trigger(
                trigger_id=trigger_id,
                is_active=is_active
            )
            
            if updated_config:
                status = "enabled" if is_active else "disabled"
                return self.success_response({
                    "message": f"Scheduled trigger '{updated_config.name}' has been {status}",
                    "trigger": {
                        "id": updated_config.trigger_id,
                        "name": updated_config.name,
                        "is_active": updated_config.is_active
                    }
                })
            else:
                return self.fail_response("Failed to update trigger")
                    
        except Exception as e:
            logger.error(f"Error toggling scheduled trigger: {str(e)}")
            return self.fail_response(f"Error toggling scheduled trigger: {str(e)}")
