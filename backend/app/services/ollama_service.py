import httpx
from typing import Optional, Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
from datetime import datetime
from ..core.config import settings

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.default_model = "mistral"  # Pode ser alterado para llama3
    
    async def check_model_availability(self, model_name: str = None) -> bool:
        """Verificar se o modelo está disponível"""
        model = model_name or self.default_model
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return any(m["name"].startswith(model) for m in models)
                return False
            except Exception as e:
                print(f"Erro ao verificar modelo: {e}")
                return False
    
    async def pull_model(self, model_name: str = None) -> bool:
        """Baixar modelo se não estiver disponível"""
        model = model_name or self.default_model
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 minutos para download
            try:
                response = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model}
                )
                return response.status_code == 200
            except Exception as e:
                print(f"Erro ao baixar modelo: {e}")
                return False
    
    async def generate_text(self, prompt: str, model_name: str = None, 
                          max_tokens: int = 1000) -> Optional[str]:
        """Gerar texto usando Ollama"""
        model = model_name or self.default_model
        
        # Verificar se modelo está disponível
        if not await self.check_model_availability(model):
            print(f"Modelo {model} não disponível, tentando baixar...")
            if not await self.pull_model(model):
                return None
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": 0.7
                    }
                }
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "").strip()
                
                return None
                
            except Exception as e:
                print(f"Erro ao gerar texto: {e}")
                return None
    
    async def chat_with_context(self, messages: List[Dict[str, str]], 
                               model_name: str = None) -> Optional[str]:
        """Chat com contexto de conversa"""
        model = model_name or self.default_model
        
        # Verificar se modelo está disponível
        if not await self.check_model_availability(model):
            if not await self.pull_model(model):
                return None
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                payload = {
                    "model": model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7
                    }
                }
                
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("message", {}).get("content", "").strip()
                
                return None
                
            except Exception as e:
                print(f"Erro no chat: {e}")
                return None
    
    async def answer_document_query(self, query: str, member_data: Dict[str, Any] = None,
                                  documents_context: List[Dict[str, Any]] = None) -> Optional[str]:
        """Responder consulta sobre documentos de um membro"""
        try:
            # Construir contexto
            context_parts = []
            
            if member_data:
                context_parts.append(f"Dados do membro: {member_data.get('full_name', 'N/A')}")
                context_parts.append(f"Nascimento: {member_data.get('birth_date', 'N/A')}")
                context_parts.append(f"Nacionalidade: {member_data.get('nationality', 'N/A')}")
            
            if documents_context:
                context_parts.append("\nDocumentos:")
                for doc in documents_context:
                    doc_info = f"- {doc.get('title', 'N/A')} ({doc.get('document_type', 'N/A')})"
                    if doc.get('expiration_date'):
                        doc_info += f" - Vence em: {doc.get('expiration_date')}"
                    context_parts.append(doc_info)
            
            context = "\n".join(context_parts)
            
            prompt = f"""
            Contexto:
            {context}
            
            Pergunta: {query}
            
            Responda de forma clara e direta, baseando-se apenas nas informações fornecidas.
            Se não houver informações suficientes, informe isso ao usuário.
            """
            
            return await self.generate_text(prompt)
            
        except Exception as e:
            print(f"Erro ao responder consulta: {e}")
            return None
    
    async def generate_document_content(self, document_type: str, member_data: Dict[str, Any],
                                      additional_info: str = "") -> Optional[str]:
        """Gerar conteúdo de documento baseado em template e dados do membro"""
        try:
            member_name = member_data.get('full_name', 'N/A')
            birth_date = member_data.get('birth_date', 'N/A')
            nationality = member_data.get('nationality', 'N/A')
            
            templates = {
                "authorization": f"""
                Gere uma autorização de viagem para menor de idade com as seguintes informações:
                - Nome do menor: {member_name}
                - Data de nascimento: {birth_date}
                - Nacionalidade: {nationality}
                
                Informações adicionais: {additional_info}
                
                O documento deve ser formal e incluir todos os campos necessários para uma autorização de viagem.
                """,
                
                "declaration": f"""
                Gere uma declaração formal com as seguintes informações:
                - Nome: {member_name}
                - Data de nascimento: {birth_date}
                - Nacionalidade: {nationality}
                
                Objetivo da declaração: {additional_info}
                
                O documento deve ser formal e apropriado para uso oficial.
                """,
                
                "certificate": f"""
                Gere um modelo de certificado/atestado com as seguintes informações:
                - Nome: {member_name}
                - Data de nascimento: {birth_date}
                - Nacionalidade: {nationality}
                
                Detalhes do certificado: {additional_info}
                
                O documento deve seguir padrões formais de certificação.
                """
            }
            
            template = templates.get(document_type, templates["declaration"])
            
            return await self.generate_text(template, max_tokens=1500)
            
        except Exception as e:
            print(f"Erro ao gerar conteúdo do documento: {e}")
            return None
    
    def create_pdf_from_text(self, content: str, title: str = "Documento") -> bytes:
        """Criar PDF a partir de texto"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                spaceAfter=30,
                alignment=1  # Center alignment
            )
            
            normal_style = styles['Normal']
            normal_style.fontSize = 12
            normal_style.spaceAfter = 12
            
            # Construir documento
            story = []
            
            # Título
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 12))
            
            # Data
            date_str = datetime.now().strftime("%d/%m/%Y")
            story.append(Paragraph(f"Data: {date_str}", normal_style))
            story.append(Spacer(1, 12))
            
            # Conteúdo
            paragraphs = content.split('\n\n')
            for para in paragraphs:
                if para.strip():
                    story.append(Paragraph(para.strip(), normal_style))
                    story.append(Spacer(1, 12))
            
            doc.build(story)
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            print(f"Erro ao criar PDF: {e}")
            return None
