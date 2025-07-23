#!/bin/bash

echo "🚀 Iniciando configuração do GabiFamilyDocs..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Subir apenas o PostgreSQL primeiro
echo "📦 Iniciando PostgreSQL..."
docker-compose up -d postgres

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 10

# Verificar se PostgreSQL está acessível
until docker exec gabifamilydocs_postgres pg_isready -U postgres; do
    echo "⏳ Aguardando PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL está pronto!"

# Aplicar migrações
echo "📊 Aplicando migrações do banco de dados..."
cd backend

# Executar migração usando Docker
docker-compose exec postgres psql -U postgres -d gabifamilydocs -c "
-- Verificar se tabelas já existem
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'families'
) as table_exists;
"

# Se a tabela não existir, aplicar migração manual
echo "🔧 Criando estrutura do banco de dados..."

# Conectar ao PostgreSQL e criar tabelas
docker exec -i gabifamilydocs_postgres psql -U postgres -d gabifamilydocs << 'EOF'
-- Create enum types
DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE familyrole AS ENUM ('family_admin', 'family_member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE documenttype AS ENUM ('passport', 'id_card', 'driver_license', 'birth_certificate', 'marriage_certificate', 'diploma', 'visa', 'work_permit', 'residence_permit', 'tax_document', 'bank_statement', 'insurance', 'medical_record', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscriptionplan AS ENUM ('free', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscriptionstatus AS ENUM ('active', 'expired', 'cancelled', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invitationstatus AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create families table
CREATE TABLE IF NOT EXISTS families (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id),
    keycloak_user_id VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    gender gender NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_country VARCHAR(100),
    address_zipcode VARCHAR(20),
    role familyrole DEFAULT 'family_member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL UNIQUE REFERENCES families(id),
    plan subscriptionplan DEFAULT 'free',
    status subscriptionstatus DEFAULT 'active',
    max_members INTEGER DEFAULT 5,
    max_documents INTEGER DEFAULT 100,
    max_ai_requests_per_month INTEGER DEFAULT 10,
    max_storage_mb INTEGER DEFAULT 500,
    current_members INTEGER DEFAULT 0,
    current_documents INTEGER DEFAULT 0,
    current_ai_requests_this_month INTEGER DEFAULT 0,
    current_storage_mb INTEGER DEFAULT 0,
    price_monthly NUMERIC(10,2) DEFAULT 0.00,
    billing_cycle_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    billing_cycle_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id),
    member_id INTEGER NOT NULL REFERENCES family_members(id),
    document_type documenttype NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    issuing_country VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(255),
    issue_date DATE,
    expiration_date DATE,
    paperless_document_id INTEGER,
    paperless_url VARCHAR(500),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status invitationstatus DEFAULT 'pending',
    invited_by_member_id INTEGER NOT NULL REFERENCES family_members(id),
    invited_name VARCHAR(255),
    invited_role VARCHAR(50) DEFAULT 'family_member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    member_id INTEGER REFERENCES family_members(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_families_id ON families(id);
CREATE INDEX IF NOT EXISTS ix_family_members_id ON family_members(id);
CREATE INDEX IF NOT EXISTS ix_subscriptions_id ON subscriptions(id);
CREATE INDEX IF NOT EXISTS ix_documents_id ON documents(id);
CREATE INDEX IF NOT EXISTS ix_invitations_id ON invitations(id);

-- Insert demo data
INSERT INTO families (name, description) 
VALUES ('Família Silva', 'Família de exemplo para demonstração') 
ON CONFLICT DO NOTHING;

EOF

echo "✅ Estrutura do banco criada com sucesso!"

# Voltar ao diretório raiz
cd ..

# Subir todos os serviços
echo "🚀 Iniciando todos os serviços..."
docker-compose up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos serviços
echo "📊 Status dos serviços:"
docker-compose ps

echo ""
echo "🎉 GabiFamilyDocs iniciado com sucesso!"
echo ""
echo "🌐 Acesse os serviços:"
echo "   - Frontend:     http://localhost:3000"
echo "   - Backend API:  http://localhost:8002"
echo "   - Keycloak:     http://localhost:8080"
echo "   - Paperless NG: http://localhost:8001"
echo "   - Ollama:       http://localhost:11434"
echo ""
echo "🔑 Credenciais padrão:"
echo "   - Keycloak Admin: admin / admin"
echo "   - Paperless NG:  admin / admin"
echo ""
echo "📚 Documentação da API: http://localhost:8002/docs"
echo ""

# Baixar modelo do Ollama em background
echo "🤖 Baixando modelo de IA (Mistral) em background..."
docker exec -d gabifamilydocs_ollama ollama pull mistral

echo "✨ Configuração completa! Verifique os logs com: docker-compose logs -f"