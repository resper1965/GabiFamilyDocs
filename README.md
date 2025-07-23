# GabiFamilyDocs

Sistema completo de gestão de documentos familiares com IA integrada, desenvolvido com FastAPI (backend) e React (frontend), utilizando Keycloak para autenticação, Paperless NG para gestão eletrônica de documentos e Ollama para IA local.

## 🚀 Características Principais

### 📄 Gestão de Documentos
- **Por membro da família**: Organização completa de documentos por pessoa
- **Campos estruturados**: Tipo, número, país emissor, data de emissão, validade
- **Suporte multinacional**: Documentos de múltiplos países
- **Alertas de vencimento**: Notificações automáticas para renovação
- **Integração com Paperless NG**: Armazenamento e busca de documentos digitalizados

### 👤 Cadastro de Membros
- **Dados completos**: Nome, nascimento, gênero, nacionalidade, email
- **Endereço completo**: Rua, número, cidade, estado, país, CEP
- **Associação familiar**: Membros organizados por família
- **Controle de acesso**: Diferentes níveis de permissão por membro

### 💬 Chat com IA (Ollama)
- **Consultas naturais**: "Quando vence o passaporte da Louise?"
- **Contexto inteligente**: IA acessa dados reais dos documentos
- **Geração de documentos**: Criação automática de autorizações, declarações
- **Templates dinâmicos**: Baseados em dados do membro e templates
- **Integração completa**: Documentos gerados são enviados ao Paperless NG

### 🔐 Autenticação e RBAC (Keycloak)
- **JWT seguro**: Tokens emitidos pelo Keycloak
- **Três níveis de acesso**:
  - `platform_admin`: Gerencia famílias, convites, planos
  - `family_admin`: Gerencia membros e documentos da família
  - `family_member`: Acessa apenas seus próprios dados
- **Convites controlados**: Sistema de convites que cria usuários via API

### 💰 Sistema de Monetização
- **Planos Free/Premium**: Controle de limites por família
- **Limites inteligentes**: Número de membros, documentos, IA, espaço
- **Billing integrado**: Controle de assinatura e faturamento

## 🏗️ Arquitetura

### Stack Tecnológica
- **Backend**: FastAPI (Python)
- **Frontend**: React SPA com TypeScript
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Keycloak (JWT + RBAC)
- **GED**: Paperless NG (API REST)
- **IA**: Ollama (Mistral/Llama3 local)
- **Containerização**: Docker + Docker Compose

### Infraestrutura
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│   React SPA     │◄──►│   FastAPI       │◄──►│   Database      │
│   Port 3000     │    │   Port 8002     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Keycloak      │              │
         │              │   Auth Server   │              │
         │              │   Port 8080     │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Paperless NG  │    │   Ollama        │    │   Redis         │
│   GED System    │    │   AI Local      │    │   Cache         │
│   Port 8001     │    │   Port 11434    │    │   Port 6379     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Docker e Docker Compose
- Git
- 8GB RAM mínimo (para Ollama)
- 20GB espaço em disco

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd gabifamilydocs
```

### 2. Configuração do Ambiente
```bash
# Criar arquivo de ambiente (opcional)
cp .env.example .env

# Editar configurações se necessário
nano .env
```

### 3. Iniciar Todos os Serviços
```bash
# Subir toda a infraestrutura
docker-compose up -d

# Verificar status dos containers
docker-compose ps
```

### 4. Configuração Inicial

#### Aguardar Inicialização (primeiro boot)
```bash
# Acompanhar logs do backend para ver configuração do Keycloak
docker-compose logs -f backend

# Aguardar mensagem: "✅ Keycloak configurado com sucesso"
```

#### Baixar Modelo de IA (Ollama)
```bash
# Entrar no container do Ollama
docker exec -it gabifamilydocs_ollama ollama pull mistral

# Ou llama3 (maior, mas mais capaz)
docker exec -it gabifamilydocs_ollama ollama pull llama3
```

### 5. Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8002
- **Keycloak**: http://localhost:8080
- **Paperless NG**: http://localhost:8001
- **Ollama**: http://localhost:11434

### Credenciais Padrão

**Keycloak Admin:**
- URL: http://localhost:8080
- Usuário: `admin`
- Senha: `admin`

**Paperless NG:**
- URL: http://localhost:8001
- Usuário: `admin`
- Senha: `admin`

## 📊 Modelos de Dados

### Família
```python
class Family:
    id: int
    name: str
    description: str
    created_at: datetime
    is_active: bool
```

### Membro da Família
```python
class FamilyMember:
    id: int
    family_id: int
    keycloak_user_id: str
    full_name: str
    birth_date: date
    gender: Gender
    nationality: str
    email: str
    # Endereço completo
    address_*: str
    role: FamilyRole  # ADMIN, MEMBER
```

### Documento
```python
class Document:
    id: int
    family_id: int
    member_id: int
    document_type: DocumentType
    document_number: str
    issuing_country: str
    issue_date: date
    expiration_date: date
    # Integração Paperless NG
    paperless_document_id: int
    paperless_url: str
```

### Assinatura
```python
class Subscription:
    id: int
    family_id: int
    plan: SubscriptionPlan  # FREE, PREMIUM
    # Limites
    max_members: int
    max_documents: int
    max_ai_requests_per_month: int
    # Uso atual
    current_*: int
```

## 🔌 APIs Principais

### Autenticação
```http
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

### Chat com IA
```http
POST /api/v1/chat/query
POST /api/v1/chat/generate-document
GET  /api/v1/chat/models
```

### Exemplo de Uso da API

#### Login
```bash
curl -X POST "http://localhost:8002/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=usuario@email.com&password=senha123"
```

#### Consulta via IA
```bash
curl -X POST "http://localhost:8002/api/v1/chat/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "quando vence o passaporte da Louise?",
    "context_member_id": 3
  }'
```

#### Gerar Documento via IA
```bash
curl -X POST "http://localhost:8002/api/v1/chat/generate-document" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": 3,
    "document_type": "authorization",
    "title": "Autorização de Viagem para Europa",
    "additional_info": "Viagem de férias para França e Espanha"
  }'
```

## 🎯 Fluxos de Uso

### 1. Primeiro Acesso (Admin da Família)
1. Acessar aplicação → Redirect para Keycloak
2. Login com credenciais → Criar conta se necessário
3. Sistema cria família automaticamente
4. Cadastrar membros da família
5. Adicionar documentos por membro
6. Usar chat IA para consultas

### 2. Convite de Novo Membro
1. Admin família cria convite por email
2. Sistema gera token único e envia convite
3. Usuário clica no link → Formulário de cadastro
4. Sistema cria usuário no Keycloak automaticamente
5. Membro acessa com role `family_member`

### 3. Geração de Documento via IA
1. Acessar Chat → Clicar "Gerar Documento"
2. Selecionar membro, tipo e informações
3. IA processa dados + template → Gera conteúdo
4. Sistema cria PDF → Upload automático Paperless NG
5. Retorna link de acesso ao documento

## 🛡️ Segurança

### Autenticação
- JWT tokens emitidos pelo Keycloak
- Refresh automático de tokens
- Logout global via Keycloak

### Autorização
- RBAC granular por endpoint
- Verificação de família (isolamento de dados)
- Middleware de autenticação em todas as rotas protegidas

### Dados
- Isolamento por família
- Criptografia em trânsito (HTTPS em produção)
- Backup automático do PostgreSQL

## 📱 Frontend (React)

### Estrutura
```
frontend/src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas principais
├── contexts/           # Context API (Auth)
├── services/           # APIs e integrações
├── hooks/              # Custom hooks
└── utils/              # Utilitários
```

### Componentes Principais
- **Layout**: Sidebar responsiva com navegação por roles
- **AuthContext**: Integração completa com Keycloak
- **ChatPage**: Interface de chat com IA + geração de documentos
- **DashboardPage**: Visão geral com estatísticas e alertas

### Design System
- **Material-UI**: Componentes consistentes
- **Responsive**: Mobile-first design
- **Temas**: Personalizáveis via MUI Theme

## 🐳 Docker e Desenvolvimento

### Desenvolvimento Local
```bash
# Backend only
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only
cd frontend
npm install
npm start
```

### Produção
```bash
# Build de produção
docker-compose -f docker-compose.prod.yml up -d

# Variáveis de ambiente para produção
export DATABASE_URL="postgresql://..."
export KEYCLOAK_URL="https://auth.domain.com"
export SECRET_KEY="production-secret-key"
```

### Backup e Restore
```bash
# Backup do banco
docker exec gabifamilydocs_postgres pg_dump -U postgres gabifamilydocs > backup.sql

# Restore
cat backup.sql | docker exec -i gabifamilydocs_postgres psql -U postgres gabifamilydocs
```

## 🔧 Troubleshooting

### Problemas Comuns

#### Ollama não responde
```bash
# Verificar se o modelo foi baixado
docker exec gabifamilydocs_ollama ollama list

# Baixar modelo se necessário
docker exec gabifamilydocs_ollama ollama pull mistral
```

#### Keycloak não inicializa
```bash
# Verificar logs
docker-compose logs keycloak

# Reset do container se necessário
docker-compose down
docker volume rm gabifamilydocs_postgres_data
docker-compose up -d
```

#### Frontend não conecta ao backend
- Verificar proxy no `package.json`
- Verificar variáveis de ambiente
- Verificar CORS no backend

### Logs
```bash
# Ver todos os logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f keycloak
```

## 🎯 Roadmap

### Versão 1.1
- [ ] CRUD completo de membros e documentos via UI
- [ ] Sistema de notificações de vencimento
- [ ] Upload de arquivos via interface
- [ ] Busca avançada de documentos

### Versão 1.2
- [ ] Sistema de convites via email
- [ ] Dashboard administrativo para platform_admin
- [ ] Relatórios e analytics
- [ ] Integração com sistemas de pagamento

### Versão 2.0
- [ ] Mobile app (React Native)
- [ ] OCR automático de documentos
- [ ] IA para extração automática de dados
- [ ] Integração com APIs governamentais

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Email: suporte@gabifamilydocs.com

---

**GabiFamilyDocs** - Gestão inteligente de documentos familiares com IA 🚀