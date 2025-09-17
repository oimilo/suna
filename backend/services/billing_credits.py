"""
Billing Credits Integration
Handles the integration between daily credits and subscription billing
"""

from datetime import datetime, timezone
from typing import Tuple
from decimal import Decimal
from utils.logger import logger
from services.daily_credits import debit_daily_credits, credits_to_dollars, dollars_to_credits

async def register_usage_with_credits(client, user_id: str, cost_in_dollars: float) -> Tuple[float, float]:
    """
    Register usage by first debiting from daily credits, then from subscription.
    
    Args:
        client: Supabase client
        user_id: User ID
        cost_in_dollars: Cost of the usage in dollars
    
    Returns:
        Tuple[float, float]: (daily_credits_used_in_dollars, subscription_used_in_dollars)
    """
    try:
        logger.info(f"[BILLING_CREDITS] Starting register_usage for user {user_id}, cost: ${cost_in_dollars:.4f}")
        
        # First, try to debit from daily credits
        success, remaining_cost = await debit_daily_credits(client, user_id, Decimal(str(cost_in_dollars)))
        
        if success:
            # Some or all was debited from daily credits
            daily_used = cost_in_dollars - float(remaining_cost)
            subscription_used = float(remaining_cost)
            
            logger.info(f"Usage registered for user {user_id}: ${daily_used:.4f} from daily credits, ${subscription_used:.4f} from subscription")
            
            return daily_used, subscription_used
        else:
            # No daily credits available, all goes to subscription
            logger.info(f"No daily credits available for user {user_id}, using subscription: ${cost_in_dollars:.4f}")
            return 0.0, cost_in_dollars
            
    except Exception as e:
        logger.error(f"Error registering usage with credits for user {user_id}: {str(e)}")
        # On error, charge to subscription to not block the user
        return 0.0, cost_in_dollars