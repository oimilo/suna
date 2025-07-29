"""
Centralized branding configuration for backend
This allows easy white-labeling of the application
"""
import os

class BrandingConfig:
    # App branding
    APP_NAME = os.getenv('APP_NAME', 'Prophet')
    APP_DESCRIPTION = os.getenv('APP_DESCRIPTION', 'AI assistant that helps you get real work done')
    APP_URL = os.getenv('APP_URL', 'https://suna.so')
    
    # Company branding
    COMPANY_NAME = os.getenv('COMPANY_NAME', 'Kortix')
    TEAM_NAME = os.getenv('TEAM_NAME', 'Kortix Team')
    COMPANY_URL = os.getenv('COMPANY_URL', 'https://kortix.ai')
    
    # Contact information
    SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', 'support@suna.so')
    CONTACT_EMAIL = os.getenv('CONTACT_EMAIL', 'hey@kortix.ai')
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'dom@kortix.ai')
    SENDER_NAME = os.getenv('SENDER_NAME', 'Suna Team')
    
    # Social links
    GITHUB_URL = os.getenv('GITHUB_URL', 'https://github.com/kortix-ai/suna')
    DISCORD_URL = os.getenv('DISCORD_URL', 'https://discord.com/invite/FjD644cfcs')
    
    # Calendar/Demo booking
    CALENDAR_LINK = os.getenv('CALENDAR_LINK', 'team/kortix/enterprise-demo')
    
    # Forms
    WELCOME_FORM_URL = os.getenv('WELCOME_FORM_URL', 'https://docs.google.com/forms/d/e/1FAIpQLSef1EHuqmIh_iQz-kwhjnzSC3Ml-V_5wIySDpMoMU9W_j24JQ/viewform')
    
    # OpenRouter configuration
    OR_SITE_URL = os.getenv('OR_SITE_URL', COMPANY_URL)
    OR_APP_NAME = os.getenv('OR_APP_NAME', f'{COMPANY_NAME} AI')
    
    # Additional URLs for CORS and other configs
    STAGING_URL = os.getenv('STAGING_URL', 'https://staging.suna.so')

# Create singleton instance
branding = BrandingConfig()