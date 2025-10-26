from datetime import datetime, timezone
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException

from core.auth import require_admin
from core.services.supabase import DBConnection
from core.utils.logger import logger


router = APIRouter(prefix="/admin", tags=["admin-management"])


async def _get_user_email(client, user_id: str) -> str:
    """Resolve a user email using the Supabase RPC, falling back to auth.users when needed."""
    try:
        result = await client.rpc("get_user_email", {"user_id": user_id}).execute()
        if result.data:
            return result.data
    except Exception as exc:  # pragma: no cover - logging branch
        logger.warning("get_user_email RPC failed for %s: %s", user_id, exc)

    try:
        user_resp = await client.auth.admin.get_user_by_id(user_id)
        if getattr(user_resp, "user", None) and user_resp.user.email:
            return user_resp.user.email
    except Exception as exc:  # pragma: no cover - logging branch
        logger.error("auth.admin.get_user_by_id failed for %s: %s", user_id, exc)

    return ""


@router.get("/admins")
async def list_admin_users(admin: Dict[str, Any] = Depends(require_admin)):
    """Return all administrative users registered in admin_users."""
    db = DBConnection()
    client = await db.client

    try:
        response = await client.from_("admin_users").select("*").eq("is_active", True).order("created_at", desc=True).execute()
    except Exception as exc:
        logger.error("Failed to fetch admin users: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch admin users") from exc

    admins: List[Dict[str, Any]] = []
    for row in response.data or []:
        user_id = row.get("user_id")
        email = ""
        if user_id:
            email = await _get_user_email(client, user_id)

        admins.append(
            {
                "id": row.get("id"),
                "user_id": user_id,
                "email": email,
                "role": row.get("role", "viewer"),
                "permissions": row.get("metadata", {}).get("permissions", []) if isinstance(row.get("metadata"), dict) else [],
                "created_at": row.get("created_at"),
                "last_access": None,
            }
        )

    stats = {
        "total": len(admins),
        "super_admins": sum(1 for admin in admins if admin["role"] == "super_admin"),
        "admins": sum(1 for admin in admins if admin["role"] == "admin"),
        "support": sum(1 for admin in admins if admin["role"] == "support"),
    }

    return {
        "admins": admins,
        "stats": stats,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
