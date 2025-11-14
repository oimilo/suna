from fastapi import APIRouter, Depends, HTTPException
from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.logger import logger
from .free_tier_service import free_tier_service
from core.utils.suna_default_agent_service import SunaDefaultAgentService
from core.services.supabase import DBConnection

router = APIRouter(prefix="/setup", tags=["setup"])

@router.post("/initialize")
async def initialize_account(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    try:
        logger.info(f"[SETUP] Initializing account for {account_id}")
        
        db = DBConnection()
        await db.initialize()
        
        result = await free_tier_service.auto_subscribe_to_free_tier(account_id)
        
        if not result.get('success'):
            logger.error(f"[SETUP] Failed to create free tier for {account_id}: {result.get('error')}")
            raise HTTPException(status_code=500, detail="Failed to initialize free tier")
        
        logger.info(f"[SETUP] Installing Suna agent for {account_id}")
        suna_service = SunaDefaultAgentService(db)
        await suna_service.install_suna_agent_for_user(account_id)
        
        logger.info(f"[SETUP] ✅ Account initialization complete for {account_id}")
        
        return {
            'success': True,
            'message': 'Account initialized successfully',
            'subscription_id': result.get('subscription_id')
        }
        
    except Exception as e:
        logger.error(f"[SETUP] Error initializing account {account_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ensure-free-tier")
async def ensure_free_tier(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """
    Ensure user has free tier. Called automatically on login if user doesn't have a tier.
    This gives free tier directly without requiring Stripe subscription.
    """
    try:
        logger.info(f"[SETUP] Ensuring free tier for account {account_id}")
        
        result = await free_tier_service.give_free_tier_directly(account_id)
        
        if not result.get('success'):
            logger.warning(f"[SETUP] Failed to give free tier to {account_id}: {result.get('error')}")
            # Don't raise error - just return the result
            return result
        
        logger.info(f"[SETUP] ✅ Free tier ensured for account {account_id}")
        return result
        
    except Exception as e:
        logger.error(f"[SETUP] Error ensuring free tier for {account_id}: {e}")
        return {'success': False, 'error': str(e)}

