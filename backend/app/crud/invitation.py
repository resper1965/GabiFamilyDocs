from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .base import CRUDBase
from ..models.invitation import Invitation, InvitationStatus
from ..schemas.invitation import InvitationCreate, InvitationUpdate


class CRUDInvitation(CRUDBase[Invitation, InvitationCreate, InvitationUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[Invitation]:
        """Get invitation by email"""
        return db.query(Invitation).filter(Invitation.email == email).first()

    def get_by_token(self, db: Session, *, token: str) -> Optional[Invitation]:
        """Get invitation by token"""
        return db.query(Invitation).filter(Invitation.token == token).first()

    def get_by_family(self, db: Session, *, family_id: int, skip: int = 0, limit: int = 100) -> List[Invitation]:
        """Get all invitations for a family"""
        return (
            db.query(Invitation)
            .filter(Invitation.family_id == family_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_pending_invitations(self, db: Session, *, family_id: int = None, skip: int = 0, limit: int = 100) -> List[Invitation]:
        """Get pending invitations"""
        query = db.query(Invitation).filter(Invitation.status == InvitationStatus.PENDING)
        
        if family_id:
            query = query.filter(Invitation.family_id == family_id)
            
        return query.offset(skip).limit(limit).all()

    def get_accepted_invitations(self, db: Session, *, family_id: int = None, skip: int = 0, limit: int = 100) -> List[Invitation]:
        """Get accepted invitations"""
        query = db.query(Invitation).filter(Invitation.status == InvitationStatus.ACCEPTED)
        
        if family_id:
            query = query.filter(Invitation.family_id == family_id)
            
        return query.offset(skip).limit(limit).all()

    def get_expired_invitations(self, db: Session, *, family_id: int = None, skip: int = 0, limit: int = 100) -> List[Invitation]:
        """Get expired invitations"""
        query = db.query(Invitation).filter(Invitation.status == InvitationStatus.EXPIRED)
        
        if family_id:
            query = query.filter(Invitation.family_id == family_id)
            
        return query.offset(skip).limit(limit).all()

    def get_invitations_expiring_soon(self, db: Session, *, days: int = 1) -> List[Invitation]:
        """Get invitations expiring soon"""
        future_date = datetime.now() + timedelta(days=days)
        return (
            db.query(Invitation)
            .filter(Invitation.status == InvitationStatus.PENDING)
            .filter(Invitation.expires_at <= future_date)
            .filter(Invitation.expires_at >= datetime.now())
            .all()
        )

    def create_invitation(
        self, 
        db: Session, 
        *, 
        family_id: int, 
        email: str, 
        invited_by_member_id: int, 
        token: str = None,
        invited_name: str = None,
        invited_role: str = "family_member",
        expires_in_hours: int = 72
    ) -> Invitation:
        """Create a new invitation"""
        if not token:
            import uuid
            token = str(uuid.uuid4())
            
        invitation_data = {
            "family_id": family_id,
            "email": email,
            "invited_by_member_id": invited_by_member_id,
            "token": token,
            "invited_name": invited_name,
            "invited_role": invited_role,
            "status": InvitationStatus.PENDING,
            "expires_at": datetime.now() + timedelta(hours=expires_in_hours)
        }
        db_obj = Invitation(**invitation_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def accept_invitation(self, db: Session, *, token: str, member_id: int) -> Optional[Invitation]:
        """Accept an invitation"""
        invitation = self.get_by_token(db, token=token)
        if invitation and invitation.status == InvitationStatus.PENDING and invitation.expires_at > datetime.now():
            invitation.status = InvitationStatus.ACCEPTED
            invitation.accepted_at = datetime.now()
            invitation.member_id = member_id
            db.commit()
            db.refresh(invitation)
        return invitation

    def decline_invitation(self, db: Session, *, token: str) -> Optional[Invitation]:
        """Decline an invitation"""
        invitation = self.get_by_token(db, token=token)
        if invitation and invitation.status == InvitationStatus.PENDING:
            invitation.status = InvitationStatus.DECLINED
            db.commit()
            db.refresh(invitation)
        return invitation

    def expire_invitation(self, db: Session, *, token: str) -> Optional[Invitation]:
        """Expire an invitation"""
        invitation = self.get_by_token(db, token=token)
        if invitation and invitation.status == InvitationStatus.PENDING:
            invitation.status = InvitationStatus.EXPIRED
            db.commit()
            db.refresh(invitation)
        return invitation

    def is_invitation_valid(self, db: Session, *, token: str) -> bool:
        """Check if invitation is valid and not expired"""
        invitation = self.get_by_token(db, token=token)
        if not invitation:
            return False
        
        return (
            invitation.status == InvitationStatus.PENDING and 
            invitation.expires_at > datetime.now()
        )

    def expire_old_invitations(self, db: Session) -> int:
        """Expire all old invitations - returns count of expired invitations"""
        expired_invitations = (
            db.query(Invitation)
            .filter(Invitation.status == InvitationStatus.PENDING)
            .filter(Invitation.expires_at <= datetime.now())
            .all()
        )
        
        count = len(expired_invitations)
        for invitation in expired_invitations:
            invitation.status = InvitationStatus.EXPIRED
        
        if count > 0:
            db.commit()
        
        return count

    def resend_invitation(self, db: Session, *, invitation_id: int, new_token: str, expires_in_hours: int = 72) -> Optional[Invitation]:
        """Resend an invitation with new token and expiry"""
        invitation = self.get(db, invitation_id)
        if invitation and invitation.status in [InvitationStatus.PENDING, InvitationStatus.EXPIRED]:
            invitation.token = new_token
            invitation.status = InvitationStatus.PENDING
            invitation.expires_at = datetime.now() + timedelta(hours=expires_in_hours)
            invitation.created_at = datetime.now()  # Update creation time for resend
            db.commit()
            db.refresh(invitation)
        return invitation

    def cancel_invitation(self, db: Session, *, invitation_id: int) -> Optional[Invitation]:
        """Cancel a pending invitation"""
        invitation = self.get(db, invitation_id)
        if invitation and invitation.status == InvitationStatus.PENDING:
            invitation.status = InvitationStatus.CANCELLED
            db.commit()
            db.refresh(invitation)
        return invitation

    def get_invitation_stats(self, db: Session, *, family_id: int) -> dict:
        """Get invitation statistics for a family"""
        total = db.query(Invitation).filter(Invitation.family_id == family_id).count()
        pending = db.query(Invitation).filter(
            Invitation.family_id == family_id,
            Invitation.status == InvitationStatus.PENDING
        ).count()
        accepted = db.query(Invitation).filter(
            Invitation.family_id == family_id,
            Invitation.status == InvitationStatus.ACCEPTED
        ).count()
        expired = db.query(Invitation).filter(
            Invitation.family_id == family_id,
            Invitation.status == InvitationStatus.EXPIRED
        ).count()
        declined = db.query(Invitation).filter(
            Invitation.family_id == family_id,
            Invitation.status == InvitationStatus.DECLINED
        ).count()
        cancelled = db.query(Invitation).filter(
            Invitation.family_id == family_id,
            Invitation.status == InvitationStatus.CANCELLED
        ).count()

        return {
            "total": total,
            "pending": pending,
            "accepted": accepted,
            "expired": expired,
            "declined": declined,
            "cancelled": cancelled
        }


invitation_crud = CRUDInvitation(Invitation)