"""Workflow management helpers stored inside agent configuration.

This module keeps the workflow feature in sync with the current Suna/Prophet
approach where workflow definitions live inside the agent/agent_version config
JSON blobs instead of dedicated tables (they were dropped in the latest
Supabase migrations). The service centralises read/update helpers so both the
API layer and future background jobs can share a single source of truth.
"""

from __future__ import annotations

import copy
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from core.services.supabase import DBConnection
from core.utils.logger import logger


class WorkflowAccessError(Exception):
    """Raised when the user does not own the target agent."""


class WorkflowNotFoundError(Exception):
    """Raised when a workflow id cannot be resolved."""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_dict(value: Any) -> Dict[str, Any]:
    if not value:
        return {}
    if isinstance(value, dict):
        return copy.deepcopy(value)
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            logger.warning("Failed to decode JSON config; returning empty dict")
            return {}
        if isinstance(parsed, dict):
            return parsed
    return {}


def _ensure_list_of_dicts(value: Any) -> List[Dict[str, Any]]:
    if not value:
        return []
    if isinstance(value, list):
        return [v for v in value if isinstance(v, dict)]
    return []


def _normalise_steps(raw_steps: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    if not raw_steps:
        return []

    normalised: List[Dict[str, Any]] = []
    for index, step in enumerate(raw_steps):
        if not isinstance(step, dict):
            continue

        step_copy = copy.deepcopy(step)
        step_copy.setdefault("id", str(uuid.uuid4()))
        step_copy.setdefault("config", {})
        if not isinstance(step_copy["config"], dict):
            step_copy["config"] = {}
        step_copy.setdefault("order", index)
        nested_steps = step_copy.get("steps")
        if isinstance(nested_steps, list):
            step_copy["steps"] = _normalise_steps(nested_steps)
        else:
            step_copy["steps"] = []
        normalised.append(step_copy)

    return normalised


def _normalise_workflow(raw: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
    workflow = copy.deepcopy(raw)
    workflow.setdefault("id", str(uuid.uuid4()))
    workflow.setdefault("agent_id", agent_id)
    workflow.setdefault("name", "Untitled Workflow")
    workflow.setdefault("description", "")
    workflow.setdefault("status", "draft")
    workflow.setdefault("trigger_phrase", None)
    workflow.setdefault("is_default", False)
    workflow.setdefault("steps", [])
    workflow["steps"] = _normalise_steps(workflow.get("steps"))
    workflow.setdefault("created_at", _now_iso())
    workflow.setdefault("updated_at", workflow.get("created_at"))
    return workflow


@dataclass
class WorkflowExecution:
    execution_id: str
    workflow_id: str
    agent_id: str
    status: str
    started_at: str
    completed_at: Optional[str]
    triggered_by: str
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    message: Optional[str]

    def as_dict(self) -> Dict[str, Any]:
        return {
            "execution_id": self.execution_id,
            "workflow_id": self.workflow_id,
            "agent_id": self.agent_id,
            "status": self.status,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "triggered_by": self.triggered_by,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "message": self.message,
        }


class WorkflowService:
    def __init__(self, db_connection: DBConnection):
        self._db = db_connection

    async def list_workflows(self, agent_id: str, user_id: str) -> List[Dict[str, Any]]:
        agent, version_config, _ = await self._load_agent_and_configs(agent_id, user_id)
        workflows = _ensure_list_of_dicts(version_config.get("workflows"))
        return [_normalise_workflow(workflow, agent_id) for workflow in workflows]

    async def create_workflow(
        self,
        agent_id: str,
        user_id: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        agent, version_config, agent_config = await self._load_agent_and_configs(agent_id, user_id)

        workflows = _ensure_list_of_dicts(version_config.get("workflows"))

        now = _now_iso()
        workflow = _normalise_workflow(
            {
                "name": payload.get("name") or "Untitled Workflow",
                "description": payload.get("description", ""),
                "trigger_phrase": payload.get("trigger_phrase"),
                "is_default": bool(payload.get("is_default", False)),
                "status": payload.get("status") or "draft",
                "steps": payload.get("steps") or [],
            },
            agent_id,
        )

        workflow["created_at"] = now
        workflow["updated_at"] = now

        if workflow["is_default"]:
            for existing in workflows:
                existing["is_default"] = False

        workflows.append(workflow)

        await self._persist_configs(
            agent,
            version_config,
            agent_config,
            workflows=workflows,
            executions=None,
        )

        return workflow

    async def update_workflow(
        self,
        agent_id: str,
        user_id: str,
        workflow_id: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        agent, version_config, agent_config = await self._load_agent_and_configs(agent_id, user_id)
        workflows = _ensure_list_of_dicts(version_config.get("workflows"))

        target, index = self._find_workflow(workflows, workflow_id)
        if target is None:
            raise WorkflowNotFoundError(workflow_id)

        updated = copy.deepcopy(target)

        if "name" in payload and payload["name"] is not None:
            updated["name"] = payload["name"] or "Untitled Workflow"
        if "description" in payload:
            updated["description"] = payload.get("description")
        if "trigger_phrase" in payload:
            updated["trigger_phrase"] = payload.get("trigger_phrase")
        if "is_default" in payload:
            updated["is_default"] = bool(payload.get("is_default"))
        if "status" in payload and payload["status"]:
            updated["status"] = payload["status"]
        if "steps" in payload and payload["steps"] is not None:
            updated["steps"] = _normalise_steps(payload.get("steps") or [])

        updated["updated_at"] = _now_iso()

        workflows[index] = updated

        if updated.get("is_default"):
            for idx, existing in enumerate(workflows):
                if idx == index:
                    continue
                existing["is_default"] = False

        await self._persist_configs(
            agent,
            version_config,
            agent_config,
            workflows=workflows,
            executions=None,
        )

        return updated

    async def delete_workflow(self, agent_id: str, user_id: str, workflow_id: str) -> None:
        agent, version_config, agent_config = await self._load_agent_and_configs(agent_id, user_id)
        workflows = _ensure_list_of_dicts(version_config.get("workflows"))

        target, index = self._find_workflow(workflows, workflow_id)
        if target is None:
            raise WorkflowNotFoundError(workflow_id)

        workflows.pop(index)

        executions = _ensure_list_of_dicts(version_config.get("workflow_executions"))
        executions = [
            exec_
            for exec_ in executions
            if exec_.get("workflow_id") != workflow_id
        ]

        await self._persist_configs(
            agent,
            version_config,
            agent_config,
            workflows=workflows,
            executions=executions,
        )

    async def record_execution(
        self,
        agent_id: str,
        user_id: str,
        workflow_id: str,
        triggered_by: str,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[WorkflowExecution, List[Dict[str, Any]]]:
        agent, version_config, agent_config = await self._load_agent_and_configs(agent_id, user_id)
        workflows = _ensure_list_of_dicts(version_config.get("workflows"))
        target, _ = self._find_workflow(workflows, workflow_id)
        if target is None:
            raise WorkflowNotFoundError(workflow_id)

        executions = _ensure_list_of_dicts(version_config.get("workflow_executions"))

        execution = WorkflowExecution(
            execution_id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            agent_id=agent_id,
            status="queued",
            started_at=_now_iso(),
            completed_at=None,
            triggered_by=triggered_by,
            input_data=input_data or {},
            output_data={},
            message="Workflow execution queued",
        )

        executions.insert(0, execution.as_dict())
        executions = executions[:50]

        await self._persist_configs(
            agent,
            version_config,
            agent_config,
            workflows=workflows,
            executions=executions,
        )

        return execution, executions

    async def list_executions(
        self, agent_id: str, user_id: str, workflow_id: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        _, version_config, _ = await self._load_agent_and_configs(agent_id, user_id)
        executions = _ensure_list_of_dicts(version_config.get("workflow_executions"))
        filtered = [
            exec_
            for exec_ in executions
            if exec_.get("workflow_id") == workflow_id
        ]
        return filtered[:limit]

    async def _load_agent_and_configs(
        self, agent_id: str, user_id: str
    ) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
        client = await self._db.client

        agent_result = (
            await client.table("agents")
            .select("agent_id, account_id, current_version_id, config")
            .eq("agent_id", agent_id)
            .single()
            .execute()
        )

        agent = agent_result.data or {}
        if not agent:
            raise WorkflowNotFoundError(agent_id)

        account_id = agent.get("account_id")
        if str(account_id) != str(user_id):
            raise WorkflowAccessError(agent_id)

        version_id = agent.get("current_version_id")
        if not version_id:
            raise WorkflowNotFoundError("current_version_id")

        version_result = (
            await client.table("agent_versions")
            .select("config")
            .eq("version_id", version_id)
            .single()
            .execute()
        )

        version_config = _ensure_dict(
            version_result.data.get("config") if version_result.data else {}
        )
        agent_config = _ensure_dict(agent.get("config"))

        return agent, version_config, agent_config

    async def _persist_configs(
        self,
        agent: Dict[str, Any],
        version_config: Dict[str, Any],
        agent_config: Dict[str, Any],
        *,
        workflows: Optional[List[Dict[str, Any]]] = None,
        executions: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        client = await self._db.client

        if workflows is not None:
            version_config["workflows"] = copy.deepcopy(workflows)
            agent_config["workflows"] = copy.deepcopy(workflows)

        if executions is not None:
            version_config["workflow_executions"] = copy.deepcopy(executions)
            agent_config["workflow_executions"] = copy.deepcopy(executions)

        await client.table("agent_versions").update({
            "config": version_config,
        }).eq("version_id", agent["current_version_id"]).execute()

        await client.table("agents").update({
            "config": agent_config,
        }).eq("agent_id", agent["agent_id"]).execute()

    @staticmethod
    def _find_workflow(
        workflows: List[Dict[str, Any]], workflow_id: str
    ) -> Tuple[Optional[Dict[str, Any]], int]:
        for index, workflow in enumerate(workflows):
            if str(workflow.get("id")) == str(workflow_id):
                return workflow, index
        return None, -1


def get_workflow_service(db_connection: DBConnection) -> WorkflowService:
    return WorkflowService(db_connection)
