from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..crud import family_crud, subscription_crud
from ..schemas.family import FamilyCreate, FamilyUpdate, Family, FamilyWithStats
from ..services.auth_service import get_current_user, check_platform_admin, check_family_admin

router = APIRouter()


@router.post("/", response_model=Family, status_code=status.HTTP_201_CREATED)
def create_family(
    *,
    db: Session = Depends(get_db),
    family_in: FamilyCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create new family.
    Only platform admins can create families.
    """
    check_platform_admin(current_user)
    
    # Verificar se já existe família com esse nome
    existing_family = family_crud.get_by_name(db, name=family_in.name)
    if existing_family:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Family with this name already exists"
        )
    
    # Criar família
    family = family_crud.create(db, obj_in=family_in)
    
    # Criar assinatura padrão (FREE)
    subscription_crud.create_default_subscription(db, family_id=family.id)
    
    return family


@router.get("/", response_model=List[Family])
def read_families(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve families.
    Platform admins see all families, family admins see only their family.
    """
    if "platform_admin" in current_user.get("roles", []):
        families = family_crud.get_active_families(db, skip=skip, limit=limit)
    else:
        # Family admin/member sees only their family
        family_id = current_user.get("family_id")
        if not family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not associated with any family"
            )
        family = family_crud.get(db, id=family_id)
        families = [family] if family else []
    
    return families


@router.get("/{family_id}", response_model=FamilyWithStats)
def read_family(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get family by ID with statistics.
    """
    family = family_crud.get(db, id=family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Verificar permissões
    if "platform_admin" not in current_user.get("roles", []):
        user_family_id = current_user.get("family_id")
        if user_family_id != family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Buscar estatísticas
    from ..crud import member_crud, document_crud
    stats = {
        "total_members": member_crud.count_by_family(db, family_id=family_id),
        "total_documents": document_crud.count_by_family(db, family_id=family_id),
        "documents_expiring_soon": len(document_crud.get_expiring_soon(db, family_id=family_id, days=30))
    }
    
    return FamilyWithStats(**family.__dict__, **stats)


@router.put("/{family_id}", response_model=Family)
def update_family(
    *,
    db: Session = Depends(get_db),
    family_id: int,
    family_in: FamilyUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update family.
    Only family admins or platform admins can update.
    """
    family = family_crud.get(db, id=family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Verificar permissões
    if "platform_admin" not in current_user.get("roles", []):
        check_family_admin(current_user, family_id)
    
    family = family_crud.update(db, db_obj=family, obj_in=family_in)
    return family


@router.delete("/{family_id}")
def delete_family(
    *,
    db: Session = Depends(get_db),
    family_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Deactivate family (soft delete).
    Only platform admins can deactivate families.
    """
    check_platform_admin(current_user)
    
    family = family_crud.get(db, id=family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    family_crud.deactivate_family(db, family_id=family_id)
    return {"message": "Family deactivated successfully"}


@router.post("/{family_id}/activate")
def activate_family(
    *,
    db: Session = Depends(get_db),
    family_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Activate family.
    Only platform admins can activate families.
    """
    check_platform_admin(current_user)
    
    family = family_crud.get(db, id=family_id)
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    family_crud.activate_family(db, family_id=family_id)
    return {"message": "Family activated successfully"}


@router.get("/{family_id}/search")
def search_families(
    query: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Search families by name or description.
    Only platform admins can search all families.
    """
    check_platform_admin(current_user)
    
    families = family_crud.search_families(db, query=query, skip=skip, limit=limit)
    return families