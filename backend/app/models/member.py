from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base

class Gender(enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class FamilyRole(enum.Enum):
    ADMIN = "family_admin"
    MEMBER = "family_member"

class FamilyMember(Base):
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    keycloak_user_id = Column(String(255), unique=True, nullable=True)  # ID do usuário no Keycloak
    
    # Dados pessoais
    full_name = Column(String(255), nullable=False)
    birth_date = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    nationality = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    
    # Endereço
    address_street = Column(String(255), nullable=True)
    address_number = Column(String(20), nullable=True)
    address_complement = Column(String(100), nullable=True)
    address_neighborhood = Column(String(100), nullable=True)
    address_city = Column(String(100), nullable=True)
    address_state = Column(String(100), nullable=True)
    address_country = Column(String(100), nullable=True)
    address_zipcode = Column(String(20), nullable=True)
    
    # Controle
    role = Column(Enum(FamilyRole), default=FamilyRole.MEMBER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    family = relationship("Family", back_populates="members")
    documents = relationship("Document", back_populates="member", cascade="all, delete-orphan")
