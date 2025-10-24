from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from core.services.supabase import DBConnection
from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.logger import logger

from .workflow_service import (
    WorkflowAccessError,
    WorkflowNotFoundError,
    get_workflow_service,
)


router = APIRouter(prefix="/triggers/workflows", tags=["triggers", "workflows"])

db: Optional[DBConnection] = None


def initialize(database: DBConnection) -> None:
    global db
    db = database


def _get_service():
    if db is None:
        raise HTTPException(status_code=500, detail="Workflow service not initialised")
    return get_workflow_service(db)


class WorkflowStepPayload(BaseModel):
    name: str = Field(..., description="Human readable step title")
    description: Optional[str] = None
    type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    conditions: Optional[Dict[str, Any]] = None
    order: Optional[int] = None
    steps: Optional[List["WorkflowStepPayload"]] = None


WorkflowStepPayload.update_forward_refs()


class WorkflowCreateRequest(BaseModel):
    name: str = Field(..., description="Workflow display name")
    description: Optional[str] = None
    trigger_phrase: Optional[str] = None
    is_default: Optional[bool] = False
    status: Optional[str] = None
    steps: List[WorkflowStepPayload] = Field(default_factory=list)


class WorkflowUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_phrase: Optional[str] = None
    is_default: Optional[bool] = None
    status: Optional[str] = None
    steps: Optional[List[WorkflowStepPayload]] = None


class WorkflowResponse(BaseModel):
    id: str
    agent_id: str
    name: str
    description: Optional[str]
    status: str
    trigger_phrase: Optional[str]
    is_default: bool
    steps: List[Dict[str, Any]]
    created_at: str
    updated_at: str


class WorkflowExecutionRequest(BaseModel):
    input_data: Optional[Dict[str, Any]] = None
    thread_id: Optional[str] = None


class WorkflowExecutionResponse(BaseModel):
    execution_id: str
    status: str
    message: str
    thread_id: Optional[str] = None
    agent_run_id: Optional[str] = None


class WorkflowExecutionsResponse(BaseModel):
    executions: List[Dict[str, Any]]


def _clean_payload(model: BaseModel) -> Dict[str, Any]:
    return model.dict(exclude_none=True)


@router.get("/agents/{agent_id}/workflows", response_model=List[WorkflowResponse])
async def list_agent_workflows(
    agent_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    service = _get_service()
    try:
        workflows = await service.list_workflows(agent_id, user_id)
        return workflows
    except WorkflowAccessError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    except WorkflowNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to list workflows for agent {agent_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to list workflows")


@router.post(
    "/agents/{agent_id}/workflows",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_agent_workflow(
    agent_id: str,
    payload: WorkflowCreateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    service = _get_service()
    try:
        workflow = await service.create_workflow(agent_id, user_id, _clean_payload(payload))
        return workflow
    except WorkflowAccessError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    except WorkflowNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent or version not found")
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to create workflow for agent {agent_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to create workflow")


@router.put(
    "/agents/{agent_id}/workflows/{workflow_id}",
    response_model=WorkflowResponse,
)
async def update_agent_workflow(
    agent_id: str,
    workflow_id: str,
    payload: WorkflowUpdateRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    service = _get_service()
    try:
        workflow = await service.update_workflow(agent_id, user_id, workflow_id, _clean_payload(payload))
        return workflow
    except WorkflowAccessError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    except WorkflowNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to update workflow {workflow_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to update workflow")


@router.delete("/agents/{agent_id}/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_workflow(
    agent_id: str,
    workflow_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    service = _get_service()
    try:
        await service.delete_workflow(agent_id, user_id, workflow_id)
    except WorkflowAccessError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    except WorkflowNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to delete workflow {workflow_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to delete workflow")


@router.post(
    "/agents/{agent_id}/workflows/{workflow_id}/execute",
    response_model=WorkflowExecutionResponse,
)
async def execute_agent_workflow(
    agent_id: str,
    workflow_id: str,
    payload: WorkflowExecutionRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    service = _get_service()
    try:
        execution, _ = await service.record_execution(
            agent_id,
            user_id,
            workflow_id,
            triggered_by=user_id,
            input_data=payload.input_data,
        )
        return WorkflowExecutionResponse(
            execution_id=execution.execution_id,
            status=execution.status,
            message=execution.message or "Workflow execution queued",
            thread_id=payload.thread_id,
            agent_run_id=None,
        )
    except WorkflowAccessError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    except WorkflowNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to execute workflow {workflow_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to execute workflow")


@router.get(
    "/agents/{agent_id}/workflows/{workflow_id}/executions",
    response_model=WorkflowExecutionsResponse,
)
async def list_agent_workflow_executions(
    agent_id: str,
    workflow_id: str,
    limit: int = Query(20, ge=1, le=100),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    service = _get_service()
    try:
        executions = await service.list_executions(agent_id, user_id, workflow_id, limit=limit)
        return WorkflowExecutionsResponse(executions=executions)
    except WorkflowAccessError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    except WorkflowNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to list executions for workflow {workflow_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to list workflow executions")
