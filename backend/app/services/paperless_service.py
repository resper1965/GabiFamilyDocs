import httpx
import base64
from typing import Optional, Dict, Any, List
from ..core.config import settings

class PaperlessService:
    def __init__(self):
        self.base_url = settings.PAPERLESS_URL
        self.username = settings.PAPERLESS_USERNAME
        self.password = settings.PAPERLESS_PASSWORD
        self.auth_token = None
        
    async def authenticate(self) -> bool:
        """Autenticar no Paperless NG"""
        async with httpx.AsyncClient() as client:
            try:
                auth_data = {
                    "username": self.username,
                    "password": self.password
                }
                response = await client.post(
                    f"{self.base_url}/api/token/",
                    json=auth_data
                )
                
                if response.status_code == 200:
                    self.auth_token = response.json().get("token")
                    return True
                return False
                
            except Exception as e:
                print(f"Erro ao autenticar no Paperless: {e}")
                return False
    
    async def get_headers(self) -> Dict[str, str]:
        """Obter headers com token de autenticação"""
        if not self.auth_token:
            await self.authenticate()
        
        return {
            "Authorization": f"Token {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    async def upload_document(self, file_content: bytes, filename: str, 
                            title: str, tags: List[str] = None) -> Optional[Dict[str, Any]]:
        """Upload de documento para o Paperless NG"""
        async with httpx.AsyncClient() as client:
            try:
                headers = await self.get_headers()
                headers.pop("Content-Type")  # Remover para multipart
                
                # Preparar arquivo para upload
                files = {
                    "document": (filename, file_content, "application/pdf")
                }
                
                data = {
                    "title": title,
                }
                
                if tags:
                    # Criar tags se não existirem
                    tag_ids = []
                    for tag_name in tags:
                        tag_id = await self.create_or_get_tag(tag_name)
                        if tag_id:
                            tag_ids.append(tag_id)
                    
                    if tag_ids:
                        data["tags"] = tag_ids
                
                response = await client.post(
                    f"{self.base_url}/api/documents/post_document/",
                    headers=headers,
                    files=files,
                    data=data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # Retornar informações do documento criado
                    return {
                        "document_id": result.get("id"),
                        "title": result.get("title"),
                        "url": f"{self.base_url}/documents/{result.get('id')}/",
                        "created": result.get("created")
                    }
                
                return None
                
            except Exception as e:
                print(f"Erro ao fazer upload do documento: {e}")
                return None
    
    async def get_document(self, document_id: int) -> Optional[Dict[str, Any]]:
        """Obter informações de um documento"""
        async with httpx.AsyncClient() as client:
            try:
                headers = await self.get_headers()
                response = await client.get(
                    f"{self.base_url}/api/documents/{document_id}/",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
                
            except Exception as e:
                print(f"Erro ao obter documento: {e}")
                return None
    
    async def download_document(self, document_id: int) -> Optional[bytes]:
        """Download do arquivo do documento"""
        async with httpx.AsyncClient() as client:
            try:
                headers = await self.get_headers()
                response = await client.get(
                    f"{self.base_url}/api/documents/{document_id}/download/",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.content
                return None
                
            except Exception as e:
                print(f"Erro ao fazer download do documento: {e}")
                return None
    
    async def search_documents(self, query: str, tags: List[str] = None) -> List[Dict[str, Any]]:
        """Buscar documentos"""
        async with httpx.AsyncClient() as client:
            try:
                headers = await self.get_headers()
                
                params = {
                    "query": query,
                    "page_size": 50
                }
                
                if tags:
                    params["tags__name__in"] = ",".join(tags)
                
                response = await client.get(
                    f"{self.base_url}/api/documents/",
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    return response.json().get("results", [])
                return []
                
            except Exception as e:
                print(f"Erro ao buscar documentos: {e}")
                return []
    
    async def create_or_get_tag(self, tag_name: str) -> Optional[int]:
        """Criar tag se não existir ou obter ID da tag existente"""
        async with httpx.AsyncClient() as client:
            try:
                headers = await self.get_headers()
                
                # Verificar se tag já existe
                response = await client.get(
                    f"{self.base_url}/api/tags/",
                    headers=headers,
                    params={"name": tag_name}
                )
                
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    for tag in results:
                        if tag["name"] == tag_name:
                            return tag["id"]
                
                # Criar nova tag
                tag_data = {
                    "name": tag_name,
                    "color": "#3498db"  # Cor padrão
                }
                
                response = await client.post(
                    f"{self.base_url}/api/tags/",
                    headers=headers,
                    json=tag_data
                )
                
                if response.status_code == 201:
                    return response.json().get("id")
                
                return None
                
            except Exception as e:
                print(f"Erro ao criar/obter tag: {e}")
                return None
    
    async def delete_document(self, document_id: int) -> bool:
        """Deletar documento"""
        async with httpx.AsyncClient() as client:
            try:
                headers = await self.get_headers()
                response = await client.delete(
                    f"{self.base_url}/api/documents/{document_id}/",
                    headers=headers
                )
                
                return response.status_code == 204
                
            except Exception as e:
                print(f"Erro ao deletar documento: {e}")
                return False