from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base

class Family(Base):
    __tablename__ = "families"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relacionamentos
    members = relationship("FamilyMember", back_populates="family", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="family", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="family", uselist=False, cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="family", cascade="all, delete-orphan")
