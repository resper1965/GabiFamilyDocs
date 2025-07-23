from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from ..models.member import Gender, FamilyRole

class FamilyMemberBase(BaseModel):
    full_name: str
    birth_date: date
    gender: Gender
    nationality: str
    email: EmailStr
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_country: Optional[str] = None
    address_zipcode: Optional[str] = None

class FamilyMemberCreate(FamilyMemberBase):
    family_id: int
    role: Optional[FamilyRole] = FamilyRole.MEMBER

class FamilyMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[Gender] = None
    nationality: Optional[str] = None
    email: Optional[EmailStr] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_country: Optional[str] = None
    address_zipcode: Optional[str] = None
    role: Optional[FamilyRole] = None

class FamilyMember(FamilyMemberBase):
    id: int
    family_id: int
    keycloak_user_id: Optional[str] = None
    role: FamilyRole
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Alias para compatibilidade
FamilyMemberResponse = FamilyMember

class FamilyMemberWithDocuments(FamilyMember):
    documents: List['Document'] = []

class FamilyMemberList(BaseModel):
    members: List[FamilyMember]
    total: int