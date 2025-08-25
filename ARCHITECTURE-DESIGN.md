# Architecture Design - Gabi Family Docs

## BMad Framework - Greenfield Fullstack

### CONTEXT7_QUERY
```yaml
CONTEXT7_QUERY:
  activity: architecture_design
  scope: gabi_family_docs
  complexity: alta
  priority: crítica
  library_ids: [bmad-framework-001, bmad-core-001, bmad-agents-001]
  constraints: [mobile-first, security, scalability, performance, privacy]
  output_range: 3000-6000
  agent: architect
  timestamp: 2025-01-21 16:30:00
  
  QUERY_TEXT: |
    Criar design de arquitetura para Gabi Family Docs:
    - Arquitetura de alto nível
    - Design de componentes
    - Padrões de segurança
    - Estratégias de escalabilidade
    - Tecnologias e frameworks
    - Infraestrutura e deploy
```

## 1. Visão Geral da Arquitetura

### Princípios Arquiteturais
- **Mobile-First**: Interface otimizada para dispositivos móveis
- **Security by Design**: Segurança integrada em todas as camadas
- **Scalability**: Arquitetura preparada para crescimento
- **Performance**: Otimização para experiência do usuário
- **Privacy**: Conformidade com LGPD/GDPR
- **Reliability**: Alta disponibilidade e resiliência

### Arquitetura de Alto Nível
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Admin     │    │   API Gateway   │
│  (React Native) │    │   (Next.js)     │    │   (Kong/AWS)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (AWS ALB)     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend API   │
                    │  (Node.js/Express) │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │   AWS S3/MinIO  │
│   (Primary DB)  │    │   (Cache/Queue) │    │  (File Storage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 2. Arquitetura de Componentes

### Frontend (Mobile App)
```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Loading/
│   ├── documents/
│   │   ├── DocumentCard/
│   │   ├── DocumentViewer/
│   │   ├── DocumentUpload/
│   │   └── DocumentList/
│   ├── alerts/
│   │   ├── AlertCard/
│   │   ├── AlertList/
│   │   └── AlertSettings/
│   ├── family/
│   │   ├── FamilyMemberCard/
│   │   ├── FamilySettings/
│   │   └── InviteMember/
│   └── navigation/
│       ├── BottomTabs/
│       ├── Header/
│       └── SideMenu/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen/
│   │   ├── RegisterScreen/
│   │   └── ForgotPasswordScreen/
│   ├── main/
│   │   ├── DashboardScreen/
│   │   ├── DocumentsScreen/
│   │   ├── AlertsScreen/
│   │   ├── FamilyScreen/
│   │   └── SettingsScreen/
│   └── modals/
│       ├── DocumentDetailsModal/
│       ├── UploadModal/
│       └── AlertModal/
├── hooks/
│   ├── useAuth.ts
│   ├── useDocuments.ts
│   ├── useAlerts.ts
│   ├── useFamily.ts
│   └── useOffline.ts
├── services/
│   ├── api/
│   │   ├── authApi.ts
│   │   ├── documentsApi.ts
│   │   ├── alertsApi.ts
│   │   └── familyApi.ts
│   ├── storage/
│   │   ├── secureStorage.ts
│   │   ├── localStorage.ts
│   │   └── fileStorage.ts
│   └── notifications/
│       ├── pushNotifications.ts
│       └── localNotifications.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   ├── validation.ts
│   └── i18n/
│       ├── pt.ts
│       ├── es.ts
│       └── en.ts
└── types/
    ├── auth.types.ts
    ├── document.types.ts
    ├── alert.types.ts
    └── family.types.ts
```

### Backend (API Server)
```
server/
├── src/
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── DocumentController.ts
│   │   ├── AlertController.ts
│   │   ├── FamilyController.ts
│   │   ├── UserController.ts
│   │   └── AIController.ts
│   ├── middleware/
│   │   ├── auth/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   └── rateLimit.ts
│   │   ├── validation/
│   │   │   ├── documentValidation.ts
│   │   │   ├── userValidation.ts
│   │   │   └── familyValidation.ts
│   │   ├── upload/
│   │   │   ├── fileUpload.ts
│   │   │   └── imageProcessing.ts
│   │   └── security/
│   │       ├── encryption.ts
│   │       ├── sanitization.ts
│   │       └── audit.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Family.ts
│   │   ├── Document.ts
│   │   ├── Alert.ts
│   │   ├── Category.ts
│   │   └── Permission.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── DocumentService.ts
│   │   ├── AlertService.ts
│   │   ├── FamilyService.ts
│   │   ├── StorageService.ts
│   │   ├── AIService.ts
│   │   ├── NotificationService.ts
│   │   └── SecurityService.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── documents.ts
│   │   ├── alerts.ts
│   │   ├── family.ts
│   │   ├── users.ts
│   │   └── ai.ts
│   ├── utils/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── encryption.ts
│   │   ├── validation.ts
│   │   └── logger.ts
│   └── config/
│       ├── database.ts
│       ├── redis.ts
│       ├── aws.ts
│       ├── security.ts
│       └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── api.md
│   ├── deployment.md
│   └── security.md
└── scripts/
    ├── setup.sh
    ├── deploy.sh
    └── backup.sh
```

## 3. Design de Banco de Dados

### Schema Principal
```sql
-- Famílias
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin', 'manager', 'member'
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categorias de documentos
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'document',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentos
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    expiration_date DATE,
    is_encrypted BOOLEAN DEFAULT true,
    encryption_key_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissões de documentos
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permissions VARCHAR(50)[] DEFAULT ARRAY['read'], -- 'read', 'write', 'delete', 'share'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, user_id)
);

-- Alertas
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'expiration', 'security', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Convites de família
CREATE TABLE family_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs de auditoria
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Índices de Performance
```sql
-- Índices para otimização de consultas
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_family_id ON documents(family_id);
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_expiration_date ON documents(expiration_date);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_document_id ON alerts(document_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_audit_logs_family_id ON audit_logs(family_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## 4. Arquitetura de Segurança

### Camadas de Segurança
```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Network Security (HTTPS, WAF, DDoS Protection)          │
├─────────────────────────────────────────────────────────────┤
│ 2. Application Security (Input Validation, Rate Limiting)   │
├─────────────────────────────────────────────────────────────┤
│ 3. Authentication & Authorization (JWT, RBAC, MFA)         │
├─────────────────────────────────────────────────────────────┤
│ 4. Data Encryption (AES-256, TLS 1.3)                      │
├─────────────────────────────────────────────────────────────┤
│ 5. Audit & Monitoring (Logs, Alerts, Compliance)           │
└─────────────────────────────────────────────────────────────┘
```

### Estratégias de Criptografia
- **Em Trânsito**: TLS 1.3 para todas as comunicações
- **Em Repouso**: AES-256 para dados sensíveis
- **Arquivos**: Criptografia individual por documento
- **Chaves**: Gerenciamento seguro com AWS KMS
- **Senhas**: bcrypt com salt rounds 12

### Controle de Acesso (RBAC)
```typescript
enum UserRole {
  ADMIN = 'admin',        // Gestor da plataforma
  MANAGER = 'manager',    // Gestor da família
  MEMBER = 'member'       // Usuário (familiar)
}

enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  MANAGE_FAMILY = 'manage_family',
  MANAGE_USERS = 'manage_users'
}

interface RolePermissions {
  [UserRole.ADMIN]: Permission[];
  [UserRole.MANAGER]: Permission[];
  [UserRole.MEMBER]: Permission[];
}
```

## 5. Estratégias de Escalabilidade

### Escalabilidade Horizontal
- **Load Balancing**: AWS Application Load Balancer
- **Auto Scaling**: Grupos de instâncias EC2
- **Database**: Read replicas e sharding
- **Cache**: Redis Cluster para alta disponibilidade

### Escalabilidade Vertical
- **Performance**: Otimização de queries e índices
- **Storage**: Compressão e deduplicação
- **CDN**: Distribuição global de conteúdo
- **Monitoring**: Métricas em tempo real

### Padrões de Resiliência
- **Circuit Breaker**: Para chamadas externas
- **Retry Logic**: Com backoff exponencial
- **Fallback**: Serviços degradados
- **Health Checks**: Monitoramento contínuo

## 6. Tecnologias e Frameworks

### Frontend (Mobile)
- **Framework**: React Native 0.72+
- **State Management**: Zustand
- **Navigation**: React Navigation 6
- **UI Components**: NativeBase ou React Native Elements
- **File Handling**: React Native Document Picker
- **PDF Viewer**: React Native PDF
- **Push Notifications**: Expo Notifications
- **Offline Support**: React Native NetInfo + AsyncStorage

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **File Storage**: AWS S3 ou MinIO
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **API Documentation**: Swagger/OpenAPI

### DevOps
- **Container**: Docker
- **Orchestration**: Docker Compose (dev) / Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + DataDog
- **Logs**: Winston + ELK Stack
- **Security**: SonarQube + Snyk

## 7. Infraestrutura e Deploy

### Ambiente de Desenvolvimento
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Dev     │    │   Docker Compose│    │   Hot Reload    │
│   Environment   │    │   Environment   │    │   Development   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Ambiente de Produção (AWS)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Route 53      │    │   CloudFront    │    │   S3 (Static)   │
│   (DNS)         │    │   (CDN)         │    │   (Files)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   ALB           │
                    │   (Load Balancer) │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ECS Fargate   │    │   RDS           │    │   ElastiCache   │
│   (API)         │    │   (PostgreSQL)  │    │   (Redis)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Estratégia de Deploy
- **Blue-Green Deployment**: Zero downtime
- **Canary Releases**: Deploy gradual
- **Rollback Strategy**: Reversão rápida
- **Database Migrations**: Versionamento seguro

## 8. Monitoramento e Observabilidade

### Métricas de Aplicação
- **Performance**: Response time, throughput
- **Erros**: Error rate, error types
- **Usuários**: Active users, session duration
- **Business**: Document uploads, alerts sent

### Logs Estruturados
```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  userId?: string;
  familyId?: string;
  action: string;
  details: Record<string, any>;
  traceId: string;
}
```

### Alertas Automáticos
- **Infraestrutura**: CPU, memory, disk usage
- **Aplicação**: Error rate > 5%, response time > 2s
- **Segurança**: Failed login attempts, suspicious activity
- **Business**: Document upload failures, alert delivery issues

## 9. Próximos Passos

### Imediatos (Esta Semana)
1. **Setup do Ambiente de Desenvolvimento**
2. **Criação da Estrutura Base do Projeto**
3. **Configuração de Banco de Dados**
4. **Implementação do Sistema de Autenticação**

### Curto Prazo (Próximas 2 Semanas)
1. **API Base com CRUD de Documentos**
2. **Sistema de Upload e Armazenamento**
3. **Interface Mobile Básica**
4. **Sistema de Alertas Simples**

### Médio Prazo (Próximos 2 Meses)
1. **MVP Completo**
2. **Testes de Segurança**
3. **Deploy de Produção**
4. **Monitoramento e Otimizações**

---

**Responsável**: BMad Architect + Context7
**Data**: 2025-01-21
**Versão**: 1.0.0
