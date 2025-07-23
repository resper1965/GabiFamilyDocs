from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .core.config import settings
from .core.database import engine, get_db
from .models import Base
from .api import auth, chat
from .services.keycloak_service import KeycloakService

# Criar tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema de gestão de documentos familiares com IA integrada",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])

@app.on_event("startup")
async def startup_event():
    """Configuração inicial da aplicação"""
    try:
        # Inicializar Keycloak
        keycloak_service = KeycloakService()
        await keycloak_service.create_realm_if_not_exists()
        print("✅ Keycloak configurado com sucesso")
        
    except Exception as e:
        print(f"⚠️ Erro na configuração inicial: {e}")

@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "GabiFamilyDocs API",
        "version": settings.VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check da aplicação"""
    return {
        "status": "healthy",
        "database": "connected",
        "services": {
            "keycloak": settings.KEYCLOAK_URL,
            "paperless": settings.PAPERLESS_URL,
            "ollama": settings.OLLAMA_URL
        }
    }