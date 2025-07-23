from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base

class DocumentType(enum.Enum):
    PASSPORT = "passport"
    ID_CARD = "id_card"
    DRIVER_LICENSE = "driver_license"
    BIRTH_CERTIFICATE = "birth_certificate"
    MARRIAGE_CERTIFICATE = "marriage_certificate"
    DIPLOMA = "diploma"
    VISA = "visa"
    WORK_PERMIT = "work_permit"
    RESIDENCE_PERMIT = "residence_permit"
    TAX_DOCUMENT = "tax_document"
    BANK_STATEMENT = "bank_statement"
    INSURANCE = "insurance"
    MEDICAL_RECORD = "medical_record"
    OTHER = "other"

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False)
    
    # Informações do documento
    document_type = Column(Enum(DocumentType), nullable=False)
    document_number = Column(String(100), nullable=False)
    issuing_country = Column(String(100), nullable=False)
    issuing_authority = Column(String(255), nullable=True)
    issue_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    
    # Integração com Paperless NG
    paperless_document_id = Column(Integer, nullable=True)  # ID no Paperless NG
    paperless_url = Column(String(500), nullable=True)  # URL de acesso no Paperless NG
    
    # Metadados
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)  # Tags separadas por vírgula
    
    # Controle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    family = relationship("Family", back_populates="documents")
    member = relationship("FamilyMember", back_populates="documents")