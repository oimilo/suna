from collections import defaultdict
from datetime import datetime, timedelta, timezone
from statistics import mean
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.auth import require_admin
from core.services.supabase import DBConnection
from core.utils.logger import logger


router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


def _to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _parse_timestamp(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        return datetime.fromisoformat(value)
    except Exception:  # pragma: no cover - parsing guard
        logger.debug("Failed to parse timestamp: %s", value)
        return None


async def _count_rows(client, table: str, *, schema: Optional[str] = None, **filters) -> int:
    builder = client.schema(schema).from_(table) if schema else client.from_(table)
    for column, op_value in filters.items():
        operator, value = op_value
        builder = getattr(builder, operator)(column, value)
    response = await builder.select("*", count="exact", head=True).execute()
    return response.count or 0


@router.get("/dashboard")
async def get_dashboard(admin: Dict[str, Any] = Depends(require_admin)):
    """Aggregate key metrics for the admin dashboard."""
    db = DBConnection()
    client = await db.client

    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    try:
        total_accounts = await _count_rows(client, "accounts", schema="basejump")
        accounts_today = await _count_rows(
            client,
            "accounts",
            schema="basejump",
            created_at=("gte", start_of_day.isoformat()),
        )
        accounts_week = await _count_rows(
            client,
            "accounts",
            schema="basejump",
            created_at=("gte", week_ago.isoformat()),
        )

        total_threads = await _count_rows(client, "threads")
        total_agents = await _count_rows(client, "agents")
        total_messages = await _count_rows(client, "messages")
        messages_today = await _count_rows(
            client, "messages", created_at=("gte", start_of_day.isoformat())
        )

        avg_messages_per_user = (
            total_messages / total_accounts if total_accounts else 0
        )

        total_agent_runs = await _count_rows(client, "agent_runs")
        failed_agent_runs = await _count_rows(
            client, "agent_runs", status=("eq", "failed")
        )
        error_rate = (
            (failed_agent_runs / total_agent_runs) * 100 if total_agent_runs else 0
        )

        recent_activity_resp = await client.from_("credit_ledger").select(
            "id, description, amount, created_at, type"
        ).order("created_at", desc=True).limit(10).execute()

        recent_activity = [
            {
                "id": item.get("id"),
                "action": item.get("description") or item.get("type"),
                "amount": float(item.get("amount") or 0),
                "created_at": item.get("created_at"),
            }
            for item in recent_activity_resp.data or []
        ]

        return {
            "users": {
                "total": total_accounts,
                "active_today": accounts_today,
                "active_week": accounts_week,
            },
            "usage": {
                "messages_today": messages_today,
                "messages_total": total_messages,
                "avg_messages_per_user": round(avg_messages_per_user, 2),
            },
            "system": {
                "agent_runs_total": total_agent_runs,
                "agent_runs_failed": failed_agent_runs,
                "error_rate": round(error_rate, 2),
            },
            "recent_activity": recent_activity,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to assemble analytics dashboard: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load dashboard metrics") from exc


@router.get("/charts/user-growth")
async def user_growth_chart(
    days: int = Query(30, ge=1, le=365),
    admin: Dict[str, Any] = Depends(require_admin),
):
    db = DBConnection()
    client = await db.client

    since = datetime.now(timezone.utc) - timedelta(days=days)
    try:
        response = await client.schema("basejump").from_("accounts").select(
            "id, created_at"
        ).gte("created_at", since.isoformat()).execute()
    except Exception as exc:
        logger.error("Failed to fetch account data for user growth: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load user growth data") from exc

    buckets: Dict[str, int] = defaultdict(int)
    for row in response.data or []:
        created_at = _parse_timestamp(row.get("created_at"))
        if not created_at:
            continue
        day_key = _to_utc(created_at).date().isoformat()
        buckets[day_key] += 1

    data = [
        {"timestamp": day, "value": buckets[day]}
        for day in sorted(buckets.keys())
    ]

    return {"data": data}


@router.get("/charts/usage")
async def usage_chart(
    metric: str = Query("messages_sent"),
    days: int = Query(30, ge=1, le=365),
    admin: Dict[str, Any] = Depends(require_admin),
):
    if metric != "messages_sent":
        raise HTTPException(status_code=400, detail="Unsupported usage metric")

    db = DBConnection()
    client = await db.client

    since = datetime.now(timezone.utc) - timedelta(days=days)
    try:
        response = await client.from_("messages").select("created_at").gte(
            "created_at", since.isoformat()
        ).execute()
    except Exception as exc:
        logger.error("Failed to fetch messages for usage chart: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load usage data") from exc

    buckets: Dict[str, int] = defaultdict(int)
    for row in response.data or []:
        created_at = _parse_timestamp(row.get("created_at"))
        if not created_at:
            continue
        hour_key = _to_utc(created_at).replace(minute=0, second=0, microsecond=0)
        buckets[hour_key.isoformat()] += 1

    data = [
        {"timestamp": key, "value": buckets[key]}
        for key in sorted(buckets.keys())
    ]

    return {"data": data}


@router.get("/billing")
async def billing_metrics(admin: Dict[str, Any] = Depends(require_admin)):
    db = DBConnection()
    client = await db.client

    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    try:
        purchases_resp = await client.from_("credit_ledger").select(
            "amount, created_at, type"
        ).eq("type", "purchase").gte("created_at", month_ago.isoformat()).execute()

        subscriptions_resp = await client.schema("basejump").from_("billing_subscriptions").select(
            "status, price, created"
        ).eq("status", "active").execute()
    except Exception as exc:
        logger.error("Failed to fetch billing metrics: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load billing metrics") from exc

    total_revenue = sum(float(item.get("amount") or 0) for item in purchases_resp.data or [])
    active_subscriptions = subscriptions_resp.data or []
    mrr = sum(float(item.get("price") or 0) for item in active_subscriptions)
    arr = mrr * 12

    total_accounts = await _count_rows(client, "accounts", schema="basejump")
    paying_accounts = len(active_subscriptions)
    conversion_rate = (paying_accounts / total_accounts * 100) if total_accounts else 0

    churn_rate = 0.0  # Placeholder until churn logic is ported
    lifetime_value = (total_revenue / paying_accounts) if paying_accounts else 0

    return {
        "mrr": round(mrr, 2),
        "arr": round(arr, 2),
        "total_revenue": round(total_revenue, 2),
        "average_revenue_per_user": round(total_revenue / total_accounts, 2) if total_accounts else 0,
        "conversion_rate": round(conversion_rate, 2),
        "churn_rate": round(churn_rate, 2),
        "lifetime_value": round(lifetime_value, 2),
    }


@router.get("/system-health")
async def system_health(admin: Dict[str, Any] = Depends(require_admin)):
    db = DBConnection()
    client = await db.client

    services: List[Dict[str, Any]] = []

    def make_record(
        service_name: str,
        status: str,
        response_time_ms: Optional[float],
        error_rate: Optional[float] = None,
        cpu_usage: Optional[float] = None,
        memory_usage: Optional[float] = None,
        active_connections: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return {
            "service_name": service_name,
            "status": status,
            "response_time_ms": response_time_ms,
            "error_rate": error_rate,
            "cpu_usage": cpu_usage,
            "memory_usage": memory_usage,
            "active_connections": active_connections,
            "last_check": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
        }

    # Database health check
    try:
        start = datetime.now()
        await client.from_("threads").select("thread_id").limit(1).execute()
        db_latency = (datetime.now() - start).total_seconds() * 1000
        services.append(make_record("Postgres", "healthy", round(db_latency, 2)))
    except Exception as exc:
        logger.error("Database health check failed: %s", exc, exc_info=True)
        services.append(make_record("Postgres", "degraded", None, metadata={"error": str(exc)}))

    # Messages throughput snapshot
    try:
        start = datetime.now()
        count = await _count_rows(client, "messages")
        latency = (datetime.now() - start).total_seconds() * 1000
        services.append(
            make_record(
                "Message Pipeline",
                "healthy",
                round(latency, 2),
                metadata={"messages_total": count},
            )
        )
    except Exception as exc:
        services.append(make_record("Message Pipeline", "degraded", None, metadata={"error": str(exc)}))

    # Agent runs snapshot
    try:
        start = datetime.now()
        total_runs = await _count_rows(client, "agent_runs")
        failed_runs = await _count_rows(client, "agent_runs", status=("eq", "failed"))
        latency = (datetime.now() - start).total_seconds() * 1000
        error_rate = (failed_runs / total_runs * 100) if total_runs else 0
        services.append(
            make_record(
                "Agent Runtime",
                "healthy" if error_rate < 5 else "degraded",
                round(latency, 2),
                error_rate=round(error_rate, 2),
                metadata={"agent_runs_total": total_runs, "agent_runs_failed": failed_runs},
            )
        )
    except Exception as exc:
        services.append(make_record("Agent Runtime", "degraded", None, metadata={"error": str(exc)}))

    return services
