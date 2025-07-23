from typing import List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from .base import CRUDBase
from ..models.document import Document, DocumentType
from ..schemas.document import DocumentCreate, DocumentUpdate


class CRUDDocument(CRUDBase[Document, DocumentCreate, DocumentUpdate]):
    def get_by_family(self, db: Session, *, family_id: int, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get all documents of a family"""
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_member(self, db: Session, *, member_id: int, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get all documents of a specific member"""
        return (
            db.query(Document)
            .filter(Document.member_id == member_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_type(self, db: Session, *, family_id: int, document_type: DocumentType, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get documents by type within a family"""
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(Document.document_type == document_type)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_country(self, db: Session, *, family_id: int, country: str, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get documents by issuing country"""
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(Document.issuing_country.ilike(f"%{country}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_expiring_soon(self, db: Session, *, family_id: int, days: int = 30) -> List[Document]:
        """Get documents expiring within specified days"""
        future_date = date.today() + timedelta(days=days)
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(Document.expiration_date.isnot(None))
            .filter(Document.expiration_date <= future_date)
            .filter(Document.expiration_date >= date.today())
            .order_by(Document.expiration_date)
            .all()
        )

    def get_expired(self, db: Session, *, family_id: int) -> List[Document]:
        """Get expired documents"""
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(Document.expiration_date.isnot(None))
            .filter(Document.expiration_date < date.today())
            .order_by(Document.expiration_date.desc())
            .all()
        )

    def search_documents(self, db: Session, *, family_id: int, query: str, skip: int = 0, limit: int = 100) -> List[Document]:
        """Search documents by title, description, tags, or document number"""
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(
                or_(
                    Document.title.ilike(f"%{query}%"),
                    Document.description.ilike(f"%{query}%"),
                    Document.document_number.ilike(f"%{query}%"),
                    Document.tags.ilike(f"%{query}%")
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_family(self, db: Session, *, family_id: int) -> int:
        """Count documents in a family"""
        return db.query(Document).filter(Document.family_id == family_id).count()

    def count_by_member(self, db: Session, *, member_id: int) -> int:
        """Count documents for a specific member"""
        return db.query(Document).filter(Document.member_id == member_id).count()

    def count_by_type(self, db: Session, *, family_id: int, document_type: DocumentType) -> int:
        """Count documents by type within a family"""
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(Document.document_type == document_type)
            .count()
        )

    def get_by_paperless_id(self, db: Session, *, paperless_document_id: int) -> Optional[Document]:
        """Get document by Paperless NG ID"""
        return db.query(Document).filter(Document.paperless_document_id == paperless_document_id).first()

    def get_documents_without_paperless(self, db: Session, *, family_id: int) -> List[Document]:
        """Get documents not yet uploaded to Paperless NG"""
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(Document.paperless_document_id.is_(None))
            .all()
        )

    def get_recent_documents(self, db: Session, *, family_id: int, days: int = 7, limit: int = 10) -> List[Document]:
        """Get recently created documents"""
        since_date = datetime.now() - timedelta(days=days)
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(Document.created_at >= since_date)
            .order_by(Document.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_documents_by_date_range(
        self, 
        db: Session, 
        *, 
        family_id: int, 
        start_date: date, 
        end_date: date,
        date_field: str = "issue_date"
    ) -> List[Document]:
        """Get documents within a date range"""
        field = getattr(Document, date_field)
        return (
            db.query(Document)
            .filter(Document.family_id == family_id)
            .filter(field.isnot(None))
            .filter(and_(field >= start_date, field <= end_date))
            .order_by(field)
            .all()
        )

    def update_paperless_info(
        self, 
        db: Session, 
        *, 
        document_id: int, 
        paperless_document_id: int, 
        paperless_url: str
    ) -> Optional[Document]:
        """Update Paperless NG integration info"""
        document = self.get(db, document_id)
        if document:
            document.paperless_document_id = paperless_document_id
            document.paperless_url = paperless_url
            db.commit()
            db.refresh(document)
        return document


document_crud = CRUDDocument(Document)