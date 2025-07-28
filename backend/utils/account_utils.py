"""
Utility functions for handling Basejump account relationships
"""
from typing import Optional
from utils.logger import logger


async def get_account_id_from_user_id(client, user_id: str) -> str:
    """
    Get the account_id for a given user_id from the basejump.account_user table.
    In Basejump, personal account_id is different from user_id.
    """
    try:
        # Query the basejump.account_user table to get the account_id
        result = await client.from_('basejump.account_user').select('account_id').eq('user_id', user_id).single().execute()
        
        if result.data and 'account_id' in result.data:
            account_id = result.data['account_id']
            logger.debug(f"Found account_id {account_id} for user_id {user_id}")
            return account_id
        else:
            # If no account found, fall back to user_id (shouldn't happen in production)
            logger.warning(f"No account found for user_id {user_id}, using user_id as account_id")
            return user_id
            
    except Exception as e:
        logger.error(f"Error getting account_id for user_id {user_id}: {str(e)}")
        # Fall back to user_id if there's an error
        return user_id