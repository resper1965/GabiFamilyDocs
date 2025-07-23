#!/usr/bin/env python3
"""
Script para testar conexões com serviços externos
"""

import asyncio
import httpx
from sqlalchemy import create_engine, text
from app.core.config import settings

async def test_database():
    """Testa conexão com o banco de dados"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Conexão com banco de dados: OK")
            return True
    except Exception as e:
        print(f"❌ Erro na conexão com banco de dados: {e}")
        return False

async def test_keycloak():
    """Testa conexão com Keycloak"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.KEYCLOAK_URL}/health")
            if response.status_code == 200:
                print("✅ Conexão com Keycloak: OK")
                return True
            else:
                print(f"❌ Keycloak retornou status: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Erro na conexão com Keycloak: {e}")
        return False

async def test_paperless():
    """Testa conexão com Paperless NG"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.PAPERLESS_URL}/api/")
            if response.status_code in [200, 401]:  # 401 é OK pois não estamos autenticados
                print("✅ Conexão com Paperless NG: OK")
                return True
            else:
                print(f"❌ Paperless retornou status: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Erro na conexão com Paperless NG: {e}")
        return False

async def test_ollama():
    """Testa conexão com Ollama"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            if response.status_code == 200:
                print("✅ Conexão com Ollama: OK")
                return True
            else:
                print(f"❌ Ollama retornou status: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Erro na conexão com Ollama: {e}")
        return False

async def main():
    """Executa todos os testes"""
    print("🔍 Testando conexões com serviços externos...")
    print("=" * 50)
    
    results = []
    results.append(await test_database())
    results.append(await test_keycloak())
    results.append(await test_paperless())
    results.append(await test_ollama())
    
    print("=" * 50)
    if all(results):
        print("🎉 Todos os serviços estão acessíveis!")
    else:
        print("⚠️ Alguns serviços não estão acessíveis. Verifique as configurações.")

if __name__ == "__main__":
    asyncio.run(main()) 