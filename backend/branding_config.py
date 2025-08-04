"""
Centralized branding configuration for backend
This allows easy white-labeling of the application
"""
import os

class BrandingConfig:
    # App branding
    APP_NAME = os.getenv('APP_NAME', 'Prophet')
    APP_DESCRIPTION = os.getenv('APP_DESCRIPTION', 'AI assistant that helps you get real work done')
    APP_URL = os.getenv('APP_URL', 'https://prophet.build')
    
    # Company branding
    COMPANY_NAME = os.getenv('COMPANY_NAME', 'Milo')
    TEAM_NAME = os.getenv('TEAM_NAME', 'Milo Team')
    COMPANY_URL = os.getenv('COMPANY_URL', 'https://oimilo.com')
    
    # Contact information
    SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', 'support@milo.com')
    CONTACT_EMAIL = os.getenv('CONTACT_EMAIL', 'contato@oimilo.com')
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'noreply@milo.com')
    SENDER_NAME = os.getenv('SENDER_NAME', 'Prophet Team')
    
    # Social links
    GITHUB_URL = os.getenv('GITHUB_URL', 'https://github.com/milo/prophet')
    DISCORD_URL = os.getenv('DISCORD_URL', 'https://discord.gg/milo')
    
    # Calendar/Demo booking
    CALENDAR_LINK = os.getenv('CALENDAR_LINK', 'team/milo/demo')
    
    # Forms
    WELCOME_FORM_URL = os.getenv('WELCOME_FORM_URL', 'https://docs.google.com/forms/d/e/1FAIpQLSef1EHuqmIh_iQz-kwhjnzSC3Ml-V_5wIySDpMoMU9W_j24JQ/viewform')
    
    # OpenRouter configuration
    OR_SITE_URL = os.getenv('OR_SITE_URL', COMPANY_URL)
    OR_APP_NAME = os.getenv('OR_APP_NAME', f'{COMPANY_NAME} AI')
    
    # Additional URLs for CORS and other configs
    STAGING_URL = os.getenv('STAGING_URL', 'https://staging.prophet.build')

# Create singleton instance
branding = BrandingConfig()