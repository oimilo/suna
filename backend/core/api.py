from fastapi import APIRouter, HTTPException
from core.utils.logger import logger
from .versioning.api import router as agent_versioning_router
from .core_utils import initialize, cleanup
from .agent_runs import router as agent_runs_router
from .agent_crud import router as agent_crud_router
from .agent_tools import router as agent_tools_router
from .agent_json import router as agent_json_router
from .threads import router as threads_router
from .tools_api import router as tools_api_router
from .vapi_api import router as vapi_router

router = APIRouter()

# Include all sub-routers
router.include_router(agent_versioning_router)
router.include_router(agent_runs_router)
router.include_router(agent_crud_router)
router.include_router(agent_tools_router)
router.include_router(agent_json_router)
router.include_router(threads_router)
router.include_router(tools_api_router)
router.include_router(vapi_router)

# --- Feature Flags (mínimo p/ frontend) ---
@router.get("/feature-flags")
async def list_feature_flags():
    try:
        flags = {
            "custom_agents": True,
            "agent_marketplace": False,
        }
        return {"flags": flags}
    except Exception as e:
        logger.error(f"feature-flags list error: {e}")
        raise HTTPException(status_code=500, detail="feature flags unavailable")

@router.get("/feature-flags/{flag}")
async def get_feature_flag(flag: str):
    try:
        enabled = flag in ["custom_agents"]
        return {"flag_name": flag, "enabled": enabled, "details": None}
    except Exception as e:
        logger.error(f"feature-flag {flag} error: {e}")
        raise HTTPException(status_code=500, detail="feature flag unavailable")

# Re-export the initialize and cleanup functions
__all__ = ['router', 'initialize', 'cleanup']