from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from ..core.database import get_db
from ..crud import invitation_crud, family_crud, member_crud, subscription_crud
from ..schemas.invitation import InvitationCreate, InvitationUpdate, Invitation, InvitationResponse
from ..models.invitation import InvitationStatus
from ..services.auth_service import get_current_user, check_family_access, check_family_admin
from ..services.keycloak_service import KeycloakService

router = APIRouter()


@router.post("/", response_model=Invitation, status_code=status.HTTP_201_CREATED)
def create_invitation(
    *,
    db: Session = Depends(get_db),
    invitation_in: InvitationCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create new invitation.
    Only family admins can create invitations.
    """
    check_family_admin(current_user, invitation_in.family_id)
    
    # Verificar se família existe
    family = family_crud.get(db, id=invitation_in.family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Verificar limites da assinatura
    if subscription_crud.is_limit_exceeded(db, family_id=invitation_in.family_id, limit_type="members"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member limit exceeded for current subscription plan"
        )
    
    # Verificar se já existe convite pendente para este email
    existing_invitation = invitation_crud.get_by_email(db, email=invitation_in.email)
    if existing_invitation and existing_invitation.status == InvitationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is already a pending invitation for this email"
        )
    
    # Verificar se email já é membro
    existing_member = member_crud.get_by_email(db, email=invitation_in.email)
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered as a family member"
        )
    
    # Obter ID do membro que está fazendo o convite
    invited_by_member_id = current_user.get("member_id")
    if not invited_by_member_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with any family member"
        )
    
    # Criar convite
    invitation = invitation_crud.create_invitation(
        db,
        family_id=invitation_in.family_id,
        email=invitation_in.email,
        invited_by_member_id=invited_by_member_id,
        invited_name=invitation_in.invited_name,
        invited_role=invitation_in.invited_role or "family_member",
        expires_in_hours=72
    )
    
    # TODO: Enviar email de convite
    # send_invitation_email(invitation.email, invitation.token, family.name)
    
    return invitation


@router.get("/", response_model=List[Invitation])
def read_invitations(
    family_id: int = None,
    status_filter: InvitationStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve invitations.
    """
    # Se family_id não for fornecido, usar do usuário atual
    if not family_id:
        family_id = current_user.get("family_id")
        if not family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not associated with any family"
            )
    
    check_family_access(current_user, family_id)
    
    # Aplicar filtros
    if status_filter == InvitationStatus.PENDING:
        invitations = invitation_crud.get_pending_invitations(db, family_id=family_id, skip=skip, limit=limit)
    elif status_filter == InvitationStatus.ACCEPTED:
        invitations = invitation_crud.get_accepted_invitations(db, family_id=family_id, skip=skip, limit=limit)
    elif status_filter == InvitationStatus.EXPIRED:
        invitations = invitation_crud.get_expired_invitations(db, family_id=family_id, skip=skip, limit=limit)
    else:
        invitations = invitation_crud.get_by_family(db, family_id=family_id, skip=skip, limit=limit)
    
    return invitations


@router.get("/{invitation_id}", response_model=Invitation)
def read_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get invitation by ID.
    """
    invitation = invitation_crud.get(db, id=invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    check_family_access(current_user, invitation.family_id)
    
    return invitation


@router.get("/token/{token}")
def read_invitation_by_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get invitation by token (public endpoint for accepting invitations).
    """
    invitation = invitation_crud.get_by_token(db, token=token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Verificar se convite é válido
    if not invitation_crud.is_invitation_valid(db, token=token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is expired or already used"
        )
    
    # Buscar informações da família
    family = family_crud.get(db, id=invitation.family_id)
    invited_by = member_crud.get(db, id=invitation.invited_by_member_id)
    
    return InvitationResponse(
        **invitation.__dict__,
        family_name=family.name if family else "Unknown",
        invited_by_name=invited_by.full_name if invited_by else "Unknown"
    )


@router.post("/accept/{token}")
def accept_invitation(
    token: str,
    member_data: dict,  # Dados do novo membro
    db: Session = Depends(get_db)
):
    """
    Accept invitation and create new family member.
    Public endpoint (no authentication required).
    """
    invitation = invitation_crud.get_by_token(db, token=token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Verificar se convite é válido
    if not invitation_crud.is_invitation_valid(db, token=token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is expired or already used"
        )
    
    # Verificar limites da assinatura
    if subscription_crud.is_limit_exceeded(db, family_id=invitation.family_id, limit_type="members"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member limit exceeded for current subscription plan"
        )
    
    try:
        # Criar usuário no Keycloak
        keycloak_service = KeycloakService()
        keycloak_user = keycloak_service.create_user(
            email=invitation.email,
            password=member_data.get("password"),
            first_name=member_data.get("first_name", ""),
            last_name=member_data.get("last_name", ""),
            enabled=True
        )
        
        # Criar membro da família
        from ..schemas.member import FamilyMemberCreate
        from ..models.member import Gender, FamilyRole
        
        member_create = FamilyMemberCreate(
            family_id=invitation.family_id,
            full_name=member_data.get("full_name") or f"{member_data.get('first_name', '')} {member_data.get('last_name', '')}".strip(),
            birth_date=member_data.get("birth_date"),
            gender=Gender(member_data.get("gender", "other")),
            nationality=member_data.get("nationality", ""),
            email=invitation.email,
            role=FamilyRole(invitation.invited_role) if invitation.invited_role in ["family_admin", "family_member"] else FamilyRole.MEMBER,
            # Endereço
            address_street=member_data.get("address_street"),
            address_number=member_data.get("address_number"),
            address_complement=member_data.get("address_complement"),
            address_neighborhood=member_data.get("address_neighborhood"),
            address_city=member_data.get("address_city"),
            address_state=member_data.get("address_state"),
            address_country=member_data.get("address_country"),
            address_zipcode=member_data.get("address_zipcode"),
        )
        
        # Adicionar ID do Keycloak
        member_data_dict = member_create.dict()
        member_data_dict["keycloak_user_id"] = keycloak_user["id"]
        
        member = member_crud.create(db, obj_in=FamilyMemberCreate(**member_data_dict))
        
        # Aceitar convite
        invitation_crud.accept_invitation(db, token=token, member_id=member.id)
        
        # Incrementar contador de membros na assinatura
        subscription_crud.increment_usage(db, family_id=invitation.family_id, members=1)
        
        return {
            "message": "Invitation accepted successfully",
            "member_id": member.id,
            "keycloak_user_id": keycloak_user["id"]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept invitation: {str(e)}"
        )


@router.post("/decline/{token}")
def decline_invitation(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Decline invitation.
    Public endpoint (no authentication required).
    """
    invitation = invitation_crud.get_by_token(db, token=token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation cannot be declined"
        )
    
    invitation_crud.decline_invitation(db, token=token)
    
    return {"message": "Invitation declined successfully"}


@router.post("/{invitation_id}/resend", response_model=Invitation)
def resend_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Resend invitation with new token and expiry.
    Only family admins can resend invitations.
    """
    invitation = invitation_crud.get(db, id=invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    check_family_admin(current_user, invitation.family_id)
    
    # Gerar novo token
    new_token = str(uuid.uuid4())
    
    invitation = invitation_crud.resend_invitation(db, invitation_id=invitation_id, new_token=new_token)
    
    # TODO: Enviar novo email de convite
    # send_invitation_email(invitation.email, invitation.token, family.name)
    
    return invitation


@router.delete("/{invitation_id}")
def cancel_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel invitation.
    Only family admins can cancel invitations.
    """
    invitation = invitation_crud.get(db, id=invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    check_family_admin(current_user, invitation.family_id)
    
    invitation_crud.cancel_invitation(db, invitation_id=invitation_id)
    
    return {"message": "Invitation cancelled successfully"}


@router.post("/expire-old")
def expire_old_invitations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Expire all old invitations (platform admin only).
    """
    from ..services.auth_service import check_platform_admin
    check_platform_admin(current_user)
    
    count = invitation_crud.expire_old_invitations(db)
    
    return {
        "message": f"Expired {count} old invitations",
        "count": count
    }


@router.get("/stats/{family_id}")
def get_invitation_stats(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get invitation statistics for a family.
    """
    check_family_access(current_user, family_id)
    
    stats = invitation_crud.get_invitation_stats(db, family_id=family_id)
    return stats