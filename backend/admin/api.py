from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict
from utils.auth_utils import verify_admin_api_key
from utils.suna_default_agent_service import SunaDefaultAgentService
from utils.logger import logger
from utils.config import config, EnvMode
from dotenv import load_dotenv, set_key, find_dotenv, dotenv_values

# Import admin sub-routers
from admin.analytics import router as analytics_router
from admin.users import router as users_router
from admin.auth import AdminAuth, verify_super_admin
from admin.models import CreateAdminRequest, AdminUserResponse
from services.supabase import DBConnection
from datetime import datetime, timezone

router = APIRouter(prefix="/admin", tags=["admin"])

# Include sub-routers
router.include_router(analytics_router)
router.include_router(users_router)

# Admin Management Endpoints
@router.post("/admins", response_model=AdminUserResponse)
async def create_admin(
    request: CreateAdminRequest,
    admin_user: Dict = Depends(verify_super_admin)
):
    """Create a new admin user (super admin only)."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Check if user exists
        user_result = await client.auth.admin.get_user_by_id(request.user_id)
        if not user_result or not user_result.user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Check if already admin
        existing = await client.table('admin_users').select('*').eq('user_id', request.user_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Usuário já é admin")
        
        # Create admin user
        admin_data = {
            'user_id': request.user_id,
            'role': request.role,
            'created_by': admin_user['user_id'],
            'created_at': datetime.now(timezone.utc).isoformat(),
            'is_active': True,
            'metadata': request.metadata
        }
        
        result = await client.table('admin_users').insert(admin_data).execute()
        
        if result.data:
            # Log the action
            await AdminAuth.log_admin_action(
                admin_id=admin_user['id'],
                action=f"Created admin user with role {request.role}",
                action_type='create',
                target_type='admin',
                target_user_id=request.user_id,
                metadata={'role': request.role}
            )
            
            return AdminUserResponse(
                **result.data[0],
                email=user_result.user.email
            )
        
        raise HTTPException(status_code=500, detail="Falha ao criar admin")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating admin: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao criar admin")

@router.get("/admins")
async def list_admins(
    admin_user: Dict = Depends(verify_super_admin)
):
    """List all admin users (super admin only)."""
    try:
        db = DBConnection()
        client = await db.client
        
        result = await client.table('admin_users').select('*').eq('is_active', True).order('created_at', desc=True).execute()
        
        admins = []
        for admin in (result.data or []):
            # Get user email
            user_result = await client.auth.admin.get_user_by_id(admin['user_id'])
            if user_result and user_result.user:
                admin['email'] = user_result.user.email
                admin['name'] = user_result.user.user_metadata.get('name')
            admins.append(admin)
        
        return {
            'admins': admins,
            'total': len(admins)
        }
        
    except Exception as e:
        logger.error(f"Error listing admins: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao listar admins")

@router.delete("/admins/{admin_id}")
async def remove_admin(
    admin_id: str,
    admin_user: Dict = Depends(verify_super_admin)
):
    """Remove admin privileges from a user (super admin only)."""
    try:
        # Prevent self-removal
        if admin_id == admin_user['id']:
            raise HTTPException(status_code=400, detail="Não pode remover a si mesmo")
        
        db = DBConnection()
        client = await db.client
        
        # Soft delete (set is_active to false)
        result = await client.table('admin_users').update({
            'is_active': False,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', admin_id).execute()
        
        if result.data:
            # Log the action
            await AdminAuth.log_admin_action(
                admin_id=admin_user['id'],
                action="Removed admin privileges",
                action_type='delete',
                target_type='admin',
                target_id=admin_id
            )
            
            return {'success': True, 'message': 'Admin removido com sucesso'}
        
        raise HTTPException(status_code=404, detail="Admin não encontrado")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing admin: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao remover admin")

# Legacy Endpoints
@router.post("/suna-agents/install-user/{account_id}")
async def admin_install_suna_for_user(
    account_id: str,
    replace_existing: bool = False,
    _: bool = Depends(verify_admin_api_key)
):
    """Install Suna agent for a specific user account.
    
    Args:
        account_id: The account ID to install Suna agent for
        replace_existing: Whether to replace existing Suna agent if found
        
    Returns:
        Success message with agent_id if successful
        
    Raises:
        HTTPException: If installation fails
    """
    logger.info(f"Admin installing Suna agent for user: {account_id}")
    
    service = SunaDefaultAgentService()
    agent_id = await service.install_suna_agent_for_user(account_id, replace_existing)
    
    if agent_id:
        return {
            "success": True,
            "message": f"Successfully installed Suna agent for user {account_id}",
            "agent_id": agent_id
        }
    else:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to install Suna agent for user {account_id}"
        )

@router.get("/env-vars")
def get_env_vars() -> Dict[str, str]:
    """Get environment variables (local mode only)."""
    if config.ENV_MODE != EnvMode.LOCAL:
        raise HTTPException(status_code=403, detail="Env vars management only available in local mode")
    
    try:
        env_path = find_dotenv()
        if not env_path:
            logger.error("Could not find .env file")
            return {}
        
        return dotenv_values(env_path)
    except Exception as e:
        logger.error(f"Failed to get env vars: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get env variables: {e}")

@router.post("/env-vars")
def save_env_vars(request: Dict[str, str]) -> Dict[str, str]:
    """Save environment variables (local mode only)."""
    if config.ENV_MODE != EnvMode.LOCAL:
        raise HTTPException(status_code=403, detail="Env vars management only available in local mode")

    try:
        env_path = find_dotenv()
        if not env_path:
            raise HTTPException(status_code=500, detail="Could not find .env file")
        
        for key, value in request.items():
            set_key(env_path, key, value)
        
        load_dotenv(override=True)
        logger.info(f"Env variables saved successfully: {request}")
        return {"message": "Env variables saved successfully"}
    except Exception as e:
        logger.error(f"Failed to save env variables: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save env variables: {e}") 