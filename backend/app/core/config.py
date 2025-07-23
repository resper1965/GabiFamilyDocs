from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:ff86f0a7d8d27245d419@gabi-family-docs_keycloak-db:5432/gabi-family-docs?sslmode=disable"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External Services
    KEYCLOAK_URL: str = "http://gabi-family-docs_keycloak:8080"
    KEYCLOAK_REALM: str = "gabi-family-docs"
    KEYCLOAK_CLIENT_ID: str = "gabi-family-docs-client"
    KEYCLOAK_CLIENT_SECRET: Optional[str] = None
    KEYCLOAK_ADMIN_USERNAME: str = "resper@ness.com.br"
    KEYCLOAK_ADMIN_PASSWORD: str = "Gordinh@29"
    
    PAPERLESS_URL: str = "https://localhost"
    PAPERLESS_USERNAME: str = "admin"
    PAPERLESS_PASSWORD: str = "password"
    PAPERLESS_SECRET_KEY: str = "4e7871a71025723d02cb3f5940759a06"
    
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
