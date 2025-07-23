from typing import List, Optional
from sqlalchemy.orm import Session

from .base import CRUDBase
from ..models.member import FamilyMember, FamilyRole
from ..schemas.member import FamilyMemberCreate, FamilyMemberUpdate


class CRUDFamilyMember(CRUDBase[FamilyMember, FamilyMemberCreate, FamilyMemberUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[FamilyMember]:
        """Get member by email"""
        return db.query(FamilyMember).filter(FamilyMember.email == email).first()

    def get_by_keycloak_id(self, db: Session, *, keycloak_id: str) -> Optional[FamilyMember]:
        """Get member by Keycloak user ID"""
        return db.query(FamilyMember).filter(FamilyMember.keycloak_user_id == keycloak_id).first()

    def get_by_family(self, db: Session, *, family_id: int, skip: int = 0, limit: int = 100) -> List[FamilyMember]:
        """Get all members of a family"""
        return (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == family_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_admins_by_family(self, db: Session, *, family_id: int) -> List[FamilyMember]:
        """Get all admin members of a family"""
        return (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == family_id)
            .filter(FamilyMember.role == FamilyRole.ADMIN)
            .all()
        )

    def get_members_by_family(self, db: Session, *, family_id: int) -> List[FamilyMember]:
        """Get all regular members of a family"""
        return (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == family_id)
            .filter(FamilyMember.role == FamilyRole.MEMBER)
            .all()
        )

    def search_members(self, db: Session, *, family_id: int, query: str, skip: int = 0, limit: int = 100) -> List[FamilyMember]:
        """Search members by name or email within a family"""
        return (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == family_id)
            .filter(
                (FamilyMember.full_name.ilike(f"%{query}%")) |
                (FamilyMember.email.ilike(f"%{query}%"))
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_family(self, db: Session, *, family_id: int) -> int:
        """Count members in a family"""
        return db.query(FamilyMember).filter(FamilyMember.family_id == family_id).count()

    def update_role(self, db: Session, *, member_id: int, new_role: FamilyRole) -> Optional[FamilyMember]:
        """Update member role"""
        member = self.get(db, member_id)
        if member:
            member.role = new_role
            db.commit()
            db.refresh(member)
        return member

    def get_by_birth_month(self, db: Session, *, family_id: int, month: int) -> List[FamilyMember]:
        """Get members with birthday in specific month"""
        from sqlalchemy import extract
        return (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == family_id)
            .filter(extract('month', FamilyMember.birth_date) == month)
            .all()
        )

    def get_by_nationality(self, db: Session, *, family_id: int, nationality: str) -> List[FamilyMember]:
        """Get members by nationality"""
        return (
            db.query(FamilyMember)
            .filter(FamilyMember.family_id == family_id)
            .filter(FamilyMember.nationality.ilike(f"%{nationality}%"))
            .all()
        )


member_crud = CRUDFamilyMember(FamilyMember)