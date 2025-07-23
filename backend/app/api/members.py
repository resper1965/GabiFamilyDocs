from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..crud import member_crud, family_crud, subscription_crud
from ..schemas.member import FamilyMemberCreate, FamilyMemberUpdate, FamilyMember, FamilyMemberWithDocuments
from ..models.member import FamilyRole
from ..services.auth_service import get_current_user, check_family_access, check_family_admin

router = APIRouter()


@router.post("/", response_model=FamilyMember, status_code=status.HTTP_201_CREATED)
def create_member(
    *,
    db: Session = Depends(get_db),
    member_in: FamilyMemberCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create new family member.
    Only family admins can create members.
    """
    check_family_admin(current_user, member_in.family_id)
    
    # Verificar se família existe
    family = family_crud.get(db, id=member_in.family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Verificar limites da assinatura
    if subscription_crud.is_limit_exceeded(db, family_id=member_in.family_id, limit_type="members"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member limit exceeded for current subscription plan"
        )
    
    # Verificar se email já existe
    existing_member = member_crud.get_by_email(db, email=member_in.email)
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member with this email already exists"
        )
    
    # Criar membro
    member = member_crud.create(db, obj_in=member_in)
    
    # Incrementar contador de membros na assinatura
    subscription_crud.increment_usage(db, family_id=member_in.family_id, members=1)
    
    return member


@router.get("/", response_model=List[FamilyMember])
def read_members(
    family_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve family members.
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
    
    members = member_crud.get_by_family(db, family_id=family_id, skip=skip, limit=limit)
    return members


@router.get("/{member_id}", response_model=FamilyMemberWithDocuments)
def read_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get member by ID with their documents.
    """
    member = member_crud.get(db, id=member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    check_family_access(current_user, member.family_id)
    
    # Verificar se usuário pode ver este membro
    user_member_id = current_user.get("member_id")
    user_roles = current_user.get("roles", [])
    
    # Platform admin ou family admin ou o próprio membro
    if not ("platform_admin" in user_roles or 
            "family_admin" in user_roles or 
            user_member_id == member_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view this member"
        )
    
    # Buscar documentos do membro
    from ..crud import document_crud
    documents = document_crud.get_by_member(db, member_id=member_id)
    
    return FamilyMemberWithDocuments(**member.__dict__, documents=documents)


@router.put("/{member_id}", response_model=FamilyMember)
def update_member(
    *,
    db: Session = Depends(get_db),
    member_id: int,
    member_in: FamilyMemberUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update member.
    Family admins can update any member, regular members can only update themselves.
    """
    member = member_crud.get(db, id=member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    check_family_access(current_user, member.family_id)
    
    # Verificar permissões
    user_member_id = current_user.get("member_id")
    user_roles = current_user.get("roles", [])
    
    if not ("platform_admin" in user_roles or 
            "family_admin" in user_roles or 
            user_member_id == member_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this member"
        )
    
    # Verificar se email já existe (se alterando)
    if member_in.email and member_in.email != member.email:
        existing_member = member_crud.get_by_email(db, email=member_in.email)
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Member with this email already exists"
            )
    
    member = member_crud.update(db, db_obj=member, obj_in=member_in)
    return member


@router.delete("/{member_id}")
def delete_member(
    *,
    db: Session = Depends(get_db),
    member_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete member.
    Only family admins can delete members.
    """
    member = member_crud.get(db, id=member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    check_family_admin(current_user, member.family_id)
    
    # Não permitir deletar o próprio usuário se for o único admin
    user_member_id = current_user.get("member_id")
    if user_member_id == member_id:
        admins = member_crud.get_admins_by_family(db, family_id=member.family_id)
        if len(admins) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last family admin"
            )
    
    # Deletar membro
    member_crud.remove(db, id=member_id)
    
    # Decrementar contador de membros na assinatura
    subscription_crud.decrement_usage(db, family_id=member.family_id, members=1)
    
    return {"message": "Member deleted successfully"}


@router.put("/{member_id}/role", response_model=FamilyMember)
def update_member_role(
    *,
    db: Session = Depends(get_db),
    member_id: int,
    new_role: FamilyRole,
    current_user: dict = Depends(get_current_user)
):
    """
    Update member role.
    Only family admins can change roles.
    """
    member = member_crud.get(db, id=member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    check_family_admin(current_user, member.family_id)
    
    # Não permitir remover admin do próprio usuário se for o único admin
    user_member_id = current_user.get("member_id")
    if (user_member_id == member_id and 
        member.role == FamilyRole.ADMIN and 
        new_role != FamilyRole.ADMIN):
        
        admins = member_crud.get_admins_by_family(db, family_id=member.family_id)
        if len(admins) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin role from the last family admin"
            )
    
    member = member_crud.update_role(db, member_id=member_id, new_role=new_role)
    return member


@router.get("/search/{family_id}")
def search_members(
    family_id: int,
    query: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Search members by name or email within a family.
    """
    check_family_access(current_user, family_id)
    
    members = member_crud.search_members(db, family_id=family_id, query=query, skip=skip, limit=limit)
    return members


@router.get("/birthdays/{family_id}")
def get_birthdays(
    family_id: int,
    month: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get members with birthdays in specific month (1-12).
    If month not provided, returns current month.
    """
    check_family_access(current_user, family_id)
    
    if not month:
        from datetime import datetime
        month = datetime.now().month
    
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12"
        )
    
    members = member_crud.get_by_birth_month(db, family_id=family_id, month=month)
    return members


@router.get("/nationality/{family_id}")
def get_by_nationality(
    family_id: int,
    nationality: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get members by nationality within a family.
    """
    check_family_access(current_user, family_id)
    
    members = member_crud.get_by_nationality(db, family_id=family_id, nationality=nationality)
    return members