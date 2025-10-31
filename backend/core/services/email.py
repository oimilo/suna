import logging
import os
from typing import Optional

import mailtrap as mt

logger = logging.getLogger(__name__)

DEFAULT_LOGO_URL = "https://i.postimg.cc/WdNtRx5Z/kortix-suna-logo.png"
DEFAULT_APP_NAME = "Suna"
DEFAULT_COMPANY_NAME = "Kortix"
DEFAULT_APP_URL = "https://www.suna.so/"
DEFAULT_DISCORD_URL = "https://discord.com/invite/FjD644cfcs"
DEFAULT_CALENDAR_URL = "https://cal.com/team/kortix/enterprise-demo"
DEFAULT_WELCOME_FORM_URL = (
    "https://docs.google.com/forms/d/e/1FAIpQLSef1EHuqmIh_iQz-kwhjnzSC3Ml-V_5wIySDpMoMU9W_j24JQ/viewform"
)
DEFAULT_DISCOUNT_CODE = "WELCOME15"


class EmailService:
    """Transactional email service powered by Mailtrap."""

    def __init__(self) -> None:
        self.api_token = os.getenv("MAILTRAP_API_TOKEN")
        self.sender_email = os.getenv("MAILTRAP_SENDER_EMAIL", "dom@kortix.ai")
        self.sender_name = os.getenv("MAILTRAP_SENDER_NAME", "Suna Team")

        self.app_name = os.getenv("MAILTRAP_APP_NAME", DEFAULT_APP_NAME)
        self.company_name = os.getenv("MAILTRAP_COMPANY_NAME", DEFAULT_COMPANY_NAME)
        self.app_url = os.getenv("MAILTRAP_APP_URL", DEFAULT_APP_URL)
        self.logo_url = os.getenv("MAILTRAP_BRANDING_LOGO_URL", DEFAULT_LOGO_URL)
        self.discord_url = os.getenv("MAILTRAP_DISCORD_URL", DEFAULT_DISCORD_URL)
        self.calendar_url = os.getenv("MAILTRAP_CALENDAR_URL", DEFAULT_CALENDAR_URL)
        self.welcome_form_url = os.getenv("MAILTRAP_WELCOME_FORM_URL", DEFAULT_WELCOME_FORM_URL)
        self.discount_code = os.getenv("MAILTRAP_WELCOME_DISCOUNT_CODE", DEFAULT_DISCOUNT_CODE)
        
        if not self.api_token:
            logger.warning("MAILTRAP_API_TOKEN not found in environment variables")
            self.client = None
        else:
            self.client = mt.MailtrapClient(token=self.api_token)
    
    @property
    def is_configured(self) -> bool:
        return self.client is not None

    def send_welcome_email(self, user_email: str, user_name: Optional[str] = None) -> bool:
        if not self.is_configured:
            logger.error("Cannot send email: MAILTRAP_API_TOKEN not configured")
            return False
    
        if not user_name:
            user_name = user_email.split("@")[0].title()
        
        subject = f"🎉 Welcome to {self.app_name} — Let's Get Started "
        html_content = self._render_welcome_email_html(user_name)
        text_content = self._render_welcome_email_text(user_name)
        
        return self._send_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            category="welcome",
        )

    def send_team_invite_email(
        self,
        invitee_email: str,
        invitee_name: Optional[str],
        team_name: str,
        inviter_name: str,
        invite_link: str,
    ) -> bool:
        if not self.is_configured:
            logger.error("Cannot send email: MAILTRAP_API_TOKEN not configured")
            return False

        if not invitee_name:
            invitee_name = invitee_email.split("@")[0].title()

        subject = f"🤝 You're invited to join {team_name} on {self.app_name}"
        html_content = self._render_team_invite_html(invitee_name, team_name, inviter_name, invite_link)
        text_content = self._render_team_invite_text(invitee_name, team_name, inviter_name, invite_link)

        return self._send_email(
            to_email=invitee_email,
            to_name=invitee_name,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            category="team_invite",
        )
    
    def _send_email(
        self, 
        to_email: str, 
        to_name: str, 
        subject: str, 
        html_content: str, 
        text_content: str,
        category: str,
    ) -> bool:
        if not self.client:
            logger.error("Cannot send email: Mailtrap client is not configured")
            return False

        try:
            mail = mt.Mail(
                sender=mt.Address(email=self.sender_email, name=self.sender_name),
                to=[mt.Address(email=to_email, name=to_name)],
                subject=subject,
                text=text_content,
                html=html_content,
                category=category,
            )
            
            response = self.client.send(mail)
            logger.debug(
                "Mailtrap email sent",
                extra={"recipient": to_email, "category": category, "response": response},
            )
            return True
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error(f"Error sending email to {to_email}: {exc}")
            return False
    
    def _render_welcome_email_html(self, user_name: str) -> str:
        discount_block = (
            f"<p>🎁 Use code <strong>{self.discount_code}</strong> at checkout.</p>"
            if self.discount_code
            else ""
        )

        return f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Welcome to {self.company_name} {self.app_name}</title>
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
  <div class=\"container\">
    <div class=\"logo-container\">
      <img src=\"{self.logo_url}\" alt=\"{self.company_name} {self.app_name} Logo\" class=\"logo\">
    </div>
    <h1>Welcome to {self.company_name} {self.app_name}!</h1>

    <p>Hi {user_name},</p>

    <p><em><strong>Welcome to {self.company_name} {self.app_name} — we're excited to have you on board!</strong></em></p>

    <p>To get started, we'd like to get to know you better: fill out this short <a href=\"{self.welcome_form_url}\">form</a>!</p>

    {discount_block}

    <p>Let us know if you need help getting started or have questions — we're always here, and join our <a href=\"{self.discord_url}\">Discord community</a>.</p>

    <p><strong>For your business:</strong> if you want to automate manual and ordinary tasks for your company, book a call with us <a href=\"{self.calendar_url}\">here</a></p>

    <p>Thanks again, and welcome to the {self.app_name} community <span class=\"emoji\">🌞</span></p>

    <p>— The {self.sender_name}</p>

    <a href=\"{self.app_url}\" class=\"button\">Go to the platform</a>
  </div>
</body>
</html>"""
    
    def _render_welcome_email_text(self, user_name: str) -> str:
        discount_line = (
            f"To celebrate your arrival, here's a discount for your first month to get more usage:\n🎁 Use code {self.discount_code} at checkout.\n\n"
            if self.discount_code
            else ""
        )

        return f"""Hi {user_name},

Welcome to {self.app_name} — we're excited to have you on board!

To get started, we'd like to get to know you better: fill out this short form!
{self.welcome_form_url}

{discount_line}Let us know if you need help getting started or have questions — we're always here, and join our Discord community: {self.discord_url}

For your business: if you want to automate manual and ordinary tasks for your company, book a call with us here: {self.calendar_url}

Thanks again, and welcome to the {self.app_name} community 🌞

— The {self.sender_name}

Go to the platform: {self.app_url}

---
© 2024 {self.app_name}. All rights reserved.
You received this email because you signed up for a {self.app_name} account."""

    def _render_team_invite_html(
        self, invitee_name: str, team_name: str, inviter_name: str, invite_link: str
    ) -> str:
        return f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Team Invitation - {self.app_name}</title>
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
  <div class=\"container\">
    <div class=\"logo-container\">
      <img src=\"{self.logo_url}\" alt=\"{self.company_name} {self.app_name} Logo\" class=\"logo\">
    </div>
    <h1>You're invited to join a team!</h1>

    <p>Hi {invitee_name},</p>

    <p><strong>{inviter_name}</strong> has invited you to join their team on {self.app_name}.</p>

    <div class=\"team-info\">
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

    <a href=\"{invite_link}\" class=\"button\">Accept Invitation</a>

    <p style=\"margin-top: 40px; font-size: 14px; color: #666;\">
      If you're not expecting this invitation or don't want to join, you can safely ignore this email.
    </p>

    <p style=\"margin-top: 20px; font-size: 14px; color: #666;\">
      — The {self.sender_name}
    </p>
  </div>
</body>
</html>"""

    def _render_team_invite_text(
        self, invitee_name: str, team_name: str, inviter_name: str, invite_link: str
    ) -> str:
        return f"""Hi {invitee_name},

{inviter_name} has invited you to join their team on {self.app_name}.

Team: {team_name}
Invited by: {inviter_name}

By joining this team, you'll be able to:
- Collaborate on shared projects and agents
- Access team resources and tools
- Share knowledge and insights with team members

Accept the invitation here: {invite_link}

If you're not expecting this invitation or don't want to join, you can safely ignore this email.

— The {self.sender_name}

---
© 2024 {self.app_name}. All rights reserved."""


email_service = EmailService() 
