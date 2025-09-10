"""
Internal API endpoints for Edge Functions
These endpoints are only callable from Supabase Edge Functions with proper authentication
"""

import hmac
import asyncio
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from datetime import datetime, timezone

from services.supabase import DBConnection
from utils.logger import logger
from services import redis
from agent.run import run_agent
from services.langfuse import langfuse

router = APIRouter(prefix="/internal", tags=["internal"])

class ExecuteAgentRequest(BaseModel):
    agent_run_id: str
    thread_id: str
    project_id: str
    agent_config: Dict[str, Any]
    model_name: str = "anthropic/claude-sonnet-4-20250514"
    enable_thinking: bool = False
    reasoning_effort: str = "low"
    trigger_variables: Optional[Dict[str, Any]] = {}


async def verify_internal_secret(request: Request):
    """Verify the internal secret from Edge Function"""
    import os
    
    expected_secret = os.getenv("TRIGGER_SECRET")
    if not expected_secret:
        logger.error("TRIGGER_SECRET not configured")
        raise HTTPException(status_code=500, detail="Server misconfiguration")
    
    incoming_secret = request.headers.get("x-internal-secret", "")
    
    if not hmac.compare_digest(incoming_secret, expected_secret):
        logger.warning("Invalid internal secret attempt")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return True


@router.post("/execute-agent")
async def execute_agent_internal(
    request: ExecuteAgentRequest,
    req: Request,
    authorized: bool = Depends(verify_internal_secret)
):
    """
    Internal endpoint to execute agent asynchronously.
    Called by Supabase Edge Function after trigger validation.
    """
    logger.info(f"Internal agent execution request: agent_run_id={request.agent_run_id}, thread_id={request.thread_id}")
    
    try:
        # Start async execution
        asyncio.create_task(
            _execute_agent_background(
                agent_run_id=request.agent_run_id,
                thread_id=request.thread_id,
                project_id=request.project_id,
                agent_config=request.agent_config,
                model_name=request.model_name,
                enable_thinking=request.enable_thinking,
                reasoning_effort=request.reasoning_effort,
                trigger_variables=request.trigger_variables
            )
        )
        
        logger.info(f"Agent execution task created for {request.agent_run_id}")
        
        return {
            "success": True,
            "message": "Agent execution started",
            "agent_run_id": request.agent_run_id,
            "thread_id": request.thread_id
        }
        
    except Exception as e:
        logger.error(f"Failed to start agent execution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _execute_agent_background(
    agent_run_id: str,
    thread_id: str,
    project_id: str,
    agent_config: Dict[str, Any],
    model_name: str,
    enable_thinking: bool,
    reasoning_effort: str,
    trigger_variables: Dict[str, Any]
):
    """
    Execute agent in background, similar to what Dramatiq would have done
    """
    db = DBConnection()
    await db.initialize()
    client = await db.client
    
    try:
        logger.info(f"Starting background agent execution: {agent_run_id}")
        
        # Create trace for monitoring
        trace = langfuse.trace(
            name="trigger_agent_run",
            id=agent_run_id,
            session_id=thread_id,
            metadata={
                "project_id": project_id,
                "trigger": True,
                "trigger_variables": trigger_variables
            }
        )
        
        # Run agent
        response_count = 0
        final_status = "running"
        error_message = None
        
        # Store responses in Redis for SSE streaming
        response_key = f"agent_run:{agent_run_id}:responses"
        response_channel = f"agent_run:{agent_run_id}:new_response"
        
        async for response in run_agent(
            thread_id=thread_id,
            project_id=project_id,
            stream=False,  # No streaming for background execution
            model_name=model_name,
            enable_thinking=enable_thinking,
            reasoning_effort=reasoning_effort,
            enable_context_manager=True,
            agent_config=agent_config,
            trace=trace,
            is_agent_builder=False,
            target_agent_id=None
        ):
            response_count += 1
            
            # Store response in Redis
            import json
            await redis.rpush(response_key, json.dumps(response))
            await redis.publish(response_channel, "new")
            
            # Check for completion
            if response.get('type') == 'status':
                status_val = response.get('status')
                if status_val in ['completed', 'failed', 'stopped']:
                    final_status = status_val
                    if status_val == 'failed':
                        error_message = response.get('message', 'Agent execution failed')
                    break
        
        # If loop finished without explicit status, mark as completed
        if final_status == "running":
            final_status = "completed"
        
        # Update agent run status in database
        update_data = {
            "status": final_status,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        
        if error_message:
            update_data["error"] = error_message
        
        await client.table('agent_runs').update(update_data).eq("id", agent_run_id).execute()
        
        # Set TTL on Redis responses (24 hours)
        await redis.expire(response_key, 86400)
        
        logger.info(f"Agent run completed: {agent_run_id}, status: {final_status}, responses: {response_count}")
        
    except Exception as e:
        logger.error(f"Error in background agent execution {agent_run_id}: {e}")
        
        try:
            # Update status to failed
            await client.table('agent_runs').update({
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }).eq("id", agent_run_id).execute()
            
            # Send error response to Redis
            import json
            error_response = {"type": "status", "status": "error", "message": str(e)}
            await redis.rpush(response_key, json.dumps(error_response))
            await redis.publish(response_channel, "new")
            
        except Exception as update_error:
            logger.error(f"Failed to update agent run status after error: {update_error}")


@router.get("/health")
async def health_check(authorized: bool = Depends(verify_internal_secret)):
    """Health check endpoint for internal API"""
    return {"status": "healthy", "service": "internal_api"}