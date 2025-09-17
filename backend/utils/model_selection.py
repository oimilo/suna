"""
Model selection logic - simplified to use only Claude Sonnet 4.
"""

from typing import Optional, Dict, Any
from utils.logger import logger

# All tiers use Claude Sonnet 4 directly from Anthropic
DEFAULT_MODEL = "claude-sonnet-4-20250514"

# Default models by subscription tier - all use the same model now
DEFAULT_MODELS_BY_TIER = {
    "free": DEFAULT_MODEL,
    "pro": DEFAULT_MODEL,
    "pro_max": DEFAULT_MODEL,
    "enterprise": DEFAULT_MODEL,
}

# Fallback model if tier detection fails
FALLBACK_MODEL = DEFAULT_MODEL


def get_default_model_for_tier(tier_name: str) -> str:
    """
    Get the default model for a given subscription tier.
    
    Args:
        tier_name: The subscription tier name (free, pro, pro_max, enterprise)
        
    Returns:
        The default model identifier for the tier
    """
    model = DEFAULT_MODELS_BY_TIER.get(tier_name, FALLBACK_MODEL)
    logger.info(f"Selected default model {model} for tier {tier_name}")
    return model


def get_user_model_or_default(
    user_selected_model: Optional[str], 
    user_tier: str,
    allowed_models: list[str]
) -> str:
    """
    Get the model to use - now always returns Claude Sonnet 4.
    
    Args:
        user_selected_model: Model explicitly selected by user (ignored now)
        user_tier: User's subscription tier (all tiers use same model now)
        allowed_models: List of models the user is allowed to use (ignored now)
        
    Returns:
        Always returns Claude Sonnet 4
    """
    logger.info(f"Using Claude Sonnet 4 for all users")
    return DEFAULT_MODEL