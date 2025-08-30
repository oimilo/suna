"""
Pydantic models for admin system.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum
from uuid import UUID

class AdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SUPPORT = "support"
    VIEWER = "viewer"

class ActionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    EXPORT = "export"
    SYSTEM = "system"

class SystemStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"

# Request Models
class CreateAdminRequest(BaseModel):
    user_id: str
    role: AdminRole
    metadata: Optional[Dict[str, Any]] = {}

class UpdateAdminRequest(BaseModel):
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class UpdateUserCreditsRequest(BaseModel):
    user_id: str
    credits: float = Field(..., ge=0, description="Quantidade de créditos")
    operation: str = Field(default="set", pattern="^(set|add|subtract)$")
    reason: str = Field(..., min_length=1, max_length=500)

class UpdateUserPlanRequest(BaseModel):
    user_id: str
    price_id: str
    months: int = Field(default=1, ge=1, le=12)
    reason: Optional[str] = None

class SuspendUserRequest(BaseModel):
    user_id: str
    reason: str = Field(..., min_length=1, max_length=500)
    suspend_until: Optional[datetime] = None

# Response Models
class AdminUserResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: AdminRole
    created_at: datetime
    created_by: Optional[UUID]
    updated_at: datetime
    is_active: bool
    metadata: Dict[str, Any]
    email: Optional[str] = None
    name: Optional[str] = None

class AdminLogResponse(BaseModel):
    id: UUID
    admin_id: UUID
    action: str
    action_type: ActionType
    target_type: Optional[str]
    target_id: Optional[UUID]
    target_user_id: Optional[UUID]
    metadata: Dict[str, Any]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    success: bool
    error_message: Optional[str]

class UserStatsResponse(BaseModel):
    user_id: UUID
    email: str
    created_at: datetime
    last_active: Optional[datetime]
    plan: Optional[str]
    subscription_status: Optional[str]
    total_messages: int
    total_tokens: int
    total_credits: float
    total_sessions: int
    avg_session_duration: float  # in seconds
    daily_credits_remaining: Optional[float]
    monthly_credits_remaining: Optional[float]

class SystemMetricsResponse(BaseModel):
    timestamp: datetime
    total_users: int
    active_users_today: int
    active_users_week: int
    active_users_month: int
    total_messages: int
    total_tokens: int
    total_revenue: float
    conversion_rate: float
    churn_rate: float
    avg_session_duration: float
    error_rate: float

class DashboardStatsResponse(BaseModel):
    """Main dashboard statistics."""
    users: Dict[str, Any] = Field(default_factory=dict)
    usage: Dict[str, Any] = Field(default_factory=dict)
    revenue: Dict[str, Any] = Field(default_factory=dict)
    system: Dict[str, Any] = Field(default_factory=dict)
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)

class UserListResponse(BaseModel):
    users: List[UserStatsResponse]
    total: int
    page: int
    page_size: int
    has_more: bool

class ChartDataPoint(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None

class ChartDataResponse(BaseModel):
    chart_type: str  # 'line', 'bar', 'pie', etc
    data: List[ChartDataPoint]
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SystemHealthResponse(BaseModel):
    service_name: str
    status: SystemStatus
    response_time_ms: Optional[int]
    error_rate: Optional[float]
    cpu_usage: Optional[float]
    memory_usage: Optional[float]
    active_connections: Optional[int]
    last_check: datetime
    metadata: Dict[str, Any]

class BillingStatsResponse(BaseModel):
    mrr: float  # Monthly Recurring Revenue
    arr: float  # Annual Recurring Revenue
    total_revenue: float
    active_subscriptions: int
    trial_users: int
    paying_users: int
    churn_rate: float
    average_revenue_per_user: float
    lifetime_value: float

class AdminActionRequest(BaseModel):
    """Generic admin action request."""
    action: str
    target_type: str
    target_id: str
    metadata: Optional[Dict[str, Any]] = {}
    reason: Optional[str] = None

class AnalyticsQueryRequest(BaseModel):
    """Request for analytics queries."""
    metric_type: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    group_by: Optional[str] = None  # 'hour', 'day', 'week', 'month'
    filters: Optional[Dict[str, Any]] = {}

# Pagination
class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")

# Search/Filter
class UserSearchParams(BaseModel):
    query: Optional[str] = None
    status: Optional[str] = None  # 'active', 'suspended', 'trial', 'premium'
    plan: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    last_active_after: Optional[datetime] = None
    min_messages: Optional[int] = None
    max_messages: Optional[int] = None

# Export
class ExportRequest(BaseModel):
    export_type: str  # 'users', 'analytics', 'logs', 'billing'
    format: str = Field(default="csv", pattern="^(csv|json|xlsx)$")
    filters: Optional[Dict[str, Any]] = {}
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ExportResponse(BaseModel):
    export_id: str
    status: str  # 'pending', 'processing', 'completed', 'failed'
    download_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)