from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..crud import subscription_crud, family_crud
from ..schemas.subscription import SubscriptionCreate, SubscriptionUpdate, Subscription, SubscriptionWithLimits
from ..models.subscription import SubscriptionPlan
from ..services.auth_service import get_current_user, check_family_access, check_platform_admin

router = APIRouter()


@router.get("/{family_id}", response_model=SubscriptionWithLimits)
def get_family_subscription(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get subscription details for a family with current usage and limits.
    """
    check_family_access(current_user, family_id)
    
    subscription = subscription_crud.get_by_family(db, family_id=family_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Buscar estatísticas de uso
    limits_status = subscription_crud.check_limits(db, family_id=family_id)
    
    return SubscriptionWithLimits(**subscription.__dict__, limits_status=limits_status)


@router.post("/{family_id}/upgrade", response_model=Subscription)
def upgrade_subscription(
    family_id: int,
    price_monthly: float = 9.99,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Upgrade subscription to premium.
    Only family admins can upgrade subscriptions.
    """
    from ..services.auth_service import check_family_admin
    check_family_admin(current_user, family_id)
    
    subscription = subscription_crud.upgrade_to_premium(db, family_id=family_id, price_monthly=price_monthly)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return subscription


@router.post("/{family_id}/downgrade", response_model=Subscription)
def downgrade_subscription(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Downgrade subscription to free.
    Only family admins can downgrade subscriptions.
    """
    from ..services.auth_service import check_family_admin
    check_family_admin(current_user, family_id)
    
    subscription = subscription_crud.downgrade_to_free(db, family_id=family_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return subscription


@router.post("/{family_id}/reset-monthly")
def reset_monthly_usage(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Reset monthly usage counters (AI requests).
    Only family admins can reset usage.
    """
    from ..services.auth_service import check_family_admin
    check_family_admin(current_user, family_id)
    
    subscription = subscription_crud.reset_monthly_usage(db, family_id=family_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return {"message": "Monthly usage reset successfully"}


@router.get("/{family_id}/limits")
def check_subscription_limits(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Check current subscription limits and usage.
    """
    check_family_access(current_user, family_id)
    
    limits_status = subscription_crud.check_limits(db, family_id=family_id)
    return limits_status


@router.get("/{family_id}/limits/{limit_type}")
def check_specific_limit(
    family_id: int,
    limit_type: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Check if specific limit is exceeded.
    limit_type can be: members, documents, ai_requests, storage
    """
    check_family_access(current_user, family_id)
    
    valid_types = ["members", "documents", "ai_requests", "storage"]
    if limit_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid limit_type. Must be one of: {', '.join(valid_types)}"
        )
    
    is_exceeded = subscription_crud.is_limit_exceeded(db, family_id=family_id, limit_type=limit_type)
    
    return {
        "limit_type": limit_type,
        "exceeded": is_exceeded
    }


@router.post("/{family_id}/cancel", response_model=Subscription)
def cancel_subscription(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel subscription.
    Only family admins can cancel subscriptions.
    """
    from ..services.auth_service import check_family_admin
    check_family_admin(current_user, family_id)
    
    subscription = subscription_crud.cancel_subscription(db, family_id=family_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return subscription


# Platform admin only endpoints
@router.get("/", response_model=List[Subscription])
def list_all_subscriptions(
    plan: SubscriptionPlan = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all subscriptions (platform admin only).
    """
    check_platform_admin(current_user)
    
    if plan == SubscriptionPlan.PREMIUM:
        subscriptions = subscription_crud.get_premium_subscriptions(db, skip=skip, limit=limit)
    elif plan == SubscriptionPlan.FREE:
        subscriptions = subscription_crud.get_free_subscriptions(db, skip=skip, limit=limit)
    else:
        subscriptions = subscription_crud.get_active_subscriptions(db, skip=skip, limit=limit)
    
    return subscriptions


@router.get("/expiring/soon")
def get_expiring_subscriptions(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get subscriptions expiring soon (platform admin only).
    """
    check_platform_admin(current_user)
    
    subscriptions = subscription_crud.get_expiring_soon(db, days=days)
    return subscriptions


@router.get("/stats/overview")
def get_subscription_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get subscription statistics overview (platform admin only).
    """
    check_platform_admin(current_user)
    
    total_active = len(subscription_crud.get_active_subscriptions(db))
    total_premium = len(subscription_crud.get_premium_subscriptions(db))
    total_free = len(subscription_crud.get_free_subscriptions(db))
    total_expired = len(subscription_crud.get_expired_subscriptions(db))
    expiring_soon = len(subscription_crud.get_expiring_soon(db, days=7))
    
    return {
        "total_active": total_active,
        "total_premium": total_premium,
        "total_free": total_free,
        "total_expired": total_expired,
        "expiring_soon": expiring_soon,
        "premium_percentage": (total_premium / total_active * 100) if total_active > 0 else 0
    }