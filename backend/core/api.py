from fastapi import APIRouter
from .versioning.api import router as agent_versioning_router
from .core_utils import initialize as core_initialize, cleanup
from .utils.tool_discovery import warm_up_tools_cache_with_retry
from .utils.logger import logger
from .agent_runs import router as agent_runs_router
from .agent_crud import router as agent_crud_router
from .agent_tools import router as agent_tools_router
from .agent_json import router as agent_json_router
from .agent_setup import router as agent_setup_router
from .threads import router as threads_router
from .tools_api import router as tools_api_router
from .vapi_api import router as vapi_router
from .account_deletion import router as account_deletion_router
from .limits_api import router as limits_api_router
from .feedback import router as feedback_router

router = APIRouter()


def initialize(*args, **kwargs):
    """Initialize core API modules and warm up tool cache for this process."""
    core_initialize(*args, **kwargs)
    warmed = warm_up_tools_cache_with_retry()
    if not warmed:
        logger.warning("Tool cache warm-up failed during API startup; continuing without preload")

# Include all sub-routers
router.include_router(agent_versioning_router)
router.include_router(agent_runs_router)
router.include_router(agent_crud_router)
router.include_router(agent_tools_router)
router.include_router(agent_json_router)
router.include_router(agent_setup_router)
router.include_router(threads_router)
router.include_router(tools_api_router)
router.include_router(vapi_router)
router.include_router(account_deletion_router)
router.include_router(limits_api_router)
router.include_router(feedback_router)

# Re-export the initialize and cleanup functions
__all__ = ['router', 'initialize', 'cleanup']