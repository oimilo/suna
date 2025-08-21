"""
Daily Credits System for Suna
Provides free credits per day for all users (configurable via env)
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict
from utils.logger import logger
from services.supabase import DBConnection
from decimal import Decimal
from utils.config import config

# Constants
DAILY_CREDITS_AMOUNT = Decimal(str(config.DAILY_CREDITS_AMOUNT))  # Credits per day from env variable (default: 200)
CREDIT_TO_DOLLAR_RATE = Decimal("0.01")  # 1 credit = $0.01 (100 credits = $1)
DAILY_CREDITS_DURATION_HOURS = 24

def credits_to_dollars(credits: Decimal) -> Decimal:
    """Convert credits to dollars"""
    return credits * CREDIT_TO_DOLLAR_RATE

def dollars_to_credits(dollars: Decimal) -> Decimal:
    """Convert dollars to credits"""
    return dollars / CREDIT_TO_DOLLAR_RATE

async def get_or_create_daily_credits(client, user_id: str) -> Dict:
    """
    Get or create daily credits for a user.
    If expired or non-existent, creates new daily credits.
    
    Returns:
        Dict with 'credits_available', 'expires_at', and 'id'
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Check for existing non-expired daily credits
        result = await client.table('daily_credits') \
            .select('*') \
            .eq('user_id', user_id) \
            .gt('expires_at', now.isoformat()) \
            .order('created_at', desc=True) \
            .limit(1) \
            .execute()
        
        if result.data and len(result.data) > 0:
            # Found valid daily credits
            credit_entry = result.data[0]
            credits_available = Decimal(str(credit_entry['credits_granted'])) - Decimal(str(credit_entry['credits_used']))
            
            logger.info(f"Found existing daily credits for user {user_id}: {credits_available} available")
            
            return {
                'id': credit_entry['id'],
                'credits_available': credits_available,
                'expires_at': credit_entry['expires_at'],
                'credits_granted': Decimal(str(credit_entry['credits_granted'])),
                'credits_used': Decimal(str(credit_entry['credits_used']))
            }
        
        # No valid daily credits found, create new ones
        expires_at = now + timedelta(hours=DAILY_CREDITS_DURATION_HOURS)
        
        new_credit = {
            'user_id': user_id,
            'credits_granted': float(DAILY_CREDITS_AMOUNT),
            'credits_used': 0.0,
            'granted_at': now.isoformat(),
            'expires_at': expires_at.isoformat()
        }
        
        result = await client.table('daily_credits') \
            .insert(new_credit) \
            .execute()
        
        if result.data and len(result.data) > 0:
            credit_entry = result.data[0]
            logger.info(f"Created new daily credits for user {user_id}: {DAILY_CREDITS_AMOUNT} credits")
            
            return {
                'id': credit_entry['id'],
                'credits_available': DAILY_CREDITS_AMOUNT,
                'expires_at': credit_entry['expires_at'],
                'credits_granted': DAILY_CREDITS_AMOUNT,
                'credits_used': Decimal("0.00")
            }
        
        raise Exception("Failed to create daily credits")
        
    except Exception as e:
        logger.error(f"Error managing daily credits for user {user_id}: {str(e)}")
        # Return empty credits on error to not block the user
        return {
            'id': None,
            'credits_available': Decimal("0.00"),
            'expires_at': None,
            'credits_granted': Decimal("0.00"),
            'credits_used': Decimal("0.00")
        }

async def debit_daily_credits(client, user_id: str, amount_in_dollars: Decimal) -> Tuple[bool, Decimal]:
    """
    Attempt to debit from daily credits first.
    
    Args:
        client: Supabase client
        user_id: User ID
        amount_in_dollars: Amount to debit in dollars
    
    Returns:
        Tuple[bool, Decimal]: (success, remaining_amount_in_dollars)
        - If fully debited from daily credits: (True, 0)
        - If partially debited: (True, remaining_amount)
        - If no daily credits available: (False, full_amount)
    """
    try:
        # Convert dollars to credits
        amount_in_credits = dollars_to_credits(amount_in_dollars)
        
        # Get current daily credits
        daily_credits = await get_or_create_daily_credits(client, user_id)
        
        if daily_credits['credits_available'] <= 0:
            # No daily credits available
            return False, amount_in_dollars
        
        # Calculate how much we can debit
        credits_to_debit = min(amount_in_credits, daily_credits['credits_available'])
        dollars_debited = credits_to_dollars(credits_to_debit)
        
        # Update the daily credits (atomic operation)
        if daily_credits['id']:
            new_credits_used = daily_credits['credits_used'] + credits_to_debit
            
            result = await client.table('daily_credits') \
                .update({
                    'credits_used': float(new_credits_used)
                }) \
                .eq('id', daily_credits['id']) \
                .eq('credits_used', float(daily_credits['credits_used'])) \
                .execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"Debited {credits_to_debit} daily credits from user {user_id}")
                
                # Calculate remaining amount
                remaining_dollars = amount_in_dollars - dollars_debited
                return True, remaining_dollars
            else:
                # Concurrent update detected, retry would be needed
                logger.warning(f"Concurrent update detected for daily credits of user {user_id}")
                return False, amount_in_dollars
        
        return False, amount_in_dollars
        
    except Exception as e:
        logger.error(f"Error debiting daily credits for user {user_id}: {str(e)}")
        return False, amount_in_dollars

async def get_daily_credits_summary(client, user_id: str) -> Dict:
    """
    Get a summary of daily credits for display in UI.
    
    Returns:
        Dict with 'daily_credits', 'daily_expires_in', 'daily_credits_used'
    """
    try:
        daily_credits = await get_or_create_daily_credits(client, user_id)
        
        # Calculate time until expiration
        expires_in = None
        if daily_credits['expires_at']:
            expires_at = datetime.fromisoformat(daily_credits['expires_at'].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            time_diff = expires_at - now
            
            if time_diff.total_seconds() > 0:
                hours = int(time_diff.total_seconds() // 3600)
                minutes = int((time_diff.total_seconds() % 3600) // 60)
                expires_in = f"{hours}h {minutes}m"
            else:
                expires_in = "Expired"
        
        return {
            'daily_credits': float(daily_credits['credits_available']),
            'daily_credits_used': float(daily_credits['credits_used']),
            'daily_credits_granted': float(daily_credits['credits_granted']),
            'daily_expires_in': expires_in
        }
        
    except Exception as e:
        logger.error(f"Error getting daily credits summary for user {user_id}: {str(e)}")
        return {
            'daily_credits': 0.0,
            'daily_credits_used': 0.0,
            'daily_credits_granted': 0.0,
            'daily_expires_in': None
        }

async def cleanup_expired_credits(client):
    """
    Cleanup expired daily credits entries (optional maintenance task).
    Can be run periodically to keep the table clean.
    """
    try:
        now = datetime.now(timezone.utc)
        # Delete credits expired more than 7 days ago
        cutoff_date = now - timedelta(days=7)
        
        result = await client.table('daily_credits') \
            .delete() \
            .lt('expires_at', cutoff_date.isoformat()) \
            .execute()
        
        if result.data:
            logger.info(f"Cleaned up {len(result.data)} expired daily credit entries")
            
    except Exception as e:
        logger.error(f"Error cleaning up expired credits: {str(e)}")