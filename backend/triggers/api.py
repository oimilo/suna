from fastapi import APIRouter, HTTPException, Depends, Request, Body, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import os
import uuid
from datetime import datetime, timezone
import json
import hmac

from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from utils.logger import logger
from flags.flags import is_enabled
from utils.config import config
from services.billing import check_billing_status, can_use_model

from .trigger_service import get_trigger_service, TriggerType
from .provider_service import get_provider_service
from .execution_service import get_execution_service
from .utils import get_next_run_time, get_human_readable_schedule
from . import api_all_triggers
from .api_all_triggers import router as all_triggers_router


# ===== ROUTERS =====

router = APIRouter(prefix="/triggers", tags=["triggers"])
workflows_router = APIRouter(prefix="/workflows", tags=["workflows"])

# Global database connection
db: Optional[DBConnection] = None

def setup_database(database: DBConnection):
    """Setup database connection for triggers module"""
    global db
    db = database
    # Also set the db for the all_triggers module
    api_all_triggers.db = database

def initialize(database: DBConnection):
    """Initialize triggers module with database connection"""
    setup_database(database)
    logger.info(f"Triggers module initialized with db: {database is not None}")
    
    # Log registered routes for debugging
    logger.info("=== TRIGGERS ROUTES REGISTERED ===")
    for route in router.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            logger.info(f"  {list(route.methods)} {router.prefix}{route.path}")
    
    logger.info("=== WORKFLOWS ROUTES REGISTERED ===")
    for route in workflows_router.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            logger.info(f"  {list(route.methods)} {router.prefix}{workflows_router.prefix}{route.path}")

# IMPORTANT: Include sub-routers BEFORE defining catch-all routes like /{trigger_id}
# This ensures that specific routes like /all and /stats are matched before /{trigger_id}
router.include_router(all_triggers_router)
# NOTE: workflows_router will be included at the end of the file after all routes are defined


# ===== REQUEST/RESPONSE MODELS =====

class TriggerCreateRequest(BaseModel):
    provider_id: str
    name: str
    config: Dict[str, Any]
    description: Optional[str] = None


class TriggerUpdateRequest(BaseModel):
    config: Optional[Dict[str, Any]] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TriggerResponse(BaseModel):
    trigger_id: str
    agent_id: str
    trigger_type: str
    provider_id: str
    name: str
    description: Optional[str]
    is_active: bool
    webhook_url: Optional[str]
    created_at: str
    updated_at: str
    config: Dict[str, Any]


class ProviderResponse(BaseModel):
    provider_id: str
    name: str
    description: str
    trigger_type: str
    webhook_enabled: bool
    config_schema: Dict[str, Any]


class UpcomingRun(BaseModel):
    trigger_id: str
    trigger_name: str
    trigger_type: str
    next_run_time: str
    next_run_time_local: str
    timezone: str
    cron_expression: str
    execution_type: str
    agent_prompt: Optional[str] = None
    workflow_id: Optional[str] = None
    is_active: bool
    human_readable: str


class UpcomingRunsResponse(BaseModel):
    upcoming_runs: List[UpcomingRun]
    total_count: int


class AutomationItem(BaseModel):
    trigger_id: str | None = None
    trigger_type: Optional[str] = None
    thread_id: str
    project_id: Optional[str] = None
    agent_id: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    last_run_at: Optional[str] = None
    runs_count: int = 0


class AutomationsResponse(BaseModel):
    automations: List[AutomationItem]
    total_count: int


# Workflow models
class WorkflowStepRequest(BaseModel):
    name: str
    description: Optional[str] = None
    type: Optional[str] = "instruction"
    config: Dict[str, Any] = {}
    conditions: Optional[Dict[str, Any]] = None
    order: int
    children: Optional[List['WorkflowStepRequest']] = None


class WorkflowCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_phrase: Optional[str] = None
    is_default: bool = False
    steps: List[WorkflowStepRequest] = []


class WorkflowUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_phrase: Optional[str] = None
    is_default: Optional[bool] = None
    status: Optional[str] = None
    steps: Optional[List[WorkflowStepRequest]] = None


class WorkflowExecuteRequest(BaseModel):
    input_data: Optional[Dict[str, Any]] = None


# Rebuild models to handle forward references
WorkflowStepRequest.model_rebuild()



async def verify_agent_access(agent_id: str, user_id: str):
    """Verify user has access to the agent"""
    client = await db.client
    result = await client.table('agents').select('agent_id').eq('agent_id', agent_id).eq('account_id', user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Agent not found or access denied")


# ===== PROVIDER ENDPOINTS =====

@router.get("/test")
async def test_triggers_route():
    """Test endpoint to verify triggers router is working"""
    return {"status": "ok", "message": "Triggers router is working", "db_initialized": db is not None}


@router.get("/providers")
async def get_providers():
    """Get available trigger providers"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    try:
        provider_service = get_provider_service(db)
        providers = await provider_service.get_available_providers()
        
        return [ProviderResponse(**provider) for provider in providers]
        
    except Exception as e:
        logger.error(f"Error getting providers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/automations", response_model=AutomationsResponse)
async def list_automations(
    user_id: str = Depends(get_current_user_id_from_jwt),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """List automations for the current user. An automation is any thread with metadata.is_automation=true.

    Returns latest thread per trigger_id (when available), last_run_at and runs_count.
    """
    client = await db.client
    try:
        # Prefer explicit threads flagged as automations
        q = client.table('threads')\
            .select('thread_id, project_id, account_id, metadata, created_at')\
            .eq('account_id', user_id)\
            .contains('metadata', { 'is_automation': True })\
            .order('created_at', desc=True)

        threads_res = await q.execute()
        threads = threads_res.data or []

        automations: List[AutomationItem] = []

        if threads:
            # Group by trigger_id (fallback: by thread_id when missing)
            groups: Dict[str, Any] = {}
            for t in threads:
                md = t.get('metadata') or {}
                key = md.get('trigger_id') or t['thread_id']
                grp = groups.setdefault(key, {
                    'trigger_id': md.get('trigger_id'),
                    'trigger_type': md.get('trigger_type'),
                    'latest_thread': t,
                    'runs': [t]
                })
                if grp['latest_thread']['created_at'] < t['created_at']:
                    grp['latest_thread'] = t
                grp['runs'].append(t)

            for key, grp in groups.items():
                latest = grp['latest_thread']
                trigger_id = grp.get('trigger_id')
                name = None
                is_active = None
                agent_id = None
                try:
                    if trigger_id:
                        trig = await client.table('agent_triggers').select('name, is_active, agent_id').eq('trigger_id', trigger_id).single().execute()
                        if getattr(trig, 'data', None):
                            name = trig.data.get('name')
                            is_active = trig.data.get('is_active')
                            agent_id = trig.data.get('agent_id')
                except Exception:
                    pass

                automations.append(AutomationItem(
                    trigger_id=trigger_id,
                    trigger_type=grp.get('trigger_type'),
                    thread_id=latest['thread_id'],
                    project_id=latest.get('project_id'),
                    agent_id=agent_id,
                    name=name,
                    is_active=is_active,
                    last_run_at=latest.get('created_at'),
                    runs_count=len(grp['runs'])
                ))
        else:
            # Fallback: derive automations from agent_runs metadata
            runs_q = client.table('agent_runs')\
                .select('id, thread_id, status, started_at, metadata')\
                .eq('account_id', user_id)\
                .filter('metadata->>trigger_execution', 'eq', 'true')\
                .order('started_at', desc=True)
            runs_res = await runs_q.execute()
            runs = runs_res.data or []

            if not runs:
                return AutomationsResponse(automations=[], total_count=0)

            groups: Dict[str, Any] = {}
            for r in runs:
                md = r.get('metadata') or {}
                key = md.get('trigger_id') or r['thread_id']
                grp = groups.setdefault(key, {
                    'trigger_id': md.get('trigger_id'),
                    'latest_run': r,
                    'runs': [r]
                })
                if grp['latest_run']['started_at'] < r['started_at']:
                    grp['latest_run'] = r
                grp['runs'].append(r)

            for key, grp in groups.items():
                latest = grp['latest_run']
                trigger_id = grp.get('trigger_id')
                name = None
                is_active = None
                agent_id = None
                try:
                    if trigger_id:
                        trig = await client.table('agent_triggers').select('name, is_active, agent_id').eq('trigger_id', trigger_id).single().execute()
                        if getattr(trig, 'data', None):
                            name = trig.data.get('name')
                            is_active = trig.data.get('is_active')
                            agent_id = trig.data.get('agent_id')
                except Exception:
                    pass

                # Resolve latest thread_id
                thread_id = latest.get('thread_id')
                automations.append(AutomationItem(
                    trigger_id=trigger_id,
                    trigger_type=None,
                    thread_id=thread_id,
                    project_id=None,
                    agent_id=agent_id,
                    name=name,
                    is_active=is_active,
                    last_run_at=latest.get('started_at'),
                    runs_count=len(grp['runs'])
                ))

        return AutomationsResponse(automations=automations[:limit], total_count=len(automations))
    except Exception as e:
        logger.error(f"Error listing automations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/providers/{provider_id}/schema")
async def get_provider_schema(provider_id: str):
    """Get provider configuration schema"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    try:
        provider_service = get_provider_service(db)
        providers = await provider_service.get_available_providers()
        
        provider = next((p for p in providers if p["provider_id"] == provider_id), None)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        return {"schema": provider["config_schema"]}
        
    except Exception as e:
        logger.error(f"Error getting provider schema: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ===== TRIGGER ENDPOINTS =====

@router.get("/agents/{agent_id}/triggers", response_model=List[TriggerResponse])
async def get_agent_triggers(
    agent_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get all triggers for an agent"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    await verify_agent_access(agent_id, user_id)
    
    try:
        trigger_service = get_trigger_service(db)
        triggers = await trigger_service.get_agent_triggers(agent_id)
        
        base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8000")
        
        responses = []
        for trigger in triggers:
            webhook_url = f"{base_url}/api/triggers/{trigger.trigger_id}/webhook"
            
            responses.append(TriggerResponse(
                trigger_id=trigger.trigger_id,
                agent_id=trigger.agent_id,
                trigger_type=trigger.trigger_type.value,
                provider_id=trigger.provider_id,
                name=trigger.name,
                description=trigger.description,
                is_active=trigger.is_active,
                webhook_url=webhook_url,
                created_at=trigger.created_at.isoformat(),
                updated_at=trigger.updated_at.isoformat(),
                config=trigger.config
            ))
        
        return responses
        
    except Exception as e:
        logger.error(f"Error getting agent triggers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/agents/{agent_id}/upcoming-runs", response_model=UpcomingRunsResponse)
async def get_agent_upcoming_runs(
    agent_id: str,
    limit: int = Query(10, ge=1, le=50),
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get upcoming scheduled runs for agent triggers"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    await verify_agent_access(agent_id, user_id)
    
    try:
        trigger_service = get_trigger_service(db)
        triggers = await trigger_service.get_agent_triggers(agent_id)
        
        # Filter for active schedule triggers
        schedule_triggers = [
            trigger for trigger in triggers 
            if trigger.is_active and trigger.trigger_type == TriggerType.SCHEDULE
        ]
        
        upcoming_runs = []
        for trigger in schedule_triggers:
            config = trigger.config
            cron_expression = config.get('cron_expression')
            user_timezone = config.get('timezone', 'UTC')
            
            if not cron_expression:
                continue
                
            try:
                next_run = get_next_run_time(cron_expression, user_timezone)
                if not next_run:
                    continue
                
                import pytz
                local_tz = pytz.timezone(user_timezone)
                next_run_local = next_run.astimezone(local_tz)
                
                human_readable = get_human_readable_schedule(cron_expression, user_timezone)
                
                upcoming_runs.append(UpcomingRun(
                    trigger_id=trigger.trigger_id,
                    trigger_name=trigger.name,
                    trigger_type=trigger.trigger_type.value,
                    next_run_time=next_run.isoformat(),
                    next_run_time_local=next_run_local.isoformat(),
                    timezone=user_timezone,
                    cron_expression=cron_expression,
                    execution_type=config.get('execution_type', 'agent'),
                    agent_prompt=config.get('agent_prompt'),
                    workflow_id=config.get('workflow_id'),
                    is_active=trigger.is_active,
                    human_readable=human_readable
                ))
                
            except Exception as e:
                logger.warning(f"Error calculating next run for trigger {trigger.trigger_id}: {e}")
                continue
        
        upcoming_runs.sort(key=lambda x: x.next_run_time)
        upcoming_runs = upcoming_runs[:limit]
        
        return UpcomingRunsResponse(
            upcoming_runs=upcoming_runs,
            total_count=len(upcoming_runs)
        )
        
    except Exception as e:
        logger.error(f"Error getting upcoming runs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/agents/{agent_id}/triggers", response_model=TriggerResponse)
async def create_agent_trigger(
    agent_id: str,
    request: TriggerCreateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Create a new trigger for an agent"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
        
    await verify_agent_access(agent_id, user_id)
    
    try:
        trigger_service = get_trigger_service(db)
        
        trigger = await trigger_service.create_trigger(
            agent_id=agent_id,
            provider_id=request.provider_id,
            name=request.name,
            config=request.config,
            description=request.description
        )
        
        base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8000")
        webhook_url = f"{base_url}/api/triggers/{trigger.trigger_id}/webhook"
        
        return TriggerResponse(
            trigger_id=trigger.trigger_id,
            agent_id=trigger.agent_id,
            trigger_type=trigger.trigger_type.value,
            provider_id=trigger.provider_id,
            name=trigger.name,
            description=trigger.description,
            is_active=trigger.is_active,
            webhook_url=webhook_url,
            created_at=trigger.created_at.isoformat(),
            updated_at=trigger.updated_at.isoformat(),
            config=trigger.config
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating trigger: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{trigger_id}", response_model=TriggerResponse)
async def get_trigger(
    trigger_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get a trigger by ID"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    try:
        trigger_service = get_trigger_service(db)
        trigger = await trigger_service.get_trigger(trigger_id)
        
        if not trigger:
            raise HTTPException(status_code=404, detail="Trigger not found")
        
        await verify_agent_access(trigger.agent_id, user_id)
        
        base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8000")
        webhook_url = f"{base_url}/api/triggers/{trigger_id}/webhook"
        
        return TriggerResponse(
            trigger_id=trigger.trigger_id,
            agent_id=trigger.agent_id,
            trigger_type=trigger.trigger_type.value,
            provider_id=trigger.provider_id,
            name=trigger.name,
            description=trigger.description,
            is_active=trigger.is_active,
            webhook_url=webhook_url,
            created_at=trigger.created_at.isoformat(),
            updated_at=trigger.updated_at.isoformat(),
            config=trigger.config
        )
        
    except Exception as e:
        logger.error(f"Error getting trigger: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{trigger_id}", response_model=TriggerResponse)
async def update_trigger(
    trigger_id: str,
    request: TriggerUpdateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Update a trigger"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    try:
        trigger_service = get_trigger_service(db)
        
        trigger = await trigger_service.get_trigger(trigger_id)
        if not trigger:
            raise HTTPException(status_code=404, detail="Trigger not found")

        await verify_agent_access(trigger.agent_id, user_id)
        
        updated_trigger = await trigger_service.update_trigger(
            trigger_id=trigger_id,
            config=request.config,
            name=request.name,
            description=request.description,
            is_active=request.is_active
        )
        
        base_url = os.getenv("WEBHOOK_BASE_URL", "http://localhost:8000")
        webhook_url = f"{base_url}/api/triggers/{trigger_id}/webhook"

        return TriggerResponse(
            trigger_id=updated_trigger.trigger_id,
            agent_id=updated_trigger.agent_id,
            trigger_type=updated_trigger.trigger_type.value,
            provider_id=updated_trigger.provider_id,
            name=updated_trigger.name,
            description=updated_trigger.description,
            is_active=updated_trigger.is_active,
            webhook_url=webhook_url,
            created_at=updated_trigger.created_at.isoformat(),
            updated_at=updated_trigger.updated_at.isoformat(),
            config=updated_trigger.config
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating trigger: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{trigger_id}")
async def delete_trigger(
    trigger_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Delete a trigger"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    try:
        trigger_service = get_trigger_service(db)
        trigger = await trigger_service.get_trigger(trigger_id)
        if not trigger:
            raise HTTPException(status_code=404, detail="Trigger not found")

        await verify_agent_access(trigger.agent_id, user_id)
        
        success = await trigger_service.delete_trigger(trigger_id)
        if not success:
            raise HTTPException(status_code=404, detail="Trigger not found")
        
        return {"message": "Trigger deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting trigger: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{trigger_id}/webhook")
async def trigger_webhook(
    trigger_id: str,
    request: Request
):
    """Handle incoming webhook for a trigger"""
    if not await is_enabled("agent_triggers"):
        raise HTTPException(status_code=403, detail="Agent triggers are not enabled")
    
    try:
        # Simple header-based auth using a shared secret
        # Configure the secret via environment variable: TRIGGER_WEBHOOK_SECRET
        secret = os.getenv("TRIGGER_WEBHOOK_SECRET")
        if secret:
            incoming_secret = request.headers.get("x-trigger-secret", "")
            if not hmac.compare_digest(incoming_secret, secret):
                logger.warning(f"Invalid webhook secret for trigger {trigger_id}")
                raise HTTPException(status_code=401, detail="Unauthorized")
        else:
            logger.warning("TRIGGER_WEBHOOK_SECRET is not configured - webhook authentication disabled")
        
        # Get raw data from request
        raw_data = {}
        try:
            raw_data = await request.json()
        except:
            pass
        
        # Process trigger event
        trigger_service = get_trigger_service(db)
        result = await trigger_service.process_trigger_event(trigger_id, raw_data)
        
        if not result.success:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": result.error_message}
            )
        
        # Execute if needed
        if result.should_execute_agent or result.should_execute_workflow:
            trigger = await trigger_service.get_trigger(trigger_id)
            if trigger:
                logger.info(f"Executing agent {trigger.agent_id} for trigger {trigger_id}")
                
                from .trigger_service import TriggerEvent
                event = TriggerEvent(
                    trigger_id=trigger_id,
                    agent_id=trigger.agent_id,
                    trigger_type=trigger.trigger_type,
                    raw_data=raw_data
                )
                
                execution_service = get_execution_service(db)
                execution_result = await execution_service.execute_trigger_result(
                    agent_id=trigger.agent_id,
                    trigger_result=result,
                    trigger_event=event
                )
                
                logger.info(f"Agent execution result: {execution_result}")
                
                return JSONResponse(content={
                    "success": True,
                    "message": "Trigger processed and agent execution started",
                    "execution": execution_result,
                    "trigger_result": {
                        "should_execute_agent": result.should_execute_agent,
                        "should_execute_workflow": result.should_execute_workflow,
                        "agent_prompt": result.agent_prompt
                    }
                })
            else:
                logger.warning(f"Trigger {trigger_id} not found for execution")
        
        logger.info(f"Webhook processed but no execution needed")
        return JSONResponse(content={
            "success": True,
            "message": "Trigger processed successfully (no execution needed)",
            "trigger_result": {
                "should_execute_agent": result.should_execute_agent,
                "should_execute_workflow": result.should_execute_workflow
            }
        })
        
    except Exception as e:
        logger.error(f"Error processing webhook trigger: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Internal server error"}
        )


# ===== WORKFLOW ENDPOINTS =====

def convert_steps_to_json(steps: List[WorkflowStepRequest]) -> List[Dict[str, Any]]:
    """Convert workflow steps to JSON format"""
    if not steps:
        return []
    
    result = []
    for step in steps:
        step_dict = {
            'name': step.name,
            'description': step.description,
            'type': step.type or 'instruction',
            'config': step.config,
            'conditions': step.conditions,
            'order': step.order
        }
        if step.children:
            step_dict['children'] = convert_steps_to_json(step.children)
        result.append(step_dict)
    return result


@workflows_router.get("/test")
async def test_workflows_route():
    """Test endpoint to verify workflows router is working"""
    return {"status": "ok", "message": "Workflows router is working"}


@workflows_router.get("/agents/{agent_id}/workflows")
async def get_agent_workflows(
    agent_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get workflows for an agent"""
    await verify_agent_access(agent_id, user_id)
    
    client = await db.client
    result = await client.table('agent_workflows').select('*').eq('agent_id', agent_id).order('created_at', desc=True).execute()
    
    return result.data


@workflows_router.post("/agents/{agent_id}/workflows")
async def create_agent_workflow(
    agent_id: str,
    workflow_data: WorkflowCreateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Create a new workflow for an agent"""
    await verify_agent_access(agent_id, user_id)
    
    try:
        client = await db.client
        steps_json = convert_steps_to_json(workflow_data.steps)
        
        result = await client.table('agent_workflows').insert({
            'agent_id': agent_id,
            'name': workflow_data.name,
            'description': workflow_data.description,
            'trigger_phrase': workflow_data.trigger_phrase,
            'is_default': workflow_data.is_default,
            'status': 'draft',
            'steps': steps_json
        }).execute()
        
        return result.data[0]
        
    except Exception as e:
        logger.error(f"Error creating workflow: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to create workflow: {str(e)}")


@workflows_router.put("/agents/{agent_id}/workflows/{workflow_id}")
async def update_agent_workflow(
    agent_id: str,
    workflow_id: str,
    workflow_data: WorkflowUpdateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Update a workflow"""
    await verify_agent_access(agent_id, user_id)
    
    client = await db.client
    
    # Verify workflow exists
    workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).eq('agent_id', agent_id).execute()
    if not workflow_result.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Build update data
    update_data = {}
    if workflow_data.name is not None:
        update_data['name'] = workflow_data.name
    if workflow_data.description is not None:
        update_data['description'] = workflow_data.description
    if workflow_data.trigger_phrase is not None:
        update_data['trigger_phrase'] = workflow_data.trigger_phrase
    if workflow_data.is_default is not None:
        update_data['is_default'] = workflow_data.is_default
    if workflow_data.status is not None:
        update_data['status'] = workflow_data.status
    if workflow_data.steps is not None:
        update_data['steps'] = convert_steps_to_json(workflow_data.steps)
    
    if update_data:
        await client.table('agent_workflows').update(update_data).eq('id', workflow_id).execute()
    
    # Return updated workflow
    updated_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).execute()
    return updated_result.data[0]


@workflows_router.delete("/agents/{agent_id}/workflows/{workflow_id}")
async def delete_agent_workflow(
    agent_id: str,
    workflow_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Delete a workflow"""
    await verify_agent_access(agent_id, user_id)
    
    client = await db.client
    
    # Verify workflow exists
    workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).eq('agent_id', agent_id).execute()
    if not workflow_result.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await client.table('agent_workflows').delete().eq('id', workflow_id).execute()
    return {"message": "Workflow deleted successfully"}


@workflows_router.post("/agents/{agent_id}/workflows/{workflow_id}/execute")
async def execute_agent_workflow(
    agent_id: str,
    workflow_id: str,
    execution_data: WorkflowExecuteRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Manually execute a workflow"""
    await verify_agent_access(agent_id, user_id)
    
    client = await db.client
    
    # Get workflow
    workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).eq('agent_id', agent_id).execute()
    if not workflow_result.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflow_result.data[0]
    if workflow['status'] != 'active':
        raise HTTPException(status_code=400, detail="Workflow is not active")
    
    # Get agent info
    agent_result = await client.table('agents').select('account_id, name').eq('agent_id', agent_id).execute()
    if not agent_result.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    account_id = agent_result.data[0]['account_id']
    
    # Validate permissions
    model_name = config.MODEL_TO_USE or "claude-sonnet-4-20250514"
    can_use, model_message, allowed_models = await can_use_model(client, account_id, model_name)
    if not can_use:
        raise HTTPException(status_code=403, detail={"message": model_message, "allowed_models": allowed_models})

    can_run, message, subscription = await check_billing_status(client, account_id)
    if not can_run:
        raise HTTPException(status_code=402, detail={"message": message, "subscription": subscription})
    
    # Create execution objects
    from .trigger_service import TriggerResult, TriggerEvent, TriggerType
    
    trigger_result = TriggerResult(
        success=True,
        should_execute_workflow=True,
        workflow_id=workflow_id,
        workflow_input=execution_data.input_data or {},
        execution_variables={
            'triggered_by': 'manual',
            'execution_timestamp': datetime.now(timezone.utc).isoformat(),
            'user_id': user_id,
            'execution_source': 'workflow_api'
        }
    )
    
    trigger_event = TriggerEvent(
        trigger_id=f"manual_{workflow_id}_{uuid.uuid4()}",
        agent_id=agent_id,
        trigger_type=TriggerType.WEBHOOK,
        raw_data=execution_data.input_data or {}
    )
    
    # Execute workflow
    execution_service = get_execution_service(db)
    execution_result = await execution_service.execute_trigger_result(
        agent_id=agent_id,
        trigger_result=trigger_result,
        trigger_event=trigger_event
    )
    
    if execution_result["success"]:
        logger.info(f"Manual workflow execution started: {execution_result}")
        return {
            "thread_id": execution_result.get("thread_id"),
            "agent_run_id": execution_result.get("agent_run_id"),
            "status": "running",
            "message": f"Workflow '{workflow['name']}' execution started"
        }
    else:
        logger.error(f"Manual workflow execution failed: {execution_result}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to start workflow execution",
                "details": execution_result.get("error", "Unknown error")
            }
        )


@workflows_router.post("/internal/execute-workflow")
async def internal_execute_existing_workflow(
    request: Request,
    agent_id: str = Body(..., embed=True),
    workflow_id: str = Body(..., embed=True),
    input_data: Dict[str, Any] = Body(default_factory=dict, embed=True)
):
    """Endpoint interno para executar um workflow existente (sem JWT).

    Protegido por x-trigger-secret. Útil para chamadas de triggers já existentes.
    """
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        # Validar workflow pertence ao agente e está ativo
        wf = await client.table('agent_workflows').select('*').eq('id', workflow_id).eq('agent_id', agent_id).execute()
        if not wf.data:
            raise HTTPException(status_code=404, detail="Workflow not found for agent")
        if wf.data[0]['status'] != 'active':
            raise HTTPException(status_code=400, detail="Workflow is not active")

        # Montar TriggerResult e TriggerEvent e delegar
        from .trigger_service import TriggerResult, TriggerEvent, TriggerType
        trigger_result = TriggerResult(
            success=True,
            should_execute_workflow=True,
            workflow_id=workflow_id,
            workflow_input=input_data or {},
            execution_variables={'triggered_by': 'internal_execute_workflow'}
        )
        trigger_event = TriggerEvent(
            trigger_id=f"internal_exec_{workflow_id}_{uuid.uuid4()}",
            agent_id=agent_id,
            trigger_type=TriggerType.WEBHOOK,
            raw_data=input_data or {}
        )

        execution_service = get_execution_service(db)
        out = await execution_service.execute_trigger_result(
            agent_id=agent_id,
            trigger_result=trigger_result,
            trigger_event=trigger_event
        )

        if not out.get('success'):
            raise HTTPException(status_code=500, detail=out)

        return {
            'thread_id': out.get('thread_id'),
            'agent_run_id': out.get('agent_run_id'),
            'status': 'running'
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal execute workflow failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@workflows_router.get("/internal/search")
async def internal_search_workflows(
    request: Request,
    name: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None)
):
    """Endpoint interno para buscar workflows por nome (ilike) e/ou agent_id.

    Retorna lista com id, name, status e agent_id.
    """
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    client = await db.client
    q = client.table('agent_workflows').select('id, name, status, agent_id, created_at').order('created_at', desc=True)
    if name:
        q = q.ilike('name', f"%{name}%")
    if agent_id:
        q = q.eq('agent_id', agent_id)
    res = await q.execute()
    return res.data


class InternalUpdateGmailStepsRequest(BaseModel):
    agent_id: str
    workflow_id: str
    instruction: Optional[str] = "Execute o monitoramento e prepare o email."
    to: str
    subject: str = "Atualização de Monitoramento"
    body: str = "Monitoramento concluído para {planilha_url}."
    tool_name: Optional[str] = "gmail_send_email"  # permite usar mcp_pipedream_gmail_send_email


@workflows_router.post("/internal/update-gmail-steps")
async def internal_update_workflow_gmail_steps(
    request: Request,
    payload: InternalUpdateGmailStepsRequest
):
    """Atualiza os steps do workflow para: instruction + gmail_send_email com args.

    Protegido por x-trigger-secret.
    """
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        wf_res = await client.table('agent_workflows').select('*').eq('id', payload.workflow_id).eq('agent_id', payload.agent_id).execute()
        if not wf_res.data:
            raise HTTPException(status_code=404, detail="Workflow not found for agent")

        steps_json = [
            {
                'name': 'Executar Monitoramento',
                'description': 'Instrução para o agente contextualizar o workflow',
                'type': 'instruction',
                'config': { 'instruction': payload.instruction },
                'order': 1
            },
            {
                'name': 'Enviar Email via MCP',
                'description': 'Enviar email via Gmail MCP',
                'type': 'tool',
                'config': {
                    'tool_name': payload.tool_name or 'gmail_send_email',
                    'args': {
                        'to': payload.to,
                        'subject': payload.subject,
                        'body': payload.body
                    }
                },
                'order': 2
            }
        ]

        await client.table('agent_workflows').update({
            'steps': steps_json,
            'status': 'active'
        }).eq('id', payload.workflow_id).execute()

        return { 'updated': True, 'workflow_id': payload.workflow_id, 'steps_count': len(steps_json) }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal update gmail steps failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@workflows_router.get("/internal/get-workflow")
async def internal_get_workflow_details(
    request: Request,
    workflow_id: str
):
    """Retorna detalhes do workflow (inclui steps) sem exigir JWT. Protegido por segredo."""
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    client = await db.client
    res = await client.table('agent_workflows').select('*').eq('id', workflow_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return res.data[0]


@workflows_router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get a single workflow by ID"""
    client = await db.client
    
    # Get the workflow
    result = await client.table('agent_workflows').select('*').eq('id', workflow_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = result.data[0]
    
    # Verify user has access to this workflow's agent
    await verify_agent_access(workflow['agent_id'], user_id)
    
    return workflow


# Debug endpoint to check webhook configuration
@router.get("/debug/webhook-config")
async def debug_webhook_config():
    """Debug endpoint to check webhook configuration for future triggers"""
    import os
    from triggers.provider_service import get_provider_service
    
    provider_service = get_provider_service(db)
    
    # Get the schedule provider to check webhook base URL
    schedule_provider = provider_service._providers.get("schedule")
    
    return {
        "webhook_base_url_env": os.getenv("WEBHOOK_BASE_URL", "NOT_SET"),
        "webhook_base_url_provider": getattr(schedule_provider, '_webhook_base_url', 'NOT_SET'),
        "expected_production_url": "https://prophet-milo-f3hr5.ondigitalocean.app",
        "environment": os.getenv("ENV_MODE", "NOT_SET"),
        "config_env_mode": config.ENV_MODE.value if hasattr(config, 'ENV_MODE') else "NOT_SET"
    }


@router.get("/debug/agent-run/{agent_run_id}")
async def debug_agent_run_redis(agent_run_id: str):
    """Debug endpoint to check Redis data for agent run"""
    from services import redis
    import json
    
    try:
        # Get Redis responses for the agent run
        response_key = f"agent_run:{agent_run_id}:responses"
        responses = await redis.lrange(response_key, 0, -1)
        
        parsed_responses = []
        for response in responses:
            try:
                parsed_responses.append(json.loads(response))
            except:
                parsed_responses.append({"raw": response, "parse_error": True})
        
        return {
            "agent_run_id": agent_run_id,
            "total_responses": len(responses),
            "responses": parsed_responses
        }
    except Exception as e:
        return {
            "agent_run_id": agent_run_id,
            "error": str(e),
            "responses": []
        }


# ===== INTERNAL ENDPOINTS (TEMPORÁRIOS PARA TESTE) =====

@router.post("/internal/create-test-mcp-workflow-email")
async def internal_create_and_execute_mcp_email(
    request: Request,
    agent_id: str = Body(..., embed=True),
    to: str = Body(..., embed=True),
    subject: str = Body(..., embed=True),
    body_text: str = Body(..., embed=True)
):
    """Create a minimal workflow with a single MCP gmail_send_email tool step and execute it.

    Protected by TRIGGER_WEBHOOK_SECRET if configured. Intended for quick E2E validation.
    """
    import os
    import uuid
    from .execution_service import get_execution_service
    from .trigger_service import TriggerResult, TriggerEvent, TriggerType

    # Secret check (optional if env var not set)
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        # Build steps: single tool step calling gmail_send_email
        steps_json = [
            {
                'name': 'Send Email',
                'description': 'Send email via Pipedream Gmail',
                'type': 'tool',
                'config': {
                    'tool_name': 'gmail_send_email',
                    'args': {
                        'to': to,
                        'subject': subject,
                        'body': body_text
                    }
                },
                'order': 1
            }
        ]

        # Create workflow (active)
        wf_result = await client.table('agent_workflows').insert({
            'agent_id': agent_id,
            'name': 'Test MCP Gmail Direct',
            'description': 'Trigger single MCP gmail_send_email',
            'trigger_phrase': None,
            'is_default': False,
            'status': 'active',
            'steps': steps_json
        }).execute()

        if not wf_result.data:
            raise HTTPException(status_code=500, detail="Failed to create workflow")

        workflow_id = wf_result.data[0]['id']

        # Prepare trigger event/result
        trigger_event = TriggerEvent(
            trigger_id=f"internal_{workflow_id}_{uuid.uuid4()}",
            agent_id=agent_id,
            trigger_type=TriggerType.WEBHOOK,
            raw_data={'execution_type': 'workflow', 'workflow_id': workflow_id}
        )

        trigger_result = TriggerResult(
            success=True,
            should_execute_workflow=True,
            workflow_id=workflow_id,
            workflow_input={},
            execution_variables={'triggered_by': 'internal_endpoint'}
        )

        # Execute
        execution_service = get_execution_service(db)
        exec_out = await execution_service.execute_trigger_result(
            agent_id=agent_id,
            trigger_result=trigger_result,
            trigger_event=trigger_event
        )

        return {
            'workflow_id': workflow_id,
            'execution': exec_out
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal MCP email test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/internal/create-test-mcp-workflow-tool")
async def internal_create_and_execute_mcp_tool(
    request: Request,
    agent_id: str = Body(..., embed=True),
    tool_name: str = Body(..., embed=True),
    args: Dict[str, Any] = Body(default_factory=dict, embed=True)
):
    """Create a minimal workflow with a single generic MCP tool step and execute it.

    Protected by TRIGGER_WEBHOOK_SECRET. Useful to validate any MCP mapping like slack, calendar, trello, etc.
    """
    import os
    import uuid
    from .execution_service import get_execution_service
    from .trigger_service import TriggerResult, TriggerEvent, TriggerType

    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        steps_json = [
            {
                'name': f'Run {tool_name}',
                'description': f'Execute {tool_name} via MCP',
                'type': 'tool',
                'config': {
                    'tool_name': tool_name,
                    'args': args or {}
                },
                'order': 1
            }
        ]

        wf_result = await client.table('agent_workflows').insert({
            'agent_id': agent_id,
            'name': f'Test MCP {tool_name}',
            'description': f'Test step for {tool_name}',
            'trigger_phrase': None,
            'is_default': False,
            'status': 'active',
            'steps': steps_json
        }).execute()

        if not wf_result.data:
            raise HTTPException(status_code=500, detail="Failed to create workflow")

        workflow_id = wf_result.data[0]['id']

        trigger_event = TriggerEvent(
            trigger_id=f"internal_{workflow_id}_{uuid.uuid4()}",
            agent_id=agent_id,
            trigger_type=TriggerType.WEBHOOK,
            raw_data={'execution_type': 'workflow', 'workflow_id': workflow_id}
        )

        trigger_result = TriggerResult(
            success=True,
            should_execute_workflow=True,
            workflow_id=workflow_id,
            workflow_input={},
            execution_variables={'triggered_by': 'internal_endpoint'}
        )

        execution_service = get_execution_service(db)
        exec_out = await execution_service.execute_trigger_result(
            agent_id=agent_id,
            trigger_result=trigger_result,
            trigger_event=trigger_event
        )

        return {
            'workflow_id': workflow_id,
            'execution': exec_out
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal MCP generic tool test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal/debug/mcp-tools")
async def internal_list_mcp_tools(
    request: Request,
    agent_id: str
):
    """List all MCP tools for the agent.

    Supports two modes via query param `mode`:
    - mode=config (default fallback): returns tools from agent_config.enabledTools without opening MCP connections
    - mode=live: initializes MCP and returns dynamic methods (might be slower)
    """
    import os
    from agent.versioning.domain.entities import AgentId
    from agent.versioning.infrastructure.dependencies import set_db_connection, get_container
    from agentpress.thread_manager import ThreadManager
    from agent.tools.mcp_tool_wrapper import MCPToolWrapper
    from agentpress.tool import SchemaType

    # Secret check
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        set_db_connection(db)
        client = await db.client

        # Load agent base info
        agent_result = await client.table('agents').select('account_id, name').eq('agent_id', agent_id).execute()
        if not agent_result.data:
            raise HTTPException(status_code=404, detail="Agent not found")

        agent_data = agent_result.data[0]
        container = get_container()
        version_service = await container.get_version_service()
        agent_id_obj = AgentId.from_string(agent_id)
        active_version = await version_service.version_repo.find_active_version(agent_id_obj)
        if not active_version:
            raise HTTPException(status_code=404, detail="No active version for agent")

        agent_config = {
            'agent_id': agent_id,
            'name': agent_data.get('name', 'Unknown Agent'),
            'system_prompt': active_version.system_prompt.value,
            'configured_mcps': [
                {
                    'name': mcp.name,
                    'type': mcp.type,
                    'config': mcp.config,
                    'enabledTools': mcp.enabled_tools
                }
                for mcp in active_version.configured_mcps
            ],
            'custom_mcps': [
                {
                    'name': mcp.name,
                    'type': mcp.type,
                    'config': mcp.config,
                    'enabledTools': mcp.enabled_tools,
                    'customType': getattr(mcp, 'type', None)  # preserve if present
                }
                for mcp in active_version.custom_mcps
            ],
            'agentpress_tools': active_version.tool_configuration.tools,
            'current_version_id': str(active_version.version_id),
            'version_name': active_version.version_name
        }

        # Fast path: mode=config (no MCP connection)
        mode = request.query_params.get('mode', 'config').lower()
        if mode == 'config':
            def _slugify(text: str) -> str:
                import re
                s = (text or '').strip().lower().replace(' ', '_').replace('-', '_')
                return re.sub(r"[^a-z0-9_]+", "", s)

            all_mcps_cfg = []
            if agent_config.get('configured_mcps'):
                all_mcps_cfg.extend(agent_config['configured_mcps'])
            if agent_config.get('custom_mcps'):
                all_mcps_cfg.extend(agent_config['custom_mcps'])

            tools = []
            for mcp in all_mcps_cfg:
                cfg = mcp.get('config') or {}
                server_slug = _slugify(cfg.get('app_slug') or mcp.get('customType') or mcp.get('type') or mcp.get('name') or 'mcp')
                for t in mcp.get('enabledTools', []) or []:
                    tools.append({
                        'method': f"mcp_{server_slug}_{_slugify(t)}",
                        'alias': t,
                        'source': 'config'
                    })
            return { 'tools': tools, 'count': len(tools), 'mode': 'config' }

        # Live path: initialize MCP (might be slower)
        tm = ThreadManager(agent_config=agent_config)
        all_mcps = []
        if agent_config.get('configured_mcps'):
            all_mcps.extend(agent_config['configured_mcps'])
        if agent_config.get('custom_mcps'):
            all_mcps.extend(agent_config['custom_mcps'])

        # Ensure each MCP has minimally required fields
        def _slugify(text: str) -> str:
            import re
            s = (text or '').strip().lower().replace(' ', '_').replace('-', '_')
            return re.sub(r"[^a-z0-9_]+", "", s)

        processed_mcps = []
        for mcp in all_mcps:
            cfg = dict(mcp)
            cfg.setdefault('config', {})
            custom_type = cfg.get('customType') or cfg.get('type') or 'sse'
            cfg['customType'] = custom_type
            server_slug = _slugify((cfg.get('config') or {}).get('app_slug') or custom_type or cfg.get('name') or 'mcp')
            name_slug = _slugify(cfg.get('name') or 'server')
            cfg['qualifiedName'] = cfg.get('qualifiedName') or f"custom_{server_slug}_{name_slug}"
            processed_mcps.append(cfg)

        tm.add_tool(MCPToolWrapper, mcp_configs=processed_mcps)

        mcp_wrapper = None
        for _, tool_info in tm.tool_registry.tools.items():
            if isinstance(tool_info['instance'], MCPToolWrapper):
                mcp_wrapper = tool_info['instance']
                break

        if not mcp_wrapper:
            return { 'tools': [], 'message': 'MCP wrapper not initialized' }

        try:
            await mcp_wrapper.initialize_and_register_tools(tm.tool_registry)
        except Exception as init_err:
            logger.error(f"MCP live init failed: {init_err}")
            return { 'tools': [], 'count': 0, 'mode': 'live', 'error': f"init_failed: {str(init_err)}" }
        schemas = mcp_wrapper.get_schemas() or {}

        tools = []
        for method_name, schema_list in schemas.items():
            if method_name == 'call_mcp_tool':
                continue
            for schema in schema_list:
                if hasattr(schema, 'schema_type') and schema.schema_type == SchemaType.OPENAPI:
                    func = schema.schema.get('function', {})
                    tools.append({
                        'method': method_name,
                        'description': func.get('description', ''),
                        'params': list((func.get('parameters', {}) or {}).get('properties', {}).keys()),
                        'source': 'live'
                    })

        if not tools:
            return { 'tools': [], 'count': 0, 'mode': 'live', 'error': 'no_tools_registered_after_init' }
        return { 'tools': tools, 'count': len(tools), 'mode': 'live' }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal MCP tools debug failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Quick view of active agent version MCP configuration (sanitized)
@router.get("/internal/debug/agent-version-config")
async def internal_debug_agent_version_config(
    request: Request,
    agent_id: str
):
    """Retorna visão sanitizada da versão ativa do agente: MCPs, app_slug e external_user_id/profile.

    Protegido por x-trigger-secret.
    """
    import os
    from agent.versioning.domain.entities import AgentId
    from agent.versioning.infrastructure.dependencies import set_db_connection, get_container

    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        set_db_connection(db)
        client = await db.client

        agent_result = await client.table('agents').select('account_id, name').eq('agent_id', agent_id).execute()
        if not agent_result.data:
            raise HTTPException(status_code=404, detail="Agent not found")

        container = get_container()
        version_service = await container.get_version_service()
        agent_id_obj = AgentId.from_string(agent_id)
        active_version = await version_service.version_repo.find_active_version(agent_id_obj)
        if not active_version:
            raise HTTPException(status_code=404, detail="No active version for agent")

        def pick(d: dict, keys: list[str]):
            return {k: d.get(k) for k in keys if k in d}

        def sanitize_mcp(mcp):
            cfg = mcp.config or {}
            headers = (cfg.get('headers') or {})
            # Normalize app_slug if only present in headers
            app_slug = cfg.get('app_slug') or headers.get('x-pd-app-slug')
            return {
                'name': mcp.name,
                'type': mcp.type,
                'enabledTools': mcp.enabled_tools,
                'config': pick({**cfg, 'app_slug': app_slug}, ['app_slug', 'external_user_id', 'profile_id'])
            }

        data = {
            'agent_id': agent_id,
            'version_id': str(active_version.version_id),
            'version_name': active_version.version_name,
            'configured_mcps': [sanitize_mcp(m) for m in active_version.configured_mcps],
            'custom_mcps': [sanitize_mcp(m) for m in active_version.custom_mcps],
        }

        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal agent version config debug failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Inspect Pipedream profile config (external_user_id) for debugging
@router.get("/internal/debug/pipedream-profile")
async def internal_debug_pipedream_profile(
    request: Request,
    agent_id: str,
    profile_id: str
):
    """Retorna informações do profile Pipedream, incluindo external_user_id, a partir de user_mcp_credential_profiles e credential_profiles.

    Protegido por x-trigger-secret.
    """
    import os
    from utils.encryption import decrypt_data

    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        # Validate agent exists (and optionally fetch account)
        agent = await client.table('agents').select('agent_id, account_id').eq('agent_id', agent_id).single().execute()
        if not getattr(agent, 'data', None):
            raise HTTPException(status_code=404, detail="Agent not found")

        result = {
            'agent_id': agent_id,
            'profile_id': profile_id,
            'source_user_mcp_credential_profiles': None,
            'source_credential_profiles': None
        }

        # Try encrypted user_mcp_credential_profiles first
        try:
            enc = await client.table('user_mcp_credential_profiles').select('encrypted_config').eq('profile_id', profile_id).single().execute()
            if getattr(enc, 'data', None) and enc.data.get('encrypted_config'):
                decrypted = decrypt_data(enc.data['encrypted_config'])
                import json as _json
                cfg = _json.loads(decrypted)
                result['source_user_mcp_credential_profiles'] = {
                    'external_user_id': cfg.get('external_user_id'),
                    'app_slug': cfg.get('app_slug'),
                    'oauth_app_id': cfg.get('oauth_app_id')
                }
        except Exception as e1:
            result['source_user_mcp_credential_profiles'] = {'error': str(e1)}

        # Fallback to credential_profiles plain
        try:
            plain = await client.table('credential_profiles').select('*').eq('id', profile_id).single().execute()
            if getattr(plain, 'data', None):
                result['source_credential_profiles'] = {
                    'external_user_id': plain.data.get('external_user_id'),
                    'app_slug': plain.data.get('app_slug'),
                    'profile_name': plain.data.get('profile_name')
                }
        except Exception as e2:
            result['source_credential_profiles'] = {'error': str(e2)}

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal debug pipedream profile failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== INTERNAL MCP DIAGNOSTICS =====

@router.post("/internal/mcp/diagnose-gmail-send")
async def internal_mcp_diagnose_gmail_send(
    request: Request,
    agent_id: str = Body(..., embed=True),
    to: str = Body(..., embed=True),
    subject: str = Body("Diagnóstico MCP Gmail", embed=True),
    body_text: str = Body("Mensagem de teste de diagnóstico MCP Gmail.", embed=True)
):
    """Try to execute mcp_pipedream_gmail_send_email directly and return raw result/error.

    Protected by x-trigger-secret. Useful to identify credential/config issues (external_user_id/app_slug).
    """
    import os
    from agent.versioning.domain.entities import AgentId
    from agent.versioning.infrastructure.dependencies import set_db_connection, get_container
    from agentpress.thread_manager import ThreadManager
    from agent.tools.mcp_tool_wrapper import MCPToolWrapper

    # Secret check
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        set_db_connection(db)
        client = await db.client

        # Load active agent version
        agent_result = await client.table('agents').select('account_id, name').eq('agent_id', agent_id).execute()
        if not agent_result.data:
            raise HTTPException(status_code=404, detail="Agent not found")

        agent_data = agent_result.data[0]
        container = get_container()
        version_service = await container.get_version_service()
        agent_id_obj = AgentId.from_string(agent_id)
        active_version = await version_service.version_repo.find_active_version(agent_id_obj)
        if not active_version:
            raise HTTPException(status_code=404, detail="No active version for agent")

        agent_config = {
            'agent_id': agent_id,
            'name': agent_data.get('name', 'Unknown Agent'),
            'configured_mcps': [
                {
                    'name': mcp.name,
                    'type': mcp.type,
                    'config': mcp.config,
                    'enabledTools': mcp.enabled_tools
                }
                for mcp in active_version.configured_mcps
            ],
            'custom_mcps': [
                {
                    'name': mcp.name,
                    'type': mcp.type,
                    'config': mcp.config,
                    'enabledTools': mcp.enabled_tools,
                    'customType': getattr(mcp, 'type', None)
                }
                for mcp in active_version.custom_mcps
            ]
        }

        # Initialize MCP wrapper via ThreadManager
        tm = ThreadManager(agent_config=agent_config)

        # Prepare MCP configs with qualifiedName/customType/app_slug
        def _slugify(text: str) -> str:
            import re
            s = (text or '').strip().lower().replace(' ', '_').replace('-', '_')
            return re.sub(r"[^a-z0-9_]+", "", s)

        all_mcps = []
        if agent_config.get('configured_mcps'):
            all_mcps.extend(agent_config['configured_mcps'])
        if agent_config.get('custom_mcps'):
            all_mcps.extend(agent_config['custom_mcps'])

        processed = []
        for m in all_mcps:
            cfg = dict(m)
            cfg.setdefault('config', {})
            ctype = cfg.get('customType') or cfg.get('type') or 'sse'
            cfg['customType'] = ctype
            if 'headers' in cfg['config'] and 'x-pd-app-slug' in cfg['config']['headers']:
                cfg['config']['app_slug'] = cfg['config']['headers']['x-pd-app-slug']
            server_slug = _slugify(cfg['config'].get('app_slug') or ctype or cfg.get('name') or 'mcp')
            name_slug = _slugify(cfg.get('name') or 'server')
            cfg['qualifiedName'] = cfg.get('qualifiedName') or f"custom_{server_slug}_{name_slug}"
            # Resolve external_user_id from credential_profiles if only profile_id is present
            try:
                if not cfg['config'].get('external_user_id'):
                    profile_id = cfg['config'].get('profile_id')
                    if profile_id:
                        prof = await client.table('credential_profiles').select('external_user_id').eq('id', profile_id).single().execute()
                        if getattr(prof, 'data', None) and prof.data.get('external_user_id'):
                            cfg['config']['external_user_id'] = prof.data['external_user_id']
            except Exception as _e:
                logger.warning(f"Could not resolve external_user_id for profile {cfg['config'].get('profile_id')}: {_e}")
            processed.append(cfg)

        tm.add_tool(MCPToolWrapper, mcp_configs=processed)

        mcp_wrapper = None
        for _, tool_info in tm.tool_registry.tools.items():
            if isinstance(tool_info['instance'], MCPToolWrapper):
                mcp_wrapper = tool_info['instance']
                break

        if not mcp_wrapper:
            return { 'success': False, 'error': 'MCP wrapper not initialized' }

        await mcp_wrapper.initialize_and_register_tools(tm.tool_registry)

        # Execute: prefer alias, fallback to explicit method
        alias = 'gmail_send_email'
        args = {
            'to': to,
            'subject': subject,
            'body': body_text
        }
        try:
            # Try alias first (dynamic resolution based on configured MCPs)
            result = await mcp_wrapper.call_mcp_tool(alias, args)
            out = getattr(result, 'output', str(result))
            return { 'success': True, 'used': 'alias', 'tool': alias, 'output': out }
        except Exception as alias_err:
            # Fallback to explicit Pipedream Gmail method name
            try:
                result = await mcp_wrapper.call_mcp_tool('mcp_pipedream_gmail_send_email', args)
                out = getattr(result, 'output', str(result))
                return { 'success': True, 'used': 'method', 'tool': 'mcp_pipedream_gmail_send_email', 'output': out }
            except Exception as method_err:
                return { 'success': False, 'error': f"alias_error={str(alias_err)}; method_error={str(method_err)}" }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal MCP diagnose failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== INTERNAL QUICK PING (SANITY) =====

@router.get("/internal/ping")
async def internal_ping(request: Request):
    """Lightweight ping to verify new internal routes are deployed."""
    import os
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


# Include workflows router AFTER all routes are defined
router.include_router(workflows_router)

class InternalUpdateStepsRequest(BaseModel):
    agent_id: str
    workflow_id: str
    steps: List[Dict[str, Any]]
    status: Optional[str] = None


@workflows_router.post("/internal/update-steps")
async def internal_update_workflow_steps(
    request: Request,
    payload: InternalUpdateStepsRequest
):
    """Atualiza steps arbitrários de um workflow (sem JWT), protegido por segredo.

    Espera steps no mesmo formato usado na coluna 'steps' da tabela agent_workflows.
    """
    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        # Verificar existência e propriedade
        wf = await client.table('agent_workflows').select('*').eq('id', payload.workflow_id).eq('agent_id', payload.agent_id).execute()
        if not wf.data:
            raise HTTPException(status_code=404, detail="Workflow not found for agent")

        update_data = { 'steps': payload.steps }
        if payload.status is not None:
            update_data['status'] = payload.status

        await client.table('agent_workflows').update(update_data).eq('id', payload.workflow_id).execute()
        return { 'updated': True, 'workflow_id': payload.workflow_id, 'steps_count': len(payload.steps) }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal update steps failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== INTERNAL: DIRECT PIPEDREAM MCP CALL (DEBUG) =====

@router.post("/internal/mcp/pipedream-direct-call")
async def internal_pipedream_direct_call(
    request: Request,
    agent_id: str = Body(..., embed=True),
    profile_id: str = Body(..., embed=True),
    app_slug: str = Body("gmail", embed=True),
    tool_name: str = Body(..., embed=True),  # e.g., 'gmail_send_email'
    args: Dict[str, Any] = Body(default_factory=dict, embed=True)
):
    """Chama o MCP Pipedream diretamente usando streamable HTTP, sem depender do registro de tools.

    Retorna o resultado bruto ou o erro do handshake/execução.
    Protegido por x-trigger-secret.
    """
    import os
    from utils.encryption import decrypt_data
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client
    from pipedream.facade import PipedreamManager

    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        # Resolve external_user_id via encrypted profile table
        external_user_id = None
        try:
            enc = await client.table('user_mcp_credential_profiles').select('encrypted_config').eq('profile_id', profile_id).single().execute()
            if getattr(enc, 'data', None) and enc.data.get('encrypted_config'):
                decrypted = decrypt_data(enc.data['encrypted_config'])
                import json as _json
                cfg = _json.loads(decrypted)
                external_user_id = cfg.get('external_user_id')
        except Exception as e1:
            logger.warning(f"Encrypted profile lookup failed: {e1}")

        if not external_user_id:
            raise HTTPException(status_code=400, detail="external_user_id not found for profile")

        # Build headers
        pipedream_manager = PipedreamManager()
        http_client = pipedream_manager._http_client
        access_token = await http_client._ensure_access_token()

        project_id = os.getenv("PIPEDREAM_PROJECT_ID")
        environment = os.getenv("PIPEDREAM_X_PD_ENVIRONMENT", "development")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-pd-project-id": project_id,
            "x-pd-environment": environment,
            "x-pd-external-user-id": external_user_id,
            "x-pd-app-slug": app_slug,
        }
        if http_client.rate_limit_token:
            headers["x-pd-rate-limit"] = http_client.rate_limit_token

        url = "https://remote.mcp.pipedream.net"

        # Call tool directly
        try:
            async with streamablehttp_client(url, headers=headers) as (read_stream, write_stream, _):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, args)
                    # Try to normalize result
                    content = getattr(result, 'content', result)
                    try:
                        from typing import Iterable
                        lines = []
                        if isinstance(content, list):
                            for item in content:
                                text = getattr(item, 'text', str(item))
                                lines.append(text)
                            content = "\n".join(lines)
                        elif hasattr(content, 'text'):
                            content = content.text
                    except Exception:
                        pass
                    return { 'success': True, 'output': content }
        except Exception as e:
            import traceback as _tb
            return { 'success': False, 'error': str(e), 'type': e.__class__.__name__, 'traceback': _tb.format_exc() }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal Pipedream direct call failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal/mcp/pipedream-list-tools")
async def internal_pipedream_list_tools(
    request: Request,
    agent_id: str,
    profile_id: str,
    app_slug: str = Query("gmail")
):
    """Lista as tools disponíveis no MCP Pipedream para um profile/app específicos.

    Protegido por x-trigger-secret.
    """
    import os
    from utils.encryption import decrypt_data
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client
    from pipedream.facade import PipedreamManager

    secret_env = os.getenv("TRIGGER_WEBHOOK_SECRET") or os.getenv("TRIGGER_SECRET")
    incoming_secret = request.headers.get("x-trigger-secret", "")
    if secret_env and incoming_secret != secret_env:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        client = await db.client

        # Resolve external_user_id via encrypted profile table
        external_user_id = None
        try:
            enc = await client.table('user_mcp_credential_profiles').select('encrypted_config').eq('profile_id', profile_id).single().execute()
            if getattr(enc, 'data', None) and enc.data.get('encrypted_config'):
                decrypted = decrypt_data(enc.data['encrypted_config'])
                import json as _json
                cfg = _json.loads(decrypted)
                external_user_id = cfg.get('external_user_id')
        except Exception as e1:
            pass

        if not external_user_id:
            raise HTTPException(status_code=400, detail="external_user_id not found for profile")

        pipedream_manager = PipedreamManager()
        http_client = pipedream_manager._http_client
        access_token = await http_client._ensure_access_token()

        project_id = os.getenv("PIPEDREAM_PROJECT_ID")
        environment = os.getenv("PIPEDREAM_X_PD_ENVIRONMENT", "development")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "x-pd-project-id": project_id,
            "x-pd-environment": environment,
            "x-pd-external-user-id": external_user_id,
            "x-pd-app-slug": app_slug,
        }
        if http_client.rate_limit_token:
            headers["x-pd-rate-limit"] = http_client.rate_limit_token

        url = "https://remote.mcp.pipedream.net"

        try:
            async with streamablehttp_client(url, headers=headers) as (read_stream, write_stream, _):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    tools_result = await session.list_tools()
                    tools = tools_result.tools if hasattr(tools_result, 'tools') else tools_result
                    items = []
                    for t in tools:
                        try:
                            name = getattr(t, 'name', None) or t.get('name')
                            desc = getattr(t, 'description', None) or t.get('description')
                            params = getattr(t, 'inputSchema', None) or t.get('inputSchema')
                            items.append({ 'name': name, 'description': desc, 'input_schema': params })
                        except Exception:
                            items.append(str(t))
                    return { 'success': True, 'count': len(items), 'tools': items }
        except Exception as e:
            import traceback as _tb
            return { 'success': False, 'error': str(e), 'type': e.__class__.__name__, 'traceback': _tb.format_exc() }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Internal Pipedream list tools failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
