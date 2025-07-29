"""
Simple version of run_agent_background without RabbitMQ/Dramatiq
For production environments where RabbitMQ is not available
"""
import asyncio
import json
import traceback
from datetime import datetime, timezone
from typing import Optional
from services.redis import get_client as get_redis_client
from agent.run import run_agent
from utils.logger import logger
import uuid
from agentpress.thread_manager import ThreadManager
from services.supabase import DBConnection

db = DBConnection()
instance_id = "single"

async def initialize():
    """Initialize the agent API with resources from the main API."""
    global db, instance_id
    
    if not instance_id:
        instance_id = str(uuid.uuid4())[:8]
    # Redis is initialized by the main app
    await db.initialize()
    
    logger.info(f"Initialized simple agent API with instance ID: {instance_id}")

async def run_agent_async(
    agent_id: str,
    agent_run_id: str,
    user_id: str,
    thread_id: str,
    project_id: str,
    account_id: str,
    db_ref: DBConnection,
    instance_id_ref: str = "single",
    prompt: Optional[str] = None,
    model_name: Optional[str] = None,
    agent_config: Optional[dict] = None,
    enable_thinking: bool = False,
    reasoning_effort: str = "low",
    message_id: Optional[str] = None,
    has_attachments: bool = False,
    agent_version_id: Optional[str] = None,
) -> None:
    """Run the agent directly without RabbitMQ."""
    
    logger.info(f"Starting agent run {agent_run_id} for thread {thread_id}")
    
    try:
        # Initialize the response streaming for this agent run
        response_list_key = f"agent_run:{agent_run_id}:responses"
        response_channel = f"agent_run:{agent_run_id}:new_response"
        control_channel = f"agent_run:{agent_run_id}:control"
        
        # Run the agent with streaming
        agent_gen = run_agent(
            thread_id=thread_id,
            project_id=project_id,
            stream=True,  # Enable SSE streaming
            model_name=model_name,
            enable_thinking=enable_thinking,
            reasoning_effort=reasoning_effort,
            agent_config=agent_config,
        )
        
        # Process the streaming responses
        async for response in agent_gen:
            try:
                # Store response in Redis for SSE streaming
                redis = await get_redis_client()
                response_json = json.dumps(response)
                await redis.rpush(response_list_key, response_json)
                await redis.publish(response_channel, "new")
                
                # Log important events
                if response.get('type') == 'status' and response.get('status') == 'completed':
                    logger.info(f"Agent run {agent_run_id} completed successfully")
                    
            except Exception as e:
                logger.error(f"Error processing response: {e}")
                continue
        
        logger.info(f"Successfully completed agent run {agent_run_id}")
        
        # Update agent run status to completed and send END_STREAM signal
        try:
            client = await db.client
            await client.table('agent_runs').update({
                'status': 'completed',
                'completed_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', agent_run_id).execute()
            
            # Send END_STREAM signal to control channel
            redis = await get_redis_client()
            await redis.publish(control_channel, "END_STREAM")
            logger.debug(f"Published END_STREAM signal to {control_channel}")
        except Exception as completion_error:
            logger.error(f"Failed to update completion status or send END_STREAM: {completion_error}")
        
    except Exception as e:
        error_msg = f"Error in agent run {agent_run_id}: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        
        # Update agent run status to error
        try:
            client = await db.client
            await client.table('agent_runs').update({
                'status': 'error',
                'error': str(e),
                'completed_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', agent_run_id).execute()
            
            # Send ERROR signal to control channel
            redis = await get_redis_client()
            await redis.publish(control_channel, "ERROR")
            logger.debug(f"Published ERROR signal to {control_channel}")
        except Exception as update_error:
            logger.error(f"Failed to update agent run status or send ERROR signal: {update_error}")

# No dramatiq decorator - this is just a regular async function
check_health = None