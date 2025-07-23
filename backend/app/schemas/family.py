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

class FamilyResponse(FamilyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class FamilyList(BaseModel):
    families: List[FamilyResponse]
    total: int