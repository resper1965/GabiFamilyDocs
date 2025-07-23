from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from ..core.database import get_db
from ..services.auth_service import AuthService, get_current_user
from ..schemas.auth import Token, UserInfo

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login do usuário"""
    auth_service = AuthService()
    
    # Autenticar via Keycloak
    token_data = await auth_service.authenticate_user(
        form_data.username, 
        form_data.password
    )
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return Token(
        access_token=token_data["access_token"],
        token_type="bearer",
        refresh_token=token_data.get("refresh_token")
    )

@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: UserInfo = Depends(get_current_user)
):
    """Obter informações do usuário atual"""
    return current_user

@router.post("/logout")
async def logout(
    current_user: UserInfo = Depends(get_current_user)
):
    """Logout do usuário"""
    # Em um cenário real, você poderia invalidar o token no Keycloak
    # Por agora, apenas retornamos sucesso
    return {"message": "Logout realizado com sucesso"}