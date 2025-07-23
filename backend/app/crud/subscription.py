from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .base import CRUDBase
from ..models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from ..schemas.subscription import SubscriptionCreate, SubscriptionUpdate


class CRUDSubscription(CRUDBase[Subscription, SubscriptionCreate, SubscriptionUpdate]):
    def get_by_family(self, db: Session, *, family_id: int) -> Optional[Subscription]:
        """Get subscription by family ID"""
        return db.query(Subscription).filter(Subscription.family_id == family_id).first()

    def get_active_subscriptions(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Subscription]:
        """Get all active subscriptions"""
        return (
            db.query(Subscription)
            .filter(Subscription.status == SubscriptionStatus.ACTIVE)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_expired_subscriptions(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Subscription]:
        """Get all expired subscriptions"""
        return (
            db.query(Subscription)
            .filter(Subscription.status == SubscriptionStatus.EXPIRED)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_premium_subscriptions(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Subscription]:
        """Get all premium subscriptions"""
        return (
            db.query(Subscription)
            .filter(Subscription.plan == SubscriptionPlan.PREMIUM)
            .filter(Subscription.status == SubscriptionStatus.ACTIVE)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_free_subscriptions(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Subscription]:
        """Get all free subscriptions"""
        return (
            db.query(Subscription)
            .filter(Subscription.plan == SubscriptionPlan.FREE)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_default_subscription(self, db: Session, *, family_id: int) -> Subscription:
        """Create default free subscription for a family"""
        subscription_data = {
            "family_id": family_id,
            "plan": SubscriptionPlan.FREE,
            "status": SubscriptionStatus.ACTIVE,
            "max_members": 5,
            "max_documents": 100,
            "max_ai_requests_per_month": 10,
            "max_storage_mb": 500,
            "billing_cycle_start": datetime.now(),
            "billing_cycle_end": datetime.now() + timedelta(days=30)
        }
        db_obj = Subscription(**subscription_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def upgrade_to_premium(self, db: Session, *, family_id: int, price_monthly: float = 9.99) -> Optional[Subscription]:
        """Upgrade subscription to premium"""
        subscription = self.get_by_family(db, family_id=family_id)
        if subscription:
            subscription.plan = SubscriptionPlan.PREMIUM
            subscription.max_members = 50
            subscription.max_documents = 99999  # "unlimited"
            subscription.max_ai_requests_per_month = 500
            subscription.max_storage_mb = 10240  # 10GB
            subscription.price_monthly = price_monthly
            subscription.billing_cycle_start = datetime.now()
            subscription.billing_cycle_end = datetime.now() + timedelta(days=30)
            db.commit()
            db.refresh(subscription)
        return subscription

    def downgrade_to_free(self, db: Session, *, family_id: int) -> Optional[Subscription]:
        """Downgrade subscription to free"""
        subscription = self.get_by_family(db, family_id=family_id)
        if subscription:
            subscription.plan = SubscriptionPlan.FREE
            subscription.max_members = 5
            subscription.max_documents = 100
            subscription.max_ai_requests_per_month = 10
            subscription.max_storage_mb = 500
            subscription.price_monthly = 0.00
            db.commit()
            db.refresh(subscription)
        return subscription

    def increment_usage(
        self, 
        db: Session, 
        *, 
        family_id: int, 
        members: int = 0, 
        documents: int = 0, 
        ai_requests: int = 0, 
        storage_mb: int = 0
    ) -> Optional[Subscription]:
        """Increment usage counters"""
        subscription = self.get_by_family(db, family_id=family_id)
        if subscription:
            if members > 0:
                subscription.current_members += members
            if documents > 0:
                subscription.current_documents += documents
            if ai_requests > 0:
                subscription.current_ai_requests_this_month += ai_requests
            if storage_mb > 0:
                subscription.current_storage_mb += storage_mb
            db.commit()
            db.refresh(subscription)
        return subscription

    def decrement_usage(
        self, 
        db: Session, 
        *, 
        family_id: int, 
        members: int = 0, 
        documents: int = 0, 
        storage_mb: int = 0
    ) -> Optional[Subscription]:
        """Decrement usage counters"""
        subscription = self.get_by_family(db, family_id=family_id)
        if subscription:
            if members > 0:
                subscription.current_members = max(0, subscription.current_members - members)
            if documents > 0:
                subscription.current_documents = max(0, subscription.current_documents - documents)
            if storage_mb > 0:
                subscription.current_storage_mb = max(0, subscription.current_storage_mb - storage_mb)
            db.commit()
            db.refresh(subscription)
        return subscription

    def reset_monthly_usage(self, db: Session, *, family_id: int) -> Optional[Subscription]:
        """Reset monthly usage counters (AI requests)"""
        subscription = self.get_by_family(db, family_id=family_id)
        if subscription:
            subscription.current_ai_requests_this_month = 0
            subscription.billing_cycle_start = datetime.now()
            subscription.billing_cycle_end = datetime.now() + timedelta(days=30)
            db.commit()
            db.refresh(subscription)
        return subscription

    def check_limits(self, db: Session, *, family_id: int) -> dict:
        """Check if subscription limits are exceeded"""
        subscription = self.get_by_family(db, family_id=family_id)
        if not subscription:
            return {"error": "Subscription not found"}

        limits_status = {
            "members": {
                "current": subscription.current_members,
                "max": subscription.max_members,
                "exceeded": subscription.current_members >= subscription.max_members
            },
            "documents": {
                "current": subscription.current_documents,
                "max": subscription.max_documents,
                "exceeded": subscription.current_documents >= subscription.max_documents
            },
            "ai_requests": {
                "current": subscription.current_ai_requests_this_month,
                "max": subscription.max_ai_requests_per_month,
                "exceeded": subscription.current_ai_requests_this_month >= subscription.max_ai_requests_per_month
            },
            "storage": {
                "current": subscription.current_storage_mb,
                "max": subscription.max_storage_mb,
                "exceeded": subscription.current_storage_mb >= subscription.max_storage_mb
            }
        }
        return limits_status

    def is_limit_exceeded(self, db: Session, *, family_id: int, limit_type: str) -> bool:
        """Check if specific limit is exceeded"""
        limits = self.check_limits(db, family_id=family_id)
        if "error" in limits:
            return True
        return limits.get(limit_type, {}).get("exceeded", True)

    def get_expiring_soon(self, db: Session, *, days: int = 7) -> List[Subscription]:
        """Get subscriptions expiring soon"""
        future_date = datetime.now() + timedelta(days=days)
        return (
            db.query(Subscription)
            .filter(Subscription.status == SubscriptionStatus.ACTIVE)
            .filter(Subscription.billing_cycle_end <= future_date)
            .filter(Subscription.plan == SubscriptionPlan.PREMIUM)
            .all()
        )

    def cancel_subscription(self, db: Session, *, family_id: int) -> Optional[Subscription]:
        """Cancel subscription"""
        subscription = self.get_by_family(db, family_id=family_id)
        if subscription:
            subscription.status = SubscriptionStatus.CANCELLED
            db.commit()
            db.refresh(subscription)
        return subscription


subscription_crud = CRUDSubscription(Subscription)