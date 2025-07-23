from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .keycloak_service import KeycloakService
from ..core.database import get_db
from ..models.member import FamilyMember
from ..schemas.auth import UserInfo

security = HTTPBearer()

class AuthService:
    def __init__(self):
        self.keycloak_service = KeycloakService()
    
    async def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Autenticar usuário via Keycloak"""
        return await self.keycloak_service.authenticate_user(username, password)
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verificar token JWT"""
        return await self.keycloak_service.verify_token(token)
    
    async def get_user_info_from_token(self, token: str, db: Session) -> Optional[UserInfo]:
        """Obter informações completas do usuário a partir do token"""
        try:
            # Verificar token no Keycloak
            token_data = await self.keycloak_service.verify_token(token)
            if not token_data:
                return None
            
            # Extrair informações do token
            user_id = token_data.get("sub")
            username = token_data.get("preferred_username")
            email = token_data.get("email")
            first_name = token_data.get("given_name", "")
            last_name = token_data.get("family_name", "")
            
            # Extrair roles do token
            realm_access = token_data.get("realm_access", {})
            roles = realm_access.get("roles", [])
            
            # Filtrar apenas roles da aplicação
            app_roles = [role for role in roles if role in ["platform_admin", "family_admin", "family_member"]]
            
            # Buscar membro da família associado
            family_id = None
            member = db.query(FamilyMember).filter(FamilyMember.keycloak_user_id == user_id).first()
            if member:
                family_id = member.family_id
            
            return UserInfo(
                user_id=user_id,
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                roles=app_roles,
                family_id=family_id
            )
            
        except Exception as e:
            print(f"Erro ao obter informações do usuário: {e}")
            return None
    
    async def create_user_from_invitation(self, email: str, first_name: str, 
                                        last_name: str, password: str, 
                                        roles: list = None) -> Optional[str]:
        """Criar usuário no Keycloak a partir de convite"""
        return await self.keycloak_service.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            roles=roles or ["family_member"]
        )
    
    def check_permissions(self, user_roles: list, required_roles: list) -> bool:
        """Verificar se usuário tem permissões necessárias"""
        if "platform_admin" in user_roles:
            return True  # Platform admin tem acesso a tudo
        
        return any(role in user_roles for role in required_roles)
    
    def check_family_access(self, user_family_id: int, resource_family_id: int, 
                          user_roles: list) -> bool:
        """Verificar se usuário tem acesso a recursos da família"""
        if "platform_admin" in user_roles:
            return True
        
        return user_family_id == resource_family_id

# Dependency para obter usuário atual
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    """Dependency para obter usuário atual autenticado"""
    auth_service = AuthService()
    
    token = credentials.credentials
    user_info = await auth_service.get_user_info_from_token(token, db)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar informações do membro
    member = db.query(FamilyMember).filter(FamilyMember.keycloak_user_id == user_info.user_id).first()
    member_id = member.id if member else None
    
    return {
        "user_id": user_info.user_id,
        "username": user_info.username,
        "email": user_info.email,
        "first_name": user_info.first_name,
        "last_name": user_info.last_name,
        "roles": user_info.roles,
        "family_id": user_info.family_id,
        "member_id": member_id
    }

# Dependency para verificar roles específicas
def require_roles(required_roles: list):
    """Factory para criar dependency que verifica roles específicas"""
    def role_checker(current_user: UserInfo = Depends(get_current_user)) -> UserInfo:
        auth_service = AuthService()
        
        if not auth_service.check_permissions(current_user.roles, required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissões insuficientes"
            )
        
        return current_user
    
    return role_checker

# Dependencies específicas para roles
get_platform_admin = require_roles(["platform_admin"])
get_family_admin = require_roles(["family_admin"])
get_family_member = require_roles(["family_member", "family_admin"])

# Dependency para verificar acesso à família
def require_family_access(current_user: UserInfo = Depends(get_current_user)):
    """Verificar se usuário tem acesso à família especificada"""
    def family_checker(family_id: int) -> bool:
        auth_service = AuthService()
        return auth_service.check_family_access(
            current_user.family_id, 
            family_id, 
            current_user.roles
        )
    
    return family_checker

# Funções helper para verificação de permissões
def check_platform_admin(current_user: dict):
    """Verificar se usuário é platform admin"""
    if "platform_admin" not in current_user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform admins can perform this action"
        )

def check_family_admin(current_user: dict, family_id: int):
    """Verificar se usuário é admin da família especificada"""
    user_roles = current_user.get("roles", [])
    user_family_id = current_user.get("family_id")
    
    # Platform admin pode tudo
    if "platform_admin" in user_roles:
        return
    
    # Family admin pode gerenciar sua própria família
    if "family_admin" in user_roles and user_family_id == family_id:
        return
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only family admins can perform this action"
    )

def check_family_access(current_user: dict, family_id: int):
    """Verificar se usuário tem acesso à família especificada"""
    user_roles = current_user.get("roles", [])
    user_family_id = current_user.get("family_id")
    
    # Platform admin pode tudo
    if "platform_admin" in user_roles:
        return
    
    # Usuário da família pode acessar sua própria família
    if user_family_id == family_id:
        return
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied to this family"
    )

def check_document_access(current_user: dict, document):
    """Verificar se usuário tem acesso ao documento especificado"""
    user_roles = current_user.get("roles", [])
    user_family_id = current_user.get("family_id")
    user_member_id = current_user.get("member_id")
    
    # Platform admin pode tudo
    if "platform_admin" in user_roles:
        return
    
    # Verificar acesso à família
    if user_family_id != document.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this document"
        )
    
    # Family admin pode ver todos os documentos da família
    if "family_admin" in user_roles:
        return
    
    # Membro pode ver apenas seus próprios documentos
    if user_member_id == document.member_id:
        return
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied to this document"
    )