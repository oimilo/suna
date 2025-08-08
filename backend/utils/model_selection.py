"""
Model selection logic based on user subscription tier.
"""

from typing import Optional, Dict, Any
from utils.logger import logger

# Default models by subscription tier
DEFAULT_MODELS_BY_TIER = {
    "free": "anthropic/claude-3-5-sonnet-latest",  # Claude 3.5 Sonnet for free tier
    "pro": "anthropic/claude-sonnet-4-20250514",   # Claude 4 Sonnet for paid tiers
    "pro_max": "anthropic/claude-sonnet-4-20250514",  # Claude 4 Sonnet for paid tiers
    "enterprise": "anthropic/claude-sonnet-4-20250514",  # Claude 4 Sonnet for paid tiers
}

# Fallback model if tier detection fails
FALLBACK_MODEL = "anthropic/claude-3-5-sonnet-latest"


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
    Get the model to use - either user selected (if allowed) or tier default.
    
    Args:
        user_selected_model: Model explicitly selected by user (can be None)
        user_tier: User's subscription tier
        allowed_models: List of models the user is allowed to use
        
    Returns:
        The model to use
    """
    # If user selected a model and it's allowed, use it
    if user_selected_model and user_selected_model in allowed_models:
        logger.info(f"Using user-selected model: {user_selected_model}")
        return user_selected_model
    
    # Otherwise, use the default for their tier
    default_model = get_default_model_for_tier(user_tier)
    
    # Verify the default is in their allowed models
    if default_model in allowed_models:
        logger.info(f"Using tier default model: {default_model}")
        return default_model
    
    # If even the default isn't allowed (shouldn't happen), use first allowed model
    if allowed_models:
        logger.warning(f"Default model {default_model} not in allowed models, using first allowed: {allowed_models[0]}")
        return allowed_models[0]
    
    # Last resort fallback
    logger.error(f"No allowed models found for user, falling back to: {FALLBACK_MODEL}")
    return FALLBACK_MODEL