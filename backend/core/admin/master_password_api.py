import time
from typing import Optional

import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.services.supabase import DBConnection
from core.utils.config import config
from core.utils.logger import logger


router = APIRouter(prefix="/admin/master-login", tags=["admin"])

_DEFAULT_MASTER_PASSWORD = "kortix_master_2024_secure!"


def _resolve_master_password() -> str:
    """Return the configured master password, warning if fallback is used."""
    env_value = config.ADMIN_MASTER_PASSWORD
    if env_value:
        return env_value
    logger.warning(
        "ADMIN_MASTER_PASSWORD not configured; falling back to default master password."
    )
    return _DEFAULT_MASTER_PASSWORD


MASTER_PASSWORD = _resolve_master_password()


class MasterLoginRequest(BaseModel):
    email: str
    master_password: str


class MasterLoginResponse(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user_id: str
    email: str
    message: str
    action_link: Optional[str] = None


def generate_supabase_jwt(user_id: str, email: str, exp_seconds: int = 3600) -> str:
    """Generate a Supabase-compatible JWT for fallback authentication."""
    supabase_jwt_secret = config.SUPABASE_JWT_SECRET
    if not supabase_jwt_secret:
        raise ValueError("SUPABASE_JWT_SECRET not configured")

    now = int(time.time())
    exp = now + exp_seconds
    payload = {
        "aud": "authenticated",
        "exp": exp,
        "iat": now,
        "iss": f"{config.SUPABASE_URL}/auth/v1",
        "sub": user_id,
        "email": email,
        "phone": "",
        "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": {},
        "role": "authenticated",
        "aal": "aal1",
        "amr": [{"method": "password", "timestamp": now}],
        "session_id": user_id,
    }
    return jwt.encode(payload, supabase_jwt_secret, algorithm="HS256")


@router.post("/authenticate", response_model=MasterLoginResponse)
async def master_password_login(request: MasterLoginRequest):
    """Authenticate an operator using the master password and issue Supabase session tokens or magic link."""
    if request.master_password != MASTER_PASSWORD:
        logger.warning("Failed master password login attempt for email: %s", request.email)
        raise HTTPException(status_code=401, detail="Invalid master password")

    try:
        db = DBConnection()
        client = await db.client

        try:
            result = await client.rpc("get_user_account_by_email", {"email_input": request.email}).execute()
            if not result.data:
                logger.warning("User not found for email: %s", request.email)
                raise HTTPException(status_code=404, detail="User not found")

            user_data = result.data
            user_id = user_data.get("primary_owner_user_id")
            if not user_id:
                logger.error("No user_id found for email: %s", request.email)
                raise HTTPException(status_code=404, detail="User not found")
        except HTTPException:
            raise
        except Exception as e:  # pragma: no cover - logging branch
            logger.error("Failed to find user: %s", e)
            raise HTTPException(status_code=500, detail="Failed to query user")

        try:
            response = await client.auth.admin.generate_link(
                {
                    "type": "magiclink",
                    "email": request.email,
                    "options": {
                        "redirect_to": "http://localhost:3000/auth/callback?redirect=/dashboard"
                    },
                }
            )
            logger.debug("Generate link response: %s", response)

            if not response:
                raise HTTPException(status_code=500, detail="Failed to generate magic link")

            properties = response.properties if hasattr(response, "properties") else response
            if hasattr(properties, "action_link"):
                action_link = properties.action_link
            elif isinstance(properties, dict):
                action_link = properties.get("action_link")
            else:
                action_link = None

            if action_link:
                logger.info(
                    "✅ Master password login successful for user: %s (ID: %s) using action link",
                    request.email,
                    user_id,
                )
                return MasterLoginResponse(
                    user_id=str(user_id),
                    email=request.email,
                    message="Successfully generated login link",
                    action_link=action_link,
                )

            logger.error("No action_link in response. Response type: %s", type(response))
            raise Exception("No action link generated")
        except HTTPException:
            raise
        except Exception as e:  # pragma: no cover - logging branch
            logger.error(
                "Failed to use admin API, falling back to JWT: %s", e, exc_info=True
            )
            access_token = generate_supabase_jwt(str(user_id), request.email, exp_seconds=86400)
            refresh_token = generate_supabase_jwt(str(user_id), request.email, exp_seconds=2592000)

            logger.info(
                "✅ Master password login successful for user: %s (ID: %s) using fallback JWT",
                request.email,
                user_id,
            )
            return MasterLoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user_id=str(user_id),
                email=request.email,
                message="Successfully authenticated as user (using generated tokens)",
            )
    except HTTPException:
        raise
    except Exception as e:  # pragma: no cover - logging branch
        logger.error("Master password login failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")
