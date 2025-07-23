from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base

class SubscriptionPlan(enum.Enum):
    FREE = "free"
    PREMIUM = "premium"

class SubscriptionStatus(enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PENDING = "pending"

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False, unique=True)
    
    # Plano
    plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    
    # Limites do plano
    max_members = Column(Integer, default=5)  # FREE: 5, PREMIUM: 50
    max_documents = Column(Integer, default=100)  # FREE: 100, PREMIUM: ilimitado
    max_ai_requests_per_month = Column(Integer, default=10)  # FREE: 10, PREMIUM: 500
    max_storage_mb = Column(Integer, default=500)  # FREE: 500MB, PREMIUM: 10GB
    
    # Uso atual
    current_members = Column(Integer, default=0)
    current_documents = Column(Integer, default=0)
    current_ai_requests_this_month = Column(Integer, default=0)
    current_storage_mb = Column(Integer, default=0)
    
    # Billing
    price_monthly = Column(Numeric(10, 2), default=0.00)
    billing_cycle_start = Column(DateTime(timezone=True), server_default=func.now())
    billing_cycle_end = Column(DateTime(timezone=True))
    
    # Controle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    family = relationship("Family", back_populates="subscription")
