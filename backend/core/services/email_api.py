from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import concurrent.futures

from core.services.email import email_service
from core.utils.logger import logger
from core.utils.auth_utils import verify_admin_api_key

router = APIRouter(tags=["email"])

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
        def send_email() -> bool:
            return email_service.send_welcome_email(
                user_email=request.email,
                user_name=request.name,
            )

        with concurrent.futures.ThreadPoolExecutor() as executor:
            success = executor.submit(send_email).result()

        if not success:
            logger.error("Failed to send welcome email", extra={"email": request.email})
            raise HTTPException(status_code=500, detail="Failed to send welcome email")

        return EmailResponse(success=True, message="Welcome email sent")

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error sending welcome email for {request.email}: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while sending welcome email",
        )

@router.post("/send-team-invite-email", response_model=EmailResponse)
async def send_team_invite_email(
    request: SendTeamInviteEmailRequest,
    _: bool = Depends(verify_admin_api_key)
):
    try:
        def send_email() -> bool:
            return email_service.send_team_invite_email(
                invitee_email=request.invitee_email,
                invitee_name=request.invitee_name,
                team_name=request.team_name,
                inviter_name=request.inviter_name,
                invite_link=request.invite_link,
            )

        with concurrent.futures.ThreadPoolExecutor() as executor:
            success = executor.submit(send_email).result()

        if not success:
            logger.error(
                "Failed to send team invite email",
                extra={"invitee_email": request.invitee_email, "team": request.team_name},
            )
            raise HTTPException(status_code=500, detail="Failed to send team invite email")

        return EmailResponse(success=True, message="Team invite email sent")

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error sending team invite email for {request.invitee_email}: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while sending team invite email",
        ) 
