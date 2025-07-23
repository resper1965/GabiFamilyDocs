from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FamilyBase(BaseModel):
    name: str
    description: Optional[str] = None

class FamilyCreate(FamilyBase):
    pass

class FamilyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Family(FamilyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True

# Alias para compatibilidade
FamilyResponse = Family

class FamilyWithStats(Family):
    total_members: int
    total_documents: int
    documents_expiring_soon: int

class FamilyList(BaseModel):
    families: List[Family]
    total: int