"""
Admin authentication and authorization utilities.
"""

from fastapi import HTTPException, Depends, Request
from typing import Optional, Dict
from enum import Enum
from utils.auth_utils import get_current_user_id_from_jwt
from services.supabase import DBConnection
from utils.logger import logger
import structlog
from datetime import datetime, timezone

class AdminRole(Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SUPPORT = "support"
    VIEWER = "viewer"

class AdminAuth:
    """Handle admin authentication and authorization."""
    
    @staticmethod
    async def get_admin_user(user_id: str) -> Optional[Dict]:
        """Get admin user details from database."""
        try:
            db = DBConnection()
            client = await db.client
            
            result = await client.table('admin_users').select('*').eq('user_id', user_id).eq('is_active', True).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching admin user: {str(e)}")
            return None
    
    @staticmethod
    async def verify_admin_role(
        required_role: Optional[AdminRole] = None,
        minimum_role: Optional[AdminRole] = None
    ):
        """
        Dependency to verify admin access and role.
        
        Args:
            required_role: Exact role required (e.g., only super_admin)
            minimum_role: Minimum role level required (hierarchy: super_admin > admin > support > viewer)
        """
        async def verify(
            user_id: str = Depends(get_current_user_id_from_jwt),
            request: Request = None
        ) -> Dict:
            # Get admin user
            admin_user = await AdminAuth.get_admin_user(user_id)
            
            if not admin_user:
                raise HTTPException(
                    status_code=403,
                    detail="Acesso administrativo necessário"
                )
            
            user_role = AdminRole(admin_user['role'])
            
            # Check exact role requirement
            if required_role and user_role != required_role:
                raise HTTPException(
                    status_code=403,
                    detail=f"Requer role: {required_role.value}"
                )
            
            # Check minimum role requirement (hierarchy)
            if minimum_role:
                role_hierarchy = {
                    AdminRole.VIEWER: 0,
                    AdminRole.SUPPORT: 1,
                    AdminRole.ADMIN: 2,
                    AdminRole.SUPER_ADMIN: 3
                }
                
                if role_hierarchy.get(user_role, 0) < role_hierarchy.get(minimum_role, 0):
                    raise HTTPException(
                        status_code=403,
                        detail=f"Requer no mínimo role: {minimum_role.value}"
                    )
            
            # Log admin access
            if request:
                await AdminAuth.log_admin_access(
                    admin_id=admin_user['id'],
                    action=f"Accessed {request.url.path}",
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get('user-agent')
                )
            
            # Bind context for logging
            structlog.contextvars.bind_contextvars(
                admin_id=admin_user['id'],
                admin_role=admin_user['role']
            )
            
            return admin_user
        
        return verify
    
    @staticmethod
    async def log_admin_action(
        admin_id: str,
        action: str,
        action_type: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        target_user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Log an admin action to the database."""
        try:
            db = DBConnection()
            client = await db.client
            
            log_data = {
                'admin_id': admin_id,
                'action': action,
                'action_type': action_type,
                'target_type': target_type,
                'target_id': target_id,
                'target_user_id': target_user_id,
                'metadata': metadata or {},
                'success': success,
                'error_message': error_message,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            result = await client.table('admin_logs').insert(log_data).execute()
            
            if result.data:
                return result.data[0]['id']
            
        except Exception as e:
            logger.error(f"Error logging admin action: {str(e)}")
        
        return None
    
    @staticmethod
    async def log_admin_access(
        admin_id: str,
        action: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Quick helper to log admin access."""
        await AdminAuth.log_admin_action(
            admin_id=admin_id,
            action=action,
            action_type='view',
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    async def check_permission(
        admin_user: Dict,
        resource: str,
        action: str
    ) -> bool:
        """
        Check if admin has permission for specific resource and action.
        Can be extended with more granular permissions.
        """
        role = AdminRole(admin_user['role'])
        
        # Super admin has all permissions
        if role == AdminRole.SUPER_ADMIN:
            return True
        
        # Define permission matrix
        permissions = {
            AdminRole.ADMIN: {
                'users': ['view', 'edit', 'create', 'delete'],
                'billing': ['view', 'edit'],
                'analytics': ['view'],
                'system': ['view'],
                'credits': ['view', 'edit']
            },
            AdminRole.SUPPORT: {
                'users': ['view', 'edit'],
                'billing': ['view'],
                'analytics': ['view'],
                'credits': ['view']
            },
            AdminRole.VIEWER: {
                'users': ['view'],
                'billing': ['view'],
                'analytics': ['view'],
                'system': ['view']
            }
        }
        
        role_permissions = permissions.get(role, {})
        resource_permissions = role_permissions.get(resource, [])
        
        return action in resource_permissions

# Dependency shortcuts
verify_super_admin = AdminAuth.verify_admin_role(required_role=AdminRole.SUPER_ADMIN)
verify_admin = AdminAuth.verify_admin_role(minimum_role=AdminRole.ADMIN)
verify_support = AdminAuth.verify_admin_role(minimum_role=AdminRole.SUPPORT)
verify_viewer = AdminAuth.verify_admin_role(minimum_role=AdminRole.VIEWER)