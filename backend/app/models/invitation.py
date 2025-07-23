from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
import uuid

from ..core.database import Base

class InvitationStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class Invitation(Base):
    __tablename__ = "invitations"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    
    # Dados do convite
    email = Column(String(255), nullable=False)
    token = Column(String(255), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    status = Column(Enum(InvitationStatus), default=InvitationStatus.PENDING)
    
    # Dados do convidado
    invited_by_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    invited_name = Column(String(255), nullable=True)
    invited_role = Column(String(50), default="family_member")  # family_admin ou family_member
    
    # Controle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)  # 7 dias por padrão
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)  # Membro criado após aceitar
    
    # Relacionamentos
    family = relationship("Family", back_populates="invitations")
    invited_by = relationship("FamilyMember", foreign_keys=[invited_by_member_id])