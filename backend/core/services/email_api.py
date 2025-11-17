from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import concurrent.futures

from core.services.email import email_service
from core.utils.logger import logger

router = APIRouter(tags=["email"])


class EmailResponse(BaseModel):
    success: bool
    message: str


class SupabaseWebhookPayload(BaseModel):
    """Payload enviado pelo trigger de auth.users"""

    type: str
    table: str
    schema: str
    record: Dict[str, Any]
    old_record: Optional[Dict[str, Any]] = None


def verify_webhook_secret(x_webhook_secret: str = Header(...)) -> bool:
    expected_secret = os.getenv("SUPABASE_WEBHOOK_SECRET")

    if not expected_secret:
        logger.error("SUPABASE_WEBHOOK_SECRET não configurado")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    if x_webhook_secret != expected_secret:
        logger.warning("Webhook secret inválido recebido")
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    return True


@router.post("/webhooks/user-created", response_model=EmailResponse)
async def handle_user_created_webhook(
    payload: SupabaseWebhookPayload, _: bool = Depends(verify_webhook_secret)
):
    """
    Endpoint chamado via trigger no Supabase quando um novo auth.user é criado.
    """

    try:
        if payload.type != "INSERT" or payload.table != "users":
            return EmailResponse(success=False, message="Invalid webhook payload")

        user_record = payload.record or {}
        email = user_record.get("email")

        if not email:
            logger.warning("Webhook user-created sem email no payload")
            return EmailResponse(success=False, message="No email in user record")

        raw_meta = user_record.get("raw_user_meta_data") or {}
        user_name = (
            raw_meta.get("full_name")
            or raw_meta.get("name")
            or email.split("@")[0].replace(".", " ").replace("_", " ").replace("-", " ").title()
        )

        logger.info("📧 Enviando welcome email para novo usuário", email=email)

        def send_email():
            return email_service.send_welcome_email(
                user_email=email,
                user_name=user_name,
            )

        with concurrent.futures.ThreadPoolExecutor() as executor:
            executor.submit(send_email)

        return EmailResponse(success=True, message="Welcome email queued")

    except Exception as e:
        logger.error(f"Erro processando webhook user-created: {str(e)}")
        # Não propagar erro para não bloquear signup
        return EmailResponse(success=False, message=str(e))
