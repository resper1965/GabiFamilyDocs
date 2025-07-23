import httpx
from typing import Optional, Dict, Any, List
from keycloak import KeycloakAdmin, KeycloakOpenID
from ..core.config import settings

class KeycloakService:
    def __init__(self):
        self.server_url = settings.KEYCLOAK_URL
        self.realm_name = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET
        
        # Cliente para operações administrativas
        self.keycloak_admin = KeycloakAdmin(
            server_url=self.server_url,
            username=settings.KEYCLOAK_ADMIN_USERNAME,
            password=settings.KEYCLOAK_ADMIN_PASSWORD,
            realm_name="master",
            verify=True
        )
        
        # Cliente para autenticação
        self.keycloak_openid = KeycloakOpenID(
            server_url=self.server_url,
            client_id=self.client_id,
            realm_name=self.realm_name,
            client_secret_key=self.client_secret
        )
    
    async def create_realm_if_not_exists(self):
        """Criar o realm da aplicação se não existir"""
        try:
            realms = self.keycloak_admin.get_realms()
            realm_exists = any(realm['realm'] == self.realm_name for realm in realms)
            
            if not realm_exists:
                realm_payload = {
                    "realm": self.realm_name,
                    "enabled": True,
                    "displayName": "GabiFamilyDocs",
                    "registrationAllowed": False,
                    "loginWithEmailAllowed": True,
                    "duplicateEmailsAllowed": False
                }
                self.keycloak_admin.create_realm(realm_payload)
                
                # Mudar para o novo realm
                self.keycloak_admin.realm_name = self.realm_name
                
                # Criar client
                await self.create_client()
                
                # Criar roles
                await self.create_roles()
                
        except Exception as e:
            print(f"Erro ao criar realm: {e}")
    
    async def create_client(self):
        """Criar client da aplicação"""
        try:
            client_payload = {
                "clientId": self.client_id,
                "name": "GabiFamilyDocs Client",
                "enabled": True,
                "clientAuthenticatorType": "client-secret",
                "secret": self.client_secret or "gabifamilydocs-secret",
                "redirectUris": ["http://localhost:3000/*"],
                "webOrigins": ["http://localhost:3000"],
                "standardFlowEnabled": True,
                "implicitFlowEnabled": False,
                "directAccessGrantsEnabled": True,
                "serviceAccountsEnabled": True,
                "publicClient": False
            }
            self.keycloak_admin.create_client(client_payload)
        except Exception as e:
            print(f"Erro ao criar client: {e}")
    
    async def create_roles(self):
        """Criar roles da aplicação"""
        try:
            roles = ["platform_admin", "family_admin", "family_member"]
            for role in roles:
                role_payload = {
                    "name": role,
                    "description": f"Role {role} for GabiFamilyDocs"
                }
                self.keycloak_admin.create_realm_role(role_payload)
        except Exception as e:
            print(f"Erro ao criar roles: {e}")
    
    async def create_user(self, email: str, first_name: str, last_name: str, 
                         password: str, roles: List[str] = None) -> Optional[str]:
        """Criar usuário no Keycloak"""
        try:
            user_payload = {
                "username": email,
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                "enabled": True,
                "emailVerified": True,
                "credentials": [{
                    "type": "password",
                    "value": password,
                    "temporary": False
                }]
            }
            
            user_id = self.keycloak_admin.create_user(user_payload)
            
            # Atribuir roles se especificado
            if roles:
                realm_roles = []
                for role_name in roles:
                    role = self.keycloak_admin.get_realm_role(role_name)
                    if role:
                        realm_roles.append(role)
                
                if realm_roles:
                    self.keycloak_admin.assign_realm_roles(user_id, realm_roles)
            
            return user_id
            
        except Exception as e:
            print(f"Erro ao criar usuário: {e}")
            return None
    
    async def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Autenticar usuário e retornar token"""
        try:
            token = self.keycloak_openid.token(username, password)
            return token
        except Exception as e:
            print(f"Erro ao autenticar usuário: {e}")
            return None
    
    async def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """Obter informações do usuário pelo token"""
        try:
            userinfo = self.keycloak_openid.userinfo(token)
            return userinfo
        except Exception as e:
            print(f"Erro ao obter informações do usuário: {e}")
            return None
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verificar e decodificar token JWT"""
        try:
            token_info = self.keycloak_openid.decode_token(token)
            return token_info
        except Exception as e:
            print(f"Erro ao verificar token: {e}")
            return None
    
    async def get_user_roles(self, user_id: str) -> List[str]:
        """Obter roles do usuário"""
        try:
            roles = self.keycloak_admin.get_realm_roles_of_user(user_id)
            return [role['name'] for role in roles]
        except Exception as e:
            print(f"Erro ao obter roles do usuário: {e}")
            return []
    
    async def delete_user(self, user_id: str) -> bool:
        """Deletar usuário do Keycloak"""
        try:
            self.keycloak_admin.delete_user(user_id)
            return True
        except Exception as e:
            print(f"Erro ao deletar usuário: {e}")
            return False
