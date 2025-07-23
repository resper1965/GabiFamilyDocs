from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..crud import document_crud, member_crud, subscription_crud, family_crud
from ..schemas.document import DocumentCreate, DocumentUpdate, Document, DocumentWithMember
from ..models.document import DocumentType
from ..services.auth_service import get_current_user, check_family_access, check_document_access
from ..services.paperless_service import PaperlessService

router = APIRouter()


@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
def create_document(
    *,
    db: Session = Depends(get_db),
    document_in: DocumentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create new document.
    Family admins can create documents for any member, members can create for themselves.
    """
    # Verificar se membro existe
    member = member_crud.get(db, id=document_in.member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    check_family_access(current_user, member.family_id)
    
    # Verificar permissões específicas
    user_member_id = current_user.get("member_id")
    user_roles = current_user.get("roles", [])
    
    if not ("platform_admin" in user_roles or 
            "family_admin" in user_roles or 
            user_member_id == document_in.member_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create document for this member"
        )
    
    # Verificar limites da assinatura
    if subscription_crud.is_limit_exceeded(db, family_id=member.family_id, limit_type="documents"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Document limit exceeded for current subscription plan"
        )
    
    # Definir family_id automaticamente
    document_data = document_in.dict()
    document_data["family_id"] = member.family_id
    
    # Criar documento
    document = document_crud.create(db, obj_in=DocumentCreate(**document_data))
    
    # Incrementar contador de documentos na assinatura
    subscription_crud.increment_usage(db, family_id=member.family_id, documents=1)
    
    return document


@router.get("/", response_model=List[Document])
def read_documents(
    family_id: int = None,
    member_id: int = None,
    document_type: DocumentType = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve documents with various filters.
    """
    # Determinar family_id se não fornecido
    if not family_id:
        family_id = current_user.get("family_id")
        if not family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not associated with any family"
            )
    
    check_family_access(current_user, family_id)
    
    # Aplicar filtros
    if member_id:
        # Verificar se usuário pode ver documentos deste membro
        member = member_crud.get(db, id=member_id)
        if not member or member.family_id != family_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        user_member_id = current_user.get("member_id")
        user_roles = current_user.get("roles", [])
        
        if not ("platform_admin" in user_roles or 
                "family_admin" in user_roles or 
                user_member_id == member_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to view documents for this member"
            )
        
        documents = document_crud.get_by_member(db, member_id=member_id, skip=skip, limit=limit)
    elif document_type:
        documents = document_crud.get_by_type(db, family_id=family_id, document_type=document_type, skip=skip, limit=limit)
    else:
        documents = document_crud.get_by_family(db, family_id=family_id, skip=skip, limit=limit)
    
    return documents


@router.get("/{document_id}", response_model=DocumentWithMember)
def read_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get document by ID with member information.
    """
    document = document_crud.get(db, id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    check_document_access(current_user, document)
    
    # Buscar informações do membro
    member = member_crud.get(db, id=document.member_id)
    
    return DocumentWithMember(**document.__dict__, member=member)


@router.put("/{document_id}", response_model=Document)
def update_document(
    *,
    db: Session = Depends(get_db),
    document_id: int,
    document_in: DocumentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update document.
    """
    document = document_crud.get(db, id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    check_document_access(current_user, document)
    
    document = document_crud.update(db, db_obj=document, obj_in=document_in)
    return document


@router.delete("/{document_id}")
def delete_document(
    *,
    db: Session = Depends(get_db),
    document_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete document.
    """
    document = document_crud.get(db, id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    check_document_access(current_user, document)
    
    # Deletar documento
    document_crud.remove(db, id=document_id)
    
    # Decrementar contador de documentos na assinatura
    subscription_crud.decrement_usage(db, family_id=document.family_id, documents=1)
    
    return {"message": "Document deleted successfully"}


@router.get("/expiring/{family_id}")
def get_expiring_documents(
    family_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get documents expiring within specified days.
    """
    check_family_access(current_user, family_id)
    
    documents = document_crud.get_expiring_soon(db, family_id=family_id, days=days)
    return documents


@router.get("/expired/{family_id}")
def get_expired_documents(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get expired documents.
    """
    check_family_access(current_user, family_id)
    
    documents = document_crud.get_expired(db, family_id=family_id)
    return documents


@router.get("/search/{family_id}")
def search_documents(
    family_id: int,
    query: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Search documents by title, description, tags, or document number.
    """
    check_family_access(current_user, family_id)
    
    documents = document_crud.search_documents(db, family_id=family_id, query=query, skip=skip, limit=limit)
    return documents


@router.get("/country/{family_id}")
def get_documents_by_country(
    family_id: int,
    country: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get documents by issuing country.
    """
    check_family_access(current_user, family_id)
    
    documents = document_crud.get_by_country(db, family_id=family_id, country=country, skip=skip, limit=limit)
    return documents


@router.get("/recent/{family_id}")
def get_recent_documents(
    family_id: int,
    days: int = 7,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get recently created documents.
    """
    check_family_access(current_user, family_id)
    
    documents = document_crud.get_recent_documents(db, family_id=family_id, days=days, limit=limit)
    return documents


@router.get("/date-range/{family_id}")
def get_documents_by_date_range(
    family_id: int,
    start_date: date,
    end_date: date,
    date_field: str = "issue_date",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get documents within a date range.
    date_field can be: issue_date, expiration_date, created_at
    """
    check_family_access(current_user, family_id)
    
    valid_fields = ["issue_date", "expiration_date", "created_at"]
    if date_field not in valid_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date_field. Must be one of: {', '.join(valid_fields)}"
        )
    
    documents = document_crud.get_documents_by_date_range(
        db, family_id=family_id, start_date=start_date, end_date=end_date, date_field=date_field
    )
    return documents


@router.post("/{document_id}/upload")
async def upload_document_file(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload file for a document to Paperless NG.
    """
    document = document_crud.get(db, id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    check_document_access(current_user, document)
    
    # Verificar limite de storage
    if subscription_crud.is_limit_exceeded(db, family_id=document.family_id, limit_type="storage"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Storage limit exceeded for current subscription plan"
        )
    
    try:
        # Upload para Paperless NG
        paperless_service = PaperlessService()
        
        # Ler conteúdo do arquivo
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        
        # Upload para Paperless NG
        paperless_result = await paperless_service.upload_document(
            file_content=file_content,
            filename=file.filename,
            title=document.title,
            tags=document.tags,
            correspondent=f"Family_{document.family_id}"
        )
        
        # Atualizar documento com informações do Paperless NG
        document_crud.update_paperless_info(
            db,
            document_id=document_id,
            paperless_document_id=paperless_result["id"],
            paperless_url=paperless_result["url"]
        )
        
        # Incrementar uso de storage
        subscription_crud.increment_usage(db, family_id=document.family_id, storage_mb=int(file_size_mb))
        
        return {
            "message": "Document uploaded successfully",
            "paperless_id": paperless_result["id"],
            "paperless_url": paperless_result["url"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/stats/{family_id}")
def get_document_stats(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get document statistics for a family.
    """
    check_family_access(current_user, family_id)
    
    total_documents = document_crud.count_by_family(db, family_id=family_id)
    expiring_soon = len(document_crud.get_expiring_soon(db, family_id=family_id, days=30))
    expired = len(document_crud.get_expired(db, family_id=family_id))
    without_paperless = len(document_crud.get_documents_without_paperless(db, family_id=family_id))
    
    # Estatísticas por tipo
    type_stats = {}
    for doc_type in DocumentType:
        count = document_crud.count_by_type(db, family_id=family_id, document_type=doc_type)
        if count > 0:
            type_stats[doc_type.value] = count
    
    return {
        "total_documents": total_documents,
        "expiring_soon": expiring_soon,
        "expired": expired,
        "without_paperless": without_paperless,
        "by_type": type_stats
    }