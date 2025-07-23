from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.invitation import InvitationStatus

class InvitationCreate(BaseModel):
    email: EmailStr
    invited_name: Optional[str] = None
    invited_role: str = "family_member"

class InvitationResponse(BaseModel):
    id: int
    family_id: int
    email: str
    token: str
    status: InvitationStatus
    invited_by_member_id: int
    invited_name: Optional[str] = None
    invited_role: str
    created_at: datetime
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class InvitationAccept(BaseModel):
    token: str
    full_name: str
    password: str