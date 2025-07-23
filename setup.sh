#!/bin/bash

# GabiFamilyDocs Setup Script
echo "🚀 Iniciando setup do GabiFamilyDocs..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado baseado no .env.example"
else
    echo "ℹ️ Arquivo .env já existe"
fi

# Iniciar serviços
echo "🐳 Iniciando containers Docker..."
docker-compose up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços iniciarem..."
sleep 30

# Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose ps

# Aguardar Keycloak estar pronto
echo "⏳ Aguardando Keycloak ficar pronto..."
until curl -f http://localhost:8080/auth/realms/master > /dev/null 2>&1; do
    printf '.'
    sleep 5
done
echo ""
echo "✅ Keycloak está pronto"

# Aguardar backend configurar Keycloak
echo "⏳ Aguardando configuração automática do Keycloak..."
sleep 15

# Verificar se o modelo Ollama precisa ser baixado
echo "🤖 Verificando modelo de IA..."
if ! docker exec gabifamilydocs_ollama ollama list | grep -q mistral; then
    echo "📦 Baixando modelo Mistral (isso pode demorar alguns minutos)..."
    docker exec gabifamilydocs_ollama ollama pull mistral
    echo "✅ Modelo Mistral baixado"
else
    echo "✅ Modelo Mistral já disponível"
fi

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📍 URLs de acesso:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:8002"
echo "   Keycloak:     http://localhost:8080"
echo "   Paperless NG: http://localhost:8001"
echo "   Ollama:       http://localhost:11434"
echo ""
echo "🔑 Credenciais padrão:"
echo "   Keycloak Admin: admin / admin"
echo "   Paperless NG:   admin / admin"
echo ""
echo "📚 Para mais informações, consulte o README.md"
echo ""
echo "💡 Dica: Use 'docker-compose logs -f' para acompanhar os logs"
