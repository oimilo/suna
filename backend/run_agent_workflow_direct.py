"""
Direct workflow execution without Dramatiq for production use.
This module provides a way to execute workflows directly using asyncio,
bypassing the Dramatiq/RabbitMQ dependency that doesn't work in production.
"""

import asyncio
import json
import traceback
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from services import redis
from utils.logger import logger, structlog
from agentpress.thread_manager import ThreadManager
from services.supabase import DBConnection
from services.langfuse import langfuse
from utils.retry import retry
from core.workflow_executor import WorkflowExecutor
import sentry_sdk


async def run_workflow_direct(
    agent_run_id: str,
    thread_id: str,
    project_id: str,
    model_name: str,
    agent_config: Dict[str, Any],
    workflow_id: str,
    workflow_input: Dict[str, Any],
    instance_id: str = "workflow_executor"
) -> None:
    """
    Execute a workflow directly without using Dramatiq.
    This uses the WorkflowExecutor to process workflow steps sequentially.
    """
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        agent_run_id=agent_run_id,
        thread_id=thread_id,
        workflow_id=workflow_id
    )
    
    logger.info(f"Starting direct workflow execution: {agent_run_id} for workflow: {workflow_id}")
    
    # Initialize database connection
    db = DBConnection()
    client = await db.client
    
    # Idempotency check: prevent duplicate runs
    run_lock_key = f"agent_run_lock:{agent_run_id}"
    lock_acquired = await redis.set(run_lock_key, instance_id, nx=True, ex=redis.REDIS_KEY_TTL)
    
    if not lock_acquired:
        existing_instance = await redis.get(run_lock_key)
        logger.info(f"Workflow run {agent_run_id} already being processed by {existing_instance}. Skipping.")
        return
    
    # Setup Redis keys for responses
    response_list_key = f"agent_run:{agent_run_id}:responses"
    response_channel = f"agent_run:{agent_run_id}:new_response"
    instance_active_key = f"active_run:{instance_id}:{agent_run_id}"
    
    # Create Langfuse trace
    trace = langfuse.trace(
        name="workflow_run",
        id=agent_run_id,
        session_id=thread_id,
        metadata={
            "project_id": project_id,
            "workflow_id": workflow_id,
            "instance_id": instance_id
        }
    )
    
    try:
        # Mark instance as active
        await redis.set(instance_active_key, "running", ex=redis.REDIS_KEY_TTL)
        
        # Get user_id from agent_run
        agent_run_result = await client.table('agent_runs').select('account_id').eq('id', agent_run_id).execute()
        if not agent_run_result.data:
            raise ValueError(f"Agent run {agent_run_id} not found")
        user_id = agent_run_result.data[0]['account_id']
        
        # Initialize workflow executor
        executor = WorkflowExecutor(db)
        
        # Execute the workflow
        logger.info(f"Executing workflow {workflow_id} with input: {workflow_input}")
        result = await executor.execute_workflow(
            workflow_id=workflow_id,
            workflow_input=workflow_input,
            agent_run_id=agent_run_id,
            thread_id=thread_id,
            project_id=project_id,
            user_id=user_id,
            agent_config=agent_config,
            trace=trace
        )
        
        # Determine final status
        final_status = result.get('status', 'failed')
        error_message = result.get('error')
        
        # Store final result in Redis
        final_response = {
            "type": "workflow_result",
            "status": final_status,
            "results": result.get('results', {}),
            "errors": result.get('errors', [])
        }
        await redis.rpush(response_list_key, json.dumps(final_response))
        await redis.publish(response_channel, "complete")
        
        logger.info(f"Workflow run {agent_run_id} completed with status: {final_status}")
        
    except Exception as e:
        logger.error(f"Error in workflow execution {agent_run_id}: {e}", exc_info=True)
        final_status = "failed"
        error_message = str(e)
        
        # Store error in response stream
        error_response = {
            "type": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        await redis.rpush(response_list_key, json.dumps(error_response))
        await redis.publish(response_channel, "error")
        
    finally:
        # Update agent run status in database
        try:
            update_data = {
                "status": final_status,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            if error_message:
                update_data["error"] = error_message
                
            await client.table('agent_runs').update(update_data).eq("id", agent_run_id).execute()
            logger.info(f"Updated workflow run {agent_run_id} status to {final_status}")
            
        except Exception as db_error:
            logger.error(f"Failed to update workflow run status for {agent_run_id}: {db_error}")
        
        # Cleanup Redis keys
        try:
            await redis.delete(run_lock_key)
            await redis.delete(instance_active_key)
            # Set TTL on response list
            await redis.expire(response_list_key, redis.REDIS_KEY_TTL)
        except Exception as cleanup_error:
            logger.warning(f"Failed to cleanup Redis keys for {agent_run_id}: {cleanup_error}")
        
        # End trace
        trace.span(name="workflow_completion").end(
            status_message=f"Workflow {final_status}",
            level="INFO" if final_status == "completed" else "ERROR"
        )
        
    logger.info(f"Workflow execution {agent_run_id} finished with status: {final_status}")