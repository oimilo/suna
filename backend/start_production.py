#!/usr/bin/env python3
"""
Production startup script that checks environment before starting the API
"""
import os
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_required_env_vars():
    """Check if all required environment variables are set"""
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "JWT_SECRET_KEY",
    ]
    
    # Check for Redis configuration
    has_redis = os.getenv("REDIS_URL") or os.getenv("REDIS_HOST")
    if not has_redis:
        logger.error("Either REDIS_URL or REDIS_HOST must be set")
        return False
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    return True

def check_optional_services():
    """Log status of optional services"""
    optional_services = {
        "Daytona": ["DAYTONA_API_KEY", "DAYTONA_SERVER_URL"],
        "Tavily": ["TAVILY_API_KEY"],
        "RapidAPI": ["RAPID_API_KEY"],
        "Firecrawl": ["FIRECRAWL_API_KEY"],
        "Stripe": ["STRIPE_SECRET_KEY"],
        "Langfuse": ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"],
    }
    
    logger.info("Optional services status:")
    for service, vars in optional_services.items():
        has_all = all(os.getenv(var) for var in vars)
        status = "✓ Configured" if has_all else "✗ Not configured"
        logger.info(f"  {service}: {status}")

if __name__ == "__main__":
    logger.info("Starting Suna backend in production mode...")
    
    # Check environment
    if not check_required_env_vars():
        logger.error("Environment check failed. Exiting.")
        sys.exit(1)
    
    check_optional_services()
    
    # Import and start the API
    logger.info("Environment check passed. Starting API...")
    import api
    import uvicorn
    
    # Get port from environment or default
    port = int(os.getenv("PORT", "8080"))
    
    uvicorn.run(
        api.app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )