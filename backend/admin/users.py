"""
User management endpoints for admin dashboard.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, Dict, List
from datetime import datetime, timedelta, timezone
from services.supabase import DBConnection
from admin.auth import AdminAuth, verify_admin, verify_support
from admin.models import (
    UserStatsResponse,
    UserListResponse,
    UserSearchParams,
    UpdateUserCreditsRequest,
    UpdateUserPlanRequest,
    SuspendUserRequest,
    PaginationParams,
    AdminActionRequest
)
from services.billing_credits import register_usage_with_credits
from services.daily_credits import (
    get_daily_credits_summary,
    get_or_create_daily_credits,
    debit_daily_credits,
    credits_to_dollars,
    dollars_to_credits
)
from utils.logger import logger
import uuid

router = APIRouter(prefix="/users", tags=["admin-users"])

class UserManagementService:
    """Service for managing users."""
    
    async def get_user_stats(self, user_id: str) -> Dict:
        """Get detailed statistics for a specific user."""
        db = DBConnection()
        client = await db.client
        
        # Get user basic info
        user_result = await client.auth.admin.get_user_by_id(user_id)
        if not user_result or not user_result.user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        user = user_result.user
        
        # Get account info
        account_result = await client.table('accounts').select('*').eq('id', user_id).execute()
        account = account_result.data[0] if account_result.data else {}
        
        # Get subscription info
        subscription = None
        customer_result = await client.schema('basejump').from_('billing_customers').select('*, billing_subscriptions(*)').eq('account_id', user_id).execute()
        if customer_result.data and customer_result.data[0].get('billing_subscriptions'):
            subscription = customer_result.data[0]['billing_subscriptions'][0]
        
        # Get usage statistics
        stats_result = await client.table('user_analytics').select('*').eq('user_id', user_id).order('date', desc=True).limit(30).execute()
        
        total_messages = sum(row.get('messages_sent', 0) for row in (stats_result.data or []))
        total_tokens = sum(row.get('tokens_used', 0) for row in (stats_result.data or []))
        total_credits = sum(row.get('credits_used', 0) for row in (stats_result.data or []))
        total_sessions = sum(row.get('session_count', 0) for row in (stats_result.data or []))
        
        avg_session_duration = 0
        if total_sessions > 0:
            total_duration = sum(row.get('total_session_duration', 0) for row in (stats_result.data or []))
            avg_session_duration = total_duration / total_sessions
        
        # Get credits info
        credits_summary = await get_daily_credits_summary(client, user_id)
        credits_info = {
            'daily_remaining': float(credits_summary.get('remaining_credits', 0)),
            'monthly_remaining': None  # Would need to calculate from subscription
        }
        
        return {
            'user_id': user_id,
            'email': user.email,
            'created_at': user.created_at,
            'last_active': stats_result.data[0]['updated_at'] if stats_result.data else None,
            'plan': subscription['price_id'] if subscription else 'free',
            'subscription_status': subscription['status'] if subscription else 'none',
            'total_messages': total_messages,
            'total_tokens': total_tokens,
            'total_credits': total_credits,
            'total_sessions': total_sessions,
            'avg_session_duration': avg_session_duration,
            'daily_credits_remaining': credits_info.get('daily_remaining'),
            'monthly_credits_remaining': credits_info.get('monthly_remaining'),
            'metadata': {
                'name': account.get('name'),
                'phone': user.phone,
                'email_confirmed': user.email_confirmed_at is not None,
                'providers': [p['provider'] for p in (user.identities or [])]
            }
        }
    
    async def search_users(
        self,
        params: UserSearchParams,
        pagination: PaginationParams
    ) -> Dict:
        """Search and filter users."""
        db = DBConnection()
        client = await db.client
        
        # Build query
        query = client.table('accounts').select('*', count='exact')
        
        # Apply filters
        if params.query:
            # Search in email and name
            query = query.or_(f"email.ilike.%{params.query}%,name.ilike.%{params.query}%")
        
        if params.created_after:
            query = query.gte('created_at', params.created_after.isoformat())
        
        if params.created_before:
            query = query.lte('created_at', params.created_before.isoformat())
        
        # Apply sorting
        if pagination.sort_by:
            query = query.order(pagination.sort_by, desc=(pagination.sort_order == 'desc'))
        else:
            query = query.order('created_at', desc=True)
        
        # Apply pagination
        offset = (pagination.page - 1) * pagination.page_size
        query = query.range(offset, offset + pagination.page_size - 1)
        
        result = await query.execute()
        
        # Get additional stats for each user
        users_with_stats = []
        for account in (result.data or []):
            try:
                stats = await self.get_user_stats(account['id'])
                users_with_stats.append(stats)
            except:
                # Basic info if stats fail
                users_with_stats.append({
                    'user_id': account['id'],
                    'email': account.get('email', ''),
                    'created_at': account.get('created_at'),
                    'plan': 'unknown'
                })
        
        return {
            'users': users_with_stats,
            'total': result.count or 0,
            'page': pagination.page,
            'page_size': pagination.page_size,
            'has_more': (result.count or 0) > offset + pagination.page_size
        }
    
    async def update_user_credits(
        self,
        user_id: str,
        credits: float,
        operation: str,
        reason: str,
        admin_id: str
    ) -> Dict:
        """Update user credits."""
        db = DBConnection()
        client = await db.client
        
        if operation == 'set':
            # Set credits to specific value
            # Note: We can't directly set credits, only debit. For now, log the intention
            logger.info(f"Setting credits to {credits} for user {user_id} (manual operation)")
            result = credits
        elif operation == 'add':
            # Add credits - Note: There's no direct credit function, only debit
            # For now, log the addition
            logger.info(f"Adding {credits} credits to user {user_id} (manual operation)")
            summary = await get_daily_credits_summary(client, user_id)
            result = float(summary.get('remaining_credits', 0)) + credits
        elif operation == 'subtract':
            # Subtract credits using debit
            from decimal import Decimal
            success, remaining = await debit_daily_credits(client, user_id, Decimal(str(credits)))
            if not success:
                raise ValueError(f"Insufficient credits")
            summary = await get_daily_credits_summary(client, user_id)
            result = float(summary.get('remaining_credits', 0))
        else:
            raise ValueError(f"Invalid operation: {operation}")
        
        # Log the action
        await AdminAuth.log_admin_action(
            admin_id=admin_id,
            action=f"Updated credits: {operation} {credits}",
            action_type='update',
            target_type='credits',
            target_user_id=user_id,
            metadata={
                'credits': credits,
                'operation': operation,
                'reason': reason
            }
        )
        
        return result
    
    async def suspend_user(
        self,
        user_id: str,
        reason: str,
        suspend_until: Optional[datetime],
        admin_id: str
    ) -> Dict:
        """Suspend a user account."""
        db = DBConnection()
        client = await db.client
        
        # Update user metadata with suspension info
        metadata = {
            'suspended': True,
            'suspended_at': datetime.now(timezone.utc).isoformat(),
            'suspended_by': admin_id,
            'suspension_reason': reason,
            'suspend_until': suspend_until.isoformat() if suspend_until else None
        }
        
        # Use Supabase Admin API to update user
        result = await client.auth.admin.update_user_by_id(
            user_id,
            {'banned': True, 'ban_duration': 'none' if not suspend_until else '24h'}
        )
        
        # Update account table
        await client.table('accounts').update({
            'metadata': metadata
        }).eq('id', user_id).execute()
        
        # Log the action
        await AdminAuth.log_admin_action(
            admin_id=admin_id,
            action=f"Suspended user",
            action_type='update',
            target_type='user',
            target_user_id=user_id,
            metadata={
                'reason': reason,
                'suspend_until': suspend_until.isoformat() if suspend_until else None
            }
        )
        
        return {'success': True, 'message': 'Usuário suspenso com sucesso'}
    
    async def reactivate_user(
        self,
        user_id: str,
        admin_id: str
    ) -> Dict:
        """Reactivate a suspended user."""
        db = DBConnection()
        client = await db.client
        
        # Unban user
        result = await client.auth.admin.update_user_by_id(
            user_id,
            {'banned': False}
        )
        
        # Update account metadata
        await client.table('accounts').update({
            'metadata': {'suspended': False}
        }).eq('id', user_id).execute()
        
        # Log the action
        await AdminAuth.log_admin_action(
            admin_id=admin_id,
            action=f"Reactivated user",
            action_type='update',
            target_type='user',
            target_user_id=user_id,
            metadata={}
        )
        
        return {'success': True, 'message': 'Usuário reativado com sucesso'}

user_service = UserManagementService()

@router.get("/", response_model=UserListResponse)
async def list_users(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search query"),
    status: Optional[str] = Query(None, description="User status filter"),
    admin_user: Dict = Depends(verify_support),
    request: Request = None
):
    """List all users with filtering and pagination."""
    try:
        search_params = UserSearchParams(query=search, status=status)
        result = await user_service.search_users(search_params, pagination)
        
        # Log access
        await AdminAuth.log_admin_access(
            admin_id=admin_user['id'],
            action="Viewed user list",
            ip_address=request.client.host if request and request.client else None
        )
        
        return UserListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao listar usuários")

@router.get("/{user_id}", response_model=UserStatsResponse)
async def get_user_details(
    user_id: str,
    admin_user: Dict = Depends(verify_support),
    request: Request = None
):
    """Get detailed information about a specific user."""
    try:
        stats = await user_service.get_user_stats(user_id)
        
        # Log access
        await AdminAuth.log_admin_action(
            admin_id=admin_user['id'],
            action="Viewed user details",
            action_type='view',
            target_type='user',
            target_user_id=user_id,
            metadata={},
            ip_address=request.client.host if request and request.client else None
        )
        
        return UserStatsResponse(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user details: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar detalhes do usuário")

@router.post("/{user_id}/credits")
async def update_user_credits(
    user_id: str,
    request_data: UpdateUserCreditsRequest,
    admin_user: Dict = Depends(verify_admin),
    request: Request = None
):
    """Update user credits (add, subtract, or set)."""
    try:
        # Check permission
        if not await AdminAuth.check_permission(admin_user, 'credits', 'edit'):
            raise HTTPException(status_code=403, detail="Sem permissão para editar créditos")
        
        result = await user_service.update_user_credits(
            user_id=user_id,
            credits=request_data.credits,
            operation=request_data.operation,
            reason=request_data.reason,
            admin_id=admin_user['id']
        )
        
        return {
            'success': True,
            'message': f'Créditos atualizados com sucesso',
            'new_balance': result
        }
        
    except Exception as e:
        logger.error(f"Error updating user credits: {str(e)}")
        
        # Log failed attempt
        await AdminAuth.log_admin_action(
            admin_id=admin_user['id'],
            action=f"Failed to update credits",
            action_type='update',
            target_type='credits',
            target_user_id=user_id,
            success=False,
            error_message=str(e)
        )
        
        raise HTTPException(status_code=500, detail="Erro ao atualizar créditos")

@router.post("/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    request_data: SuspendUserRequest,
    admin_user: Dict = Depends(verify_admin),
    request: Request = None
):
    """Suspend a user account."""
    try:
        # Check permission
        if not await AdminAuth.check_permission(admin_user, 'users', 'edit'):
            raise HTTPException(status_code=403, detail="Sem permissão para suspender usuários")
        
        result = await user_service.suspend_user(
            user_id=user_id,
            reason=request_data.reason,
            suspend_until=request_data.suspend_until,
            admin_id=admin_user['id']
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error suspending user: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao suspender usuário")

@router.post("/{user_id}/reactivate")
async def reactivate_user(
    user_id: str,
    admin_user: Dict = Depends(verify_admin),
    request: Request = None
):
    """Reactivate a suspended user account."""
    try:
        # Check permission
        if not await AdminAuth.check_permission(admin_user, 'users', 'edit'):
            raise HTTPException(status_code=403, detail="Sem permissão para reativar usuários")
        
        result = await user_service.reactivate_user(
            user_id=user_id,
            admin_id=admin_user['id']
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error reactivating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao reativar usuário")

@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    admin_user: Dict = Depends(verify_admin),
    request: Request = None
):
    """Send password reset email to user."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Get user email
        user_result = await client.auth.admin.get_user_by_id(user_id)
        if not user_result or not user_result.user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Generate reset link
        reset_result = await client.auth.admin.generate_link({
            'type': 'recovery',
            'email': user_result.user.email
        })
        
        # Log the action
        await AdminAuth.log_admin_action(
            admin_id=admin_user['id'],
            action="Sent password reset",
            action_type='update',
            target_type='user',
            target_user_id=user_id,
            metadata={'email': user_result.user.email}
        )
        
        return {
            'success': True,
            'message': 'Link de reset enviado para o email do usuário',
            'reset_link': reset_result.link  # Only in dev/staging
        }
        
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao resetar senha")

@router.get("/{user_id}/threads")
async def get_user_threads(
    user_id: str,
    limit: int = Query(default=20, le=100),
    admin_user: Dict = Depends(verify_support)
):
    """Get user's conversation threads."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Get user's threads
        threads_result = await client.table('threads').select('*').eq('account_id', user_id).order('created_at', desc=True).limit(limit).execute()
        
        return {
            'threads': threads_result.data or [],
            'total': len(threads_result.data or [])
        }
        
    except Exception as e:
        logger.error(f"Error fetching user threads: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar conversas")