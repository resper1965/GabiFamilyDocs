from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict, List
from pydantic import BaseModel

from ..core.database import get_db
from ..services.auth_service import get_current_user, require_roles
from ..services.ollama_service import OllamaService
from ..services.paperless_service import PaperlessService
from ..schemas.auth import UserInfo
from ..models.member import FamilyMember
from ..models.document import Document
from ..models.subscription import Subscription, SubscriptionStatus

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    context_member_id: int = None

class ChatResponse(BaseModel):
    response: str
    context_used: bool = False

class GenerateDocumentRequest(BaseModel):
    member_id: int
    document_type: str  # "authorization", "declaration", "certificate"
    additional_info: str = ""
    title: str

class GenerateDocumentResponse(BaseModel):
    success: bool
    message: str
    paperless_url: str = None
    document_id: int = None

@router.post("/query", response_model=ChatResponse)
async def chat_query(
    chat_data: ChatMessage,
    current_user: UserInfo = Depends(require_roles(["family_member", "family_admin"])),
    db: Session = Depends(get_db)
):
    """Fazer consulta via chat sobre documentos"""
    try:
        ollama_service = OllamaService()
        
        # Obter contexto do membro se especificado
        member_data = None
        documents_context = []
        
        if chat_data.context_member_id:
            # Verificar se o membro pertence à família do usuário
            member = db.query(FamilyMember).filter(
                FamilyMember.id == chat_data.context_member_id,
                FamilyMember.family_id == current_user.family_id
            ).first()
            
            if not member:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Membro não encontrado"
                )
            
            # Converter membro para dict
            member_data = {
                "full_name": member.full_name,
                "birth_date": str(member.birth_date),
                "nationality": member.nationality,
                "email": member.email
            }
            
            # Obter documentos do membro
            documents = db.query(Document).filter(
                Document.member_id == member.id
            ).all()
            
            documents_context = [
                {
                    "title": doc.title,
                    "document_type": doc.document_type.value,
                    "document_number": doc.document_number,
                    "issuing_country": doc.issuing_country,
                    "expiration_date": str(doc.expiration_date) if doc.expiration_date else None
                }
                for doc in documents
            ]
        
        # Gerar resposta via Ollama
        response = await ollama_service.answer_document_query(
            query=chat_data.message,
            member_data=member_data,
            documents_context=documents_context
        )
        
        if not response:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao gerar resposta"
            )
        
        return ChatResponse(
            response=response,
            context_used=bool(member_data or documents_context)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )

@router.post("/generate-document", response_model=GenerateDocumentResponse)
async def generate_document(
    request: GenerateDocumentRequest,
    current_user: UserInfo = Depends(require_roles(["family_member", "family_admin"])),
    db: Session = Depends(get_db)
):
    """Gerar documento via IA e enviar para Paperless NG"""
    try:
        # Verificar se o membro pertence à família do usuário
        member = db.query(FamilyMember).filter(
            FamilyMember.id == request.member_id,
            FamilyMember.family_id == current_user.family_id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membro não encontrado"
            )
        
        # Verificar limites de IA da assinatura
        subscription = db.query(Subscription).filter(
            Subscription.family_id == current_user.family_id
        ).first()

        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assinatura n\u00e3o encontrada"
            )

        if subscription.status != SubscriptionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Assinatura inativa"
            )

        if subscription.current_ai_requests_this_month >= subscription.max_ai_requests_per_month:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limite de requisi\u00e7\u00f5es de IA excedido"
            )

        if subscription.current_documents >= subscription.max_documents:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limite de documentos excedido"
            )

        subscription.current_ai_requests_this_month += 1
        db.commit()
        db.refresh(subscription)
        
        ollama_service = OllamaService()
        paperless_service = PaperlessService()
        
        # Preparar dados do membro
        member_data = {
            "full_name": member.full_name,
            "birth_date": str(member.birth_date),
            "nationality": member.nationality,
            "email": member.email,
            "address_street": member.address_street,
            "address_city": member.address_city,
            "address_country": member.address_country
        }
        
        # Gerar conteúdo do documento via IA
        content = await ollama_service.generate_document_content(
            document_type=request.document_type,
            member_data=member_data,
            additional_info=request.additional_info
        )
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao gerar conteúdo do documento"
            )
        
        # Criar PDF a partir do conteúdo
        pdf_content = ollama_service.create_pdf_from_text(
            content=content,
            title=request.title
        )
        
        if not pdf_content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar PDF"
            )
        
        # Upload para Paperless NG
        paperless_result = await paperless_service.upload_document(
            file_content=pdf_content,
            filename=f"{request.title}.pdf",
            title=request.title,
            tags=[member.full_name, request.document_type, "generated_by_ai"]
        )
        
        if not paperless_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao enviar documento para Paperless NG"
            )
        
        # Salvar referência no banco de dados
        document = Document(
            family_id=current_user.family_id,
            member_id=member.id,
            document_type="other",  # Documentos gerados são categorizados como "other"
            document_number="GENERATED",
            issuing_country=member.nationality,
            title=request.title,
            description=f"Documento gerado via IA - {request.document_type}",
            tags=f"{member.full_name},{request.document_type},generated_by_ai",
            paperless_document_id=paperless_result["document_id"],
            paperless_url=paperless_result["url"]
        )
        
        db.add(document)
        subscription.current_documents += 1
        db.commit()
        db.refresh(document)
        db.refresh(subscription)
        
        return GenerateDocumentResponse(
            success=True,
            message="Documento gerado e enviado para Paperless NG com sucesso",
            paperless_url=paperless_result["url"],
            document_id=document.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )

@router.get("/models")
async def get_available_models(
    current_user: UserInfo = Depends(require_roles(["family_member", "family_admin"]))
):
    """Listar modelos disponíveis no Ollama"""
    try:
        ollama_service = OllamaService()
        
        # Verificar modelo padrão
        model_available = await ollama_service.check_model_availability()
        
        return {
            "models": [
                {
                    "name": ollama_service.default_model,
                    "available": model_available,
                    "status": "ready" if model_available else "downloading"
                }
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar modelos: {str(e)}"
        )
