"""
API endpoints for managing all user triggers across multiple agents
"""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from services.supabase import get_db, DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from utils.logger import logger

router = APIRouter(prefix="/api/triggers", tags=["triggers"])


class TriggerWithAgent(BaseModel):
    """Trigger model with agent information"""
    trigger_id: str
    agent_id: str
    agent_name: str
    agent_description: Optional[str] = None
    trigger_type: str
    name: str
    description: Optional[str] = None
    is_active: bool
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    last_execution: Optional[datetime] = None
    next_execution: Optional[datetime] = None
    execution_count: int = 0
    success_count: int = 0
    failure_count: int = 0


class TriggerListResponse(BaseModel):
    """Response model for trigger list"""
    triggers: List[TriggerWithAgent]
    total: int
    page: int
    per_page: int
    has_more: bool


class TriggerStats(BaseModel):
    """Statistics about user's triggers"""
    total_triggers: int
    active_triggers: int
    inactive_triggers: int
    executions_today: int
    executions_this_week: int
    executions_this_month: int
    success_rate: float
    most_active_agent: Optional[str] = None
    triggers_by_type: Dict[str, int]


@router.get("/all", response_model=TriggerListResponse)
async def get_all_user_triggers(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    trigger_type: Optional[str] = Query(None, description="Filter by trigger type"),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in trigger name and description"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(get_db)
):
    """
    Get all triggers for the current user across all their agents
    """
    try:
        client = await db.client
        
        # First, get all agents for the user
        agents_result = await client.table('agents')\
            .select('agent_id')\
            .eq('account_id', user_id)\
            .execute()
        
        if not agents_result.data:
            return TriggerListResponse(
                triggers=[],
                total=0,
                page=page,
                per_page=per_page,
                has_more=False
            )
        
        agent_ids = [agent['agent_id'] for agent in agents_result.data]
        
        # Build the query for triggers
        query = client.table('agent_triggers')\
            .select('*, agents!inner(name, description)')\
            .in_('agent_id', agent_ids)
        
        # Apply filters
        if trigger_type:
            query = query.eq('trigger_type', trigger_type)
        if agent_id:
            query = query.eq('agent_id', agent_id)
        if is_active is not None:
            query = query.eq('is_active', is_active)
        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        
        # Get total count
        count_query = query.count()
        count_result = await count_query.execute()
        total_count = count_result.count if hasattr(count_result, 'count') else 0
        
        # Apply sorting and pagination
        if sort_order == 'desc':
            query = query.order(sort_by, desc=True)
        else:
            query = query.order(sort_by)
        
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)
        
        # Execute query
        result = await query.execute()
        
        # Get execution statistics for each trigger
        trigger_ids = [t['trigger_id'] for t in result.data] if result.data else []
        stats = {}
        
        if trigger_ids:
            # Get latest execution and counts for each trigger
            events_result = await client.rpc(
                'get_trigger_execution_stats',
                {'trigger_ids': trigger_ids}
            ).execute()
            
            if events_result.data:
                stats = {stat['trigger_id']: stat for stat in events_result.data}
        
        # Format response
        triggers = []
        for trigger in result.data or []:
            trigger_stats = stats.get(trigger['trigger_id'], {})
            
            # Calculate next execution for schedule triggers
            next_execution = None
            if trigger['trigger_type'] == 'schedule' and trigger.get('config', {}).get('cron_expression'):
                # TODO: Calculate next execution based on cron expression
                pass
            
            triggers.append(TriggerWithAgent(
                trigger_id=trigger['trigger_id'],
                agent_id=trigger['agent_id'],
                agent_name=trigger['agents']['name'],
                agent_description=trigger['agents'].get('description'),
                trigger_type=trigger['trigger_type'],
                name=trigger['name'],
                description=trigger.get('description'),
                is_active=trigger['is_active'],
                config=trigger.get('config', {}),
                created_at=trigger['created_at'],
                updated_at=trigger['updated_at'],
                last_execution=trigger_stats.get('last_execution'),
                next_execution=next_execution,
                execution_count=trigger_stats.get('execution_count', 0),
                success_count=trigger_stats.get('success_count', 0),
                failure_count=trigger_stats.get('failure_count', 0)
            ))
        
        has_more = total_count > (page * per_page)
        
        return TriggerListResponse(
            triggers=triggers,
            total=total_count,
            page=page,
            per_page=per_page,
            has_more=has_more
        )
        
    except Exception as e:
        logger.error(f"Error fetching user triggers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=TriggerStats)
async def get_trigger_statistics(
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(get_db)
):
    """
    Get statistics about user's triggers
    """
    try:
        client = await db.client
        
        # Get all agents for the user
        agents_result = await client.table('agents')\
            .select('agent_id, name')\
            .eq('account_id', user_id)\
            .execute()
        
        if not agents_result.data:
            return TriggerStats(
                total_triggers=0,
                active_triggers=0,
                inactive_triggers=0,
                executions_today=0,
                executions_this_week=0,
                executions_this_month=0,
                success_rate=0.0,
                triggers_by_type={}
            )
        
        agent_ids = [agent['agent_id'] for agent in agents_result.data]
        agent_names = {agent['agent_id']: agent['name'] for agent in agents_result.data}
        
        # Get trigger counts
        triggers_result = await client.table('agent_triggers')\
            .select('trigger_id, trigger_type, is_active, agent_id')\
            .in_('agent_id', agent_ids)\
            .execute()
        
        total_triggers = len(triggers_result.data) if triggers_result.data else 0
        active_triggers = sum(1 for t in (triggers_result.data or []) if t['is_active'])
        inactive_triggers = total_triggers - active_triggers
        
        # Count triggers by type
        triggers_by_type = {}
        agent_trigger_counts = {}
        for trigger in (triggers_result.data or []):
            trigger_type = trigger['trigger_type']
            triggers_by_type[trigger_type] = triggers_by_type.get(trigger_type, 0) + 1
            
            agent_id = trigger['agent_id']
            agent_trigger_counts[agent_id] = agent_trigger_counts.get(agent_id, 0) + 1
        
        # Find most active agent
        most_active_agent = None
        if agent_trigger_counts:
            most_active_agent_id = max(agent_trigger_counts, key=agent_trigger_counts.get)
            most_active_agent = agent_names.get(most_active_agent_id)
        
        # Get execution statistics
        trigger_ids = [t['trigger_id'] for t in (triggers_result.data or [])]
        
        executions_today = 0
        executions_this_week = 0
        executions_this_month = 0
        total_success = 0
        total_executions = 0
        
        if trigger_ids:
            # Get execution stats from the database
            stats_result = await client.rpc(
                'get_user_trigger_stats',
                {
                    'trigger_ids': trigger_ids,
                    'user_timezone': 'UTC'  # TODO: Get user's timezone preference
                }
            ).execute()
            
            if stats_result.data and len(stats_result.data) > 0:
                stats = stats_result.data[0]
                executions_today = stats.get('executions_today', 0)
                executions_this_week = stats.get('executions_this_week', 0)
                executions_this_month = stats.get('executions_this_month', 0)
                total_success = stats.get('total_success', 0)
                total_executions = stats.get('total_executions', 0)
        
        success_rate = (total_success / total_executions * 100) if total_executions > 0 else 0.0
        
        return TriggerStats(
            total_triggers=total_triggers,
            active_triggers=active_triggers,
            inactive_triggers=inactive_triggers,
            executions_today=executions_today,
            executions_this_week=executions_this_week,
            executions_this_month=executions_this_month,
            success_rate=round(success_rate, 2),
            most_active_agent=most_active_agent,
            triggers_by_type=triggers_by_type
        )
        
    except Exception as e:
        logger.error(f"Error fetching trigger statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{trigger_id}/toggle")
async def toggle_trigger(
    trigger_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(get_db)
):
    """
    Toggle a trigger's active status
    """
    try:
        client = await db.client
        
        # Verify the trigger belongs to the user
        trigger_result = await client.table('agent_triggers')\
            .select('*, agents!inner(account_id)')\
            .eq('trigger_id', trigger_id)\
            .single()\
            .execute()
        
        if not trigger_result.data or trigger_result.data['agents']['account_id'] != user_id:
            raise HTTPException(status_code=404, detail="Trigger not found")
        
        # Toggle the active status
        new_status = not trigger_result.data['is_active']
        
        update_result = await client.table('agent_triggers')\
            .update({'is_active': new_status, 'updated_at': datetime.utcnow().isoformat()})\
            .eq('trigger_id', trigger_id)\
            .execute()
        
        return {"success": True, "is_active": new_status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling trigger: {e}")
        raise HTTPException(status_code=500, detail=str(e))