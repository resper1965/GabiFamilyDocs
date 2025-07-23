from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..models.document import DocumentType

class DocumentBase(BaseModel):
    document_type: DocumentType
    document_number: str
    issuing_country: str
    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None

class DocumentCreate(DocumentBase):
    member_id: int

class DocumentUpdate(BaseModel):
    document_type: Optional[DocumentType] = None
    document_number: Optional[str] = None
    issuing_country: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    paperless_document_id: Optional[int] = None
    paperless_url: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    family_id: int
    member_id: int
    paperless_document_id: Optional[int] = None
    paperless_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class DocumentList(BaseModel):
    documents: List[DocumentResponse]
    total: int

class DocumentUpload(BaseModel):
    document_id: int
    file_content: bytes
    filename: str
    content_type: str
