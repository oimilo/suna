"""
Utility functions for handling Basejump account relationships
"""
from typing import Optional
from utils.logger import logger


async def get_account_id_from_user_id(client, user_id: str) -> str:
    """
    Get the account_id for a given user_id.
    
    In Suna, personal accounts have account_id = user_id.
    This is enforced by our Basejump setup.
    """
    # In Suna, account_id ALWAYS equals user_id for personal accounts
    # This is by design and enforced in the database
    return user_id