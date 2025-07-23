from typing import List, Optional
from sqlalchemy.orm import Session

from .base import CRUDBase
from ..models.family import Family
from ..schemas.family import FamilyCreate, FamilyUpdate


class CRUDFamily(CRUDBase[Family, FamilyCreate, FamilyUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Family]:
        """Get family by name"""
        return db.query(Family).filter(Family.name == name).first()

    def get_active_families(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Family]:
        """Get only active families"""
        return (
            db.query(Family)
            .filter(Family.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def deactivate_family(self, db: Session, *, family_id: int) -> Optional[Family]:
        """Deactivate a family instead of deleting"""
        family = self.get(db, family_id)
        if family:
            family.is_active = False
            db.commit()
            db.refresh(family)
        return family

    def activate_family(self, db: Session, *, family_id: int) -> Optional[Family]:
        """Activate a family"""
        family = self.get(db, family_id)
        if family:
            family.is_active = True
            db.commit()
            db.refresh(family)
        return family

    def search_families(self, db: Session, *, query: str, skip: int = 0, limit: int = 100) -> List[Family]:
        """Search families by name or description"""
        return (
            db.query(Family)
            .filter(
                (Family.name.ilike(f"%{query}%")) |
                (Family.description.ilike(f"%{query}%"))
            )
            .filter(Family.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )


family_crud = CRUDFamily(Family)