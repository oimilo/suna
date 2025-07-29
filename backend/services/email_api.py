from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import asyncio
from services.email import email_service
from utils.logger import logger
from utils.auth_utils import verify_admin_api_key

router = APIRouter()

class SendWelcomeEmailRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class SendTeamInviteEmailRequest(BaseModel):
    invitee_email: EmailStr
    invitee_name: Optional[str] = None
    team_name: str
    inviter_name: str
    invite_link: str

class EmailResponse(BaseModel):
    success: bool
    message: str

@router.post("/send-welcome-email", response_model=EmailResponse)
async def send_welcome_email(
    request: SendWelcomeEmailRequest,
    _: bool = Depends(verify_admin_api_key)
):
    try:
        
        def send_email():
            return email_service.send_welcome_email(
                user_email=request.email,
                user_name=request.name
            )
        
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(send_email)
        
        return EmailResponse(
            success=True,
            message="Welcome email sent"
        )
            
    except Exception as e:
        logger.error(f"Error sending welcome email for {request.email}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while sending welcome email"
        )

@router.post("/send-team-invite-email", response_model=EmailResponse)
async def send_team_invite_email(
    request: SendTeamInviteEmailRequest,
    _: bool = Depends(verify_admin_api_key)
):
    try:
        def send_email():
            return email_service.send_team_invite_email(
                invitee_email=request.invitee_email,
                invitee_name=request.invitee_name,
                team_name=request.team_name,
                inviter_name=request.inviter_name,
                invite_link=request.invite_link
            )
        
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(send_email)
        
        return EmailResponse(
            success=True,
            message="Team invite email sent"
        )
            
    except Exception as e:
        logger.error(f"Error sending team invite email for {request.invitee_email}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while sending team invite email"
        ) 
