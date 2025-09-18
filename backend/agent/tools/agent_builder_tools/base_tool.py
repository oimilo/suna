import structlog
from typing import Optional
from agentpress.tool import Tool
from agentpress.thread_manager import ThreadManager
from utils.logger import logger


class AgentBuilderBaseTool(Tool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__()
        self.thread_manager = thread_manager
        self.db = db_connection
        self.agent_id = agent_id
    
    def _get_target_agent_id(self) -> str:
        """Resolve the effective target agent id (prefer thread's target_agent_id)."""
        try:
            if hasattr(self.thread_manager, 'target_agent_id') and self.thread_manager.target_agent_id:
                return self.thread_manager.target_agent_id
        except Exception:
            pass
        return self.agent_id
    
    async def _get_current_account_id(self) -> str:
        try:
            context_vars = structlog.contextvars.get_contextvars()
            thread_id = context_vars.get('thread_id')
            
            if not thread_id:
                raise ValueError("No thread_id available from execution context")
            
            client = await self.db.client
            
            thread_result = await client.table('threads').select('account_id').eq('thread_id', thread_id).limit(1).execute()
            if not thread_result.data:
                raise ValueError(f"Could not find thread with ID: {thread_id}")
            
            account_id = thread_result.data[0]['account_id']
            if not account_id:
                raise ValueError("Thread has no associated account_id")
            
            return account_id
            
        except Exception as e:
            logger.error(f"Error getting current account_id: {e}")
            raise

    async def _get_agent_data(self) -> Optional[dict]:
        try:
            client = await self.db.client
            effective_agent_id = self._get_target_agent_id()
            result = await client.table('agents').select('*').eq('agent_id', effective_agent_id).execute()
            
            if not result.data:
                return None
                
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error getting agent data: {e}")
            return None 