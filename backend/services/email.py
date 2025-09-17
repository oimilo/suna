import os
import logging
from typing import Optional
import mailtrap as mt
from utils.config import config
from branding_config import branding

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_token = os.getenv('MAILTRAP_API_TOKEN')
        self.sender_email = os.getenv('MAILTRAP_SENDER_EMAIL', branding.SENDER_EMAIL)
        self.sender_name = os.getenv('MAILTRAP_SENDER_NAME', branding.SENDER_NAME)
        
        if not self.api_token:
            logger.warning("MAILTRAP_API_TOKEN not found in environment variables")
            self.client = None
        else:
            self.client = mt.MailtrapClient(token=self.api_token)
    
    def send_welcome_email(self, user_email: str, user_name: Optional[str] = None) -> bool:
        if not self.client:
            logger.error("Cannot send email: MAILTRAP_API_TOKEN not configured")
            return False
    
        if not user_name:
            user_name = user_email.split('@')[0].title()
        
        subject = f"🎉 Welcome to {branding.APP_NAME} — Let's Get Started "
        html_content = self._get_welcome_email_template(user_name)
        text_content = self._get_welcome_email_text(user_name)
        
        return self._send_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
    
    def send_team_invite_email(
        self, 
        invitee_email: str, 
        invitee_name: Optional[str], 
        team_name: str, 
        inviter_name: str,
        invite_link: str
    ) -> bool:
        if not self.client:
            logger.error("Cannot send email: MAILTRAP_API_TOKEN not configured")
            return False
        
        if not invitee_name:
            invitee_name = invitee_email.split('@')[0].title()
        
        subject = f"🤝 You're invited to join {team_name} on {branding.APP_NAME}"
        html_content = self._get_team_invite_email_template(
            invitee_name, team_name, inviter_name, invite_link
        )
        text_content = self._get_team_invite_email_text(
            invitee_name, team_name, inviter_name, invite_link
        )
        
        return self._send_email(
            to_email=invitee_email,
            to_name=invitee_name,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
    
    def _send_email(
        self, 
        to_email: str, 
        to_name: str, 
        subject: str, 
        html_content: str, 
        text_content: str
    ) -> bool:
        try:
            mail = mt.Mail(
                sender=mt.Address(email=self.sender_email, name=self.sender_name),
                to=[mt.Address(email=to_email, name=to_name)],
                subject=subject,
                text=text_content,
                html=html_content,
                category="welcome"
            )
            
            response = self.client.send(mail)
            
            logger.info(f"Welcome email sent to {to_email}. Response: {response}")
            return True
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False
    
    def _get_welcome_email_template(self, user_name: str) -> str:
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {branding.COMPANY_NAME} {branding.APP_NAME}</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      color: #000000;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }}
    .container {{
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      background-color: #ffffff;
    }}
    .logo-container {{
      text-align: center;
      margin-bottom: 30px;
      padding: 10px 0;
    }}
    .logo {{
      max-width: 100%;
      height: auto;
      max-height: 60px;
      display: inline-block;
    }}
    h1 {{
      font-size: 24px;
      color: #000000;
      margin-bottom: 20px;
    }}
    p {{
      margin-bottom: 16px;
    }}
    a {{
      color: #3366cc;
      text-decoration: none;
    }}
    a:hover {{
      text-decoration: underline;
    }}
    .button {{
      display: inline-block;
      margin-top: 30px;
      background-color: #3B82F6;
      color: white !important;
      padding: 14px 24px;
      text-align: center;
      text-decoration: none;
      font-weight: bold;
      border-radius: 6px;
      border: none;
    }}
    .button:hover {{
      background-color: #2563EB;
      text-decoration: none;
    }}
    .emoji {{
      font-size: 20px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="https://i.postimg.cc/WdNtRx5Z/kortix-suna-logo.png" alt="{branding.COMPANY_NAME} {branding.APP_NAME} Logo" class="logo">
    </div>
    <h1>Welcome to {branding.COMPANY_NAME} {branding.APP_NAME}!</h1>

    <p>Hi {user_name},</p>

    <p><em><strong>Welcome to {branding.COMPANY_NAME} {branding.APP_NAME} — we're excited to have you on board!</strong></em></p>

    <p>To get started, we'd like to get to know you better: fill out this short <a href="{branding.WELCOME_FORM_URL}">form</a>!</p>

    <p>To celebrate your arrival, here's a <strong>15% discount</strong> for your first month to get more usage:</p>

    <p>🎁 Use code <strong>WELCOME15</strong> at checkout.</p>

    <p>Let us know if you need help getting started or have questions — we're always here, and join our <a href="{branding.DISCORD_URL}">Discord community</a>.</p>

    <p><strong>For your business:</strong> if you want to automate manual and ordinary tasks for your company, book a call with us <a href="https://cal.com/{branding.CALENDAR_LINK}">here</a></p>

    <p>Thanks again, and welcome to the {branding.APP_NAME} community <span class="emoji">🌞</span></p>

    <p>— The {branding.SENDER_NAME}</p>

    <a href="{branding.APP_URL}" class="button">Go to the platform</a>
  </div>
</body>
</html>"""
    
    def _get_welcome_email_text(self, user_name: str) -> str:
        return f"""Hi {user_name},

Welcome to {branding.APP_NAME} — we're excited to have you on board!

To get started, we'd like to get to know you better: fill out this short form!
{branding.WELCOME_FORM_URL}

To celebrate your arrival, here's a 15% discount for your first month to get more usage:
🎁 Use code WELCOME15 at checkout.

Let us know if you need help getting started or have questions — we're always here, and join our Discord community: {branding.DISCORD_URL}

For your business: if you want to automate manual and ordinary tasks for your company, book a call with us here: https://cal.com/{branding.CALENDAR_LINK} 

Thanks again, and welcome to the {branding.APP_NAME} community 🌞

— The {branding.SENDER_NAME}

Go to the platform: {branding.APP_URL}

---
© 2024 {branding.APP_NAME}. All rights reserved.
You received this email because you signed up for a {branding.APP_NAME} account."""

    def _get_team_invite_email_template(self, invitee_name: str, team_name: str, inviter_name: str, invite_link: str) -> str:
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - {branding.APP_NAME}</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      color: #000000;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }}
    .container {{
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      background-color: #ffffff;
    }}
    .logo-container {{
      text-align: center;
      margin-bottom: 30px;
      padding: 10px 0;
    }}
    .logo {{
      max-width: 100%;
      height: auto;
      max-height: 60px;
      display: inline-block;
    }}
    h1 {{
      font-size: 24px;
      color: #000000;
      margin-bottom: 20px;
    }}
    p {{
      margin-bottom: 16px;
    }}
    .button {{
      display: inline-block;
      margin-top: 30px;
      background-color: #3B82F6;
      color: white !important;
      padding: 14px 24px;
      text-align: center;
      text-decoration: none;
      font-weight: bold;
      border-radius: 6px;
      border: none;
    }}
    .button:hover {{
      background-color: #2563EB;
      text-decoration: none;
    }}
    .team-info {{
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="https://i.postimg.cc/WdNtRx5Z/kortix-suna-logo.png" alt="{branding.COMPANY_NAME} {branding.APP_NAME} Logo" class="logo">
    </div>
    <h1>You're invited to join a team!</h1>

    <p>Hi {invitee_name},</p>

    <p><strong>{inviter_name}</strong> has invited you to join their team on {branding.APP_NAME}.</p>

    <div class="team-info">
      <p><strong>Team:</strong> {team_name}</p>
      <p><strong>Invited by:</strong> {inviter_name}</p>
    </div>

    <p>By joining this team, you'll be able to:</p>
    <ul>
      <li>Collaborate on shared projects and agents</li>
      <li>Access team resources and tools</li>
      <li>Share knowledge and insights with team members</li>
    </ul>

    <p>Click the button below to accept the invitation and join the team:</p>

    <a href="{invite_link}" class="button">Accept Invitation</a>

    <p style="margin-top: 40px; font-size: 14px; color: #666;">
      If you're not expecting this invitation or don't want to join, you can safely ignore this email.
    </p>

    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      — The {branding.SENDER_NAME}
    </p>
  </div>
</body>
</html>"""
    
    def _get_team_invite_email_text(self, invitee_name: str, team_name: str, inviter_name: str, invite_link: str) -> str:
        return f"""Hi {invitee_name},

{inviter_name} has invited you to join their team on {branding.APP_NAME}.

Team: {team_name}
Invited by: {inviter_name}

By joining this team, you'll be able to:
- Collaborate on shared projects and agents
- Access team resources and tools
- Share knowledge and insights with team members

Accept the invitation here: {invite_link}

If you're not expecting this invitation or don't want to join, you can safely ignore this email.

— The {branding.SENDER_NAME}

---
© 2024 {branding.APP_NAME}. All rights reserved."""

email_service = EmailService() 
