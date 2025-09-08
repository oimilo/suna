"""
Subscription Validator Service
Validates user subscription status and credit eligibility
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Tuple
from utils.logger import logger
from decimal import Decimal

async def check_user_subscription(client, user_id: str) -> Dict:
    """
    Check if a user has an active subscription.
    
    Args:
        client: Supabase client
        user_id: User ID to check
    
    Returns:
        Dict with subscription info:
        - has_active_subscription: bool
        - subscription_status: str (active, trialing, canceled, free, etc.)
        - plan_id: str or None
        - is_trial: bool
    """
    try:
        # First, check if user has an account
        account_result = await client.table('accounts') \
            .select('id') \
            .or_(f'id.eq.{user_id},created_by.eq.{user_id}') \
            .limit(1) \
            .execute()
        
        if not account_result.data:
            logger.info(f"[SUBSCRIPTION] User {user_id} has no account - FREE user")
            return {
                'has_active_subscription': False,
                'subscription_status': 'free',
                'plan_id': None,
                'is_trial': False
            }
        
        account_id = account_result.data[0]['id']
        
        # Check for billing customer
        customer_result = await client.table('billing_customers') \
            .select('customer_id') \
            .eq('account_id', account_id) \
            .limit(1) \
            .execute()
        
        if not customer_result.data:
            logger.info(f"[SUBSCRIPTION] Account {account_id} has no billing customer - FREE user")
            return {
                'has_active_subscription': False,
                'subscription_status': 'free',
                'plan_id': None,
                'is_trial': False
            }
        
        customer_id = customer_result.data[0]['customer_id']
        
        # Check for active subscription
        subscription_result = await client.table('billing_subscriptions') \
            .select('status, price_id, trial_end') \
            .eq('customer_id', customer_id) \
            .in_('status', ['active', 'trialing']) \
            .limit(1) \
            .execute()
        
        if not subscription_result.data:
            logger.info(f"[SUBSCRIPTION] Customer {customer_id} has no active subscription - FREE user")
            return {
                'has_active_subscription': False,
                'subscription_status': 'free',
                'plan_id': None,
                'is_trial': False
            }
        
        subscription = subscription_result.data[0]
        is_trial = subscription['status'] == 'trialing'
        
        logger.info(f"[SUBSCRIPTION] User {user_id} has {subscription['status']} subscription with plan {subscription['price_id']}")
        
        return {
            'has_active_subscription': True,
            'subscription_status': subscription['status'],
            'plan_id': subscription['price_id'],
            'is_trial': is_trial
        }
        
    except Exception as e:
        logger.error(f"Error checking subscription for user {user_id}: {str(e)}")
        # On error, return free status to avoid blocking
        return {
            'has_active_subscription': False,
            'subscription_status': 'error',
            'plan_id': None,
            'is_trial': False
        }

async def get_user_total_credits_used(client, user_id: str) -> Decimal:
    """
    Get the total amount of credits a user has used (lifetime).
    This includes all daily credits that have been consumed.
    
    Args:
        client: Supabase client
        user_id: User ID
    
    Returns:
        Decimal: Total credits used
    """
    try:
        # Sum all credits_used from daily_credits table for this user
        result = await client.table('daily_credits') \
            .select('credits_used') \
            .eq('user_id', user_id) \
            .execute()
        
        if not result.data:
            return Decimal("0.00")
        
        total_used = sum(Decimal(str(entry['credits_used'])) for entry in result.data)
        
        logger.info(f"[CREDITS] User {user_id} has used {total_used} credits lifetime")
        return total_used
        
    except Exception as e:
        logger.error(f"Error getting total credits for user {user_id}: {str(e)}")
        return Decimal("0.00")

async def can_user_get_daily_credits(client, user_id: str, config) -> Tuple[bool, str]:
    """
    Check if a user is eligible to receive daily credits.
    FREE users: NO daily credits
    PAID users: YES daily credits (non-cumulative)
    
    Args:
        client: Supabase client
        user_id: User ID
        config: Configuration object with credit settings
    
    Returns:
        Tuple[bool, str]: (can_get_credits, reason)
    """
    try:
        # Check subscription status
        subscription_info = await check_user_subscription(client, user_id)
        
        # FREE users do NOT get daily credits
        if not subscription_info['has_active_subscription']:
            logger.info(f"[CREDITS] FREE user {user_id} blocked from daily credits")
            return False, "Daily credits are only available for paid subscribers"
        
        # PAID users get daily credits
        logger.info(f"[CREDITS] PAID user {user_id} eligible for daily credits")
        return True, "Eligible for daily credits"
        
    except Exception as e:
        logger.error(f"Error checking credit eligibility for user {user_id}: {str(e)}")
        # On error, allow credits to not block users
        return True, "Error checking eligibility - allowing credits"