from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from ..models.subscription import SubscriptionPlan, SubscriptionStatus

class SubscriptionResponse(BaseModel):
    id: int
    family_id: int
    plan: SubscriptionPlan
    status: SubscriptionStatus
    max_members: int
    max_documents: int
    max_ai_requests_per_month: int
    max_storage_mb: int
    current_members: int
    current_documents: int
    current_ai_requests_this_month: int
    current_storage_mb: int
    price_monthly: Decimal
    billing_cycle_start: datetime
    billing_cycle_end: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SubscriptionUpdate(BaseModel):
    plan: Optional[SubscriptionPlan] = None
    status: Optional[SubscriptionStatus] = None
    max_members: Optional[int] = None
    max_documents: Optional[int] = None
    max_ai_requests_per_month: Optional[int] = None
    max_storage_mb: Optional[int] = None
    price_monthly: Optional[Decimal] = None