from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/gabifamilydocs"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External Services
    KEYCLOAK_URL: str = "http://keycloak:8080"
    KEYCLOAK_REALM: str = "gabifamilydocs"
    KEYCLOAK_CLIENT_ID: str = "gabifamilydocs-client"
    KEYCLOAK_CLIENT_SECRET: Optional[str] = None
    KEYCLOAK_ADMIN_USERNAME: str = "admin"
    KEYCLOAK_ADMIN_PASSWORD: str = "admin"
    
    PAPERLESS_URL: str = "http://paperless-ng:8000"
    PAPERLESS_USERNAME: str = "admin"
    PAPERLESS_PASSWORD: str = "admin"
    
    OLLAMA_URL: str = "http://ollama:11434"
    
    # Application
    PROJECT_NAME: str = "GabiFamilyDocs"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://frontend:3000"
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()