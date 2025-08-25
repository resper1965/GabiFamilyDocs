# SaaS Multitenancy + WhatsApp Integration - Gabi Family Docs

## 🏢 **SaaS Multitenancy com WhatsApp Integration**

### CONTEXT7_QUERY
```yaml
CONTEXT7_QUERY:
  activity: saas_multitenancy_whatsapp_integration
  scope: gabi_family_docs_saas_platform
  complexity: crítica
  priority: máxima
  library_ids: [/supabase/supabase, /ollama/ollama, /whatsapp-business-api]
  constraints: [multitenancy, whatsapp-integration, authentication, privacy, scalability]
  output_range: 5000-8000
  agent: bmad_architect
  timestamp: 2025-01-21 20:00:00
  
  QUERY_TEXT: |
    SaaS multitenancy com integração WhatsApp para Gabi Family Docs:
    - Arquitetura multitenancy com isolamento de dados
    - Integração WhatsApp Business API
    - Sistema de autenticação para WhatsApp
    - Chatbot IA via WhatsApp
    - Escalabilidade e segurança
```

## 🎯 **1. ARQUITETURA SAAS MULTITENANCY**

### **Visão Geral da Plataforma**
```
🌐 SaaS Platform (Gabi Family Docs)
    ↓
🏢 Multi-Tenant Architecture
    ↓
📱 WhatsApp Business API Integration
    ↓
🤖 Ollama AI Chatbot (Per Tenant)
    ↓
🗄️ Supabase (Isolated Data per Tenant)
    ↓
📄 Paperless-ngx (Per Tenant)
```

### **Estrutura Multitenancy**
```sql
-- ========================================
-- SAAS MULTITENANCY SCHEMA
-- ========================================

-- Tabela de organizações (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL, -- subdomain: gabi-family-docs.com/org-slug
  plan_type VARCHAR(20) DEFAULT 'free', -- 'free', 'basic', 'premium', 'enterprise'
  max_members INTEGER DEFAULT 5,
  max_documents INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 1,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone VARCHAR(20),
  whatsapp_business_id VARCHAR(100),
  api_key VARCHAR(255),
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários da plataforma
CREATE TABLE platform_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user', 'support'
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros da organização (relacionamento user-org)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES platform_users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member', 'guest'
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Tabela de convites para organizações
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  invited_by UUID REFERENCES platform_users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações WhatsApp por organização
CREATE TABLE whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  business_account_id VARCHAR(100),
  access_token VARCHAR(500),
  webhook_url VARCHAR(255),
  is_active BOOLEAN DEFAULT false,
  last_verified TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões WhatsApp
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  user_name VARCHAR(100),
  is_authenticated BOOLEAN DEFAULT false,
  authentication_method VARCHAR(50), -- 'phone_verification', 'email_link', 'admin_approval'
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de mensagens WhatsApp
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_phone VARCHAR(20) NOT NULL,
  to_phone VARCHAR(20) NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- 'text', 'document', 'image', 'audio'
  content TEXT,
  media_url VARCHAR(500),
  intent_data JSONB,
  ai_response JSONB,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MODIFICAÇÃO DAS TABELAS EXISTENTES PARA MULTITENANCY
-- ========================================

-- Adicionar organization_id em todas as tabelas existentes
ALTER TABLE families ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE family_members ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE addresses ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE phones ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE personal_documents ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE document_categories ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE reminders ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE chat_history ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Índices para performance multitenancy
CREATE INDEX idx_families_org_id ON families(organization_id);
CREATE INDEX idx_family_members_org_id ON family_members(organization_id);
CREATE INDEX idx_addresses_org_id ON addresses(organization_id);
CREATE INDEX idx_phones_org_id ON phones(organization_id);
CREATE INDEX idx_personal_documents_org_id ON personal_documents(organization_id);
CREATE INDEX idx_documents_org_id ON documents(organization_id);
CREATE INDEX idx_document_categories_org_id ON document_categories(organization_id);
CREATE INDEX idx_reminders_org_id ON reminders(organization_id);
CREATE INDEX idx_chat_history_org_id ON chat_history(organization_id);
CREATE INDEX idx_whatsapp_sessions_org_id ON whatsapp_sessions(organization_id);
CREATE INDEX idx_whatsapp_messages_org_id ON whatsapp_messages(organization_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) MULTITENANCY
-- ========================================

-- Política para organizações
CREATE POLICY "Users can view own organization" ON organizations
  FOR ALL USING (id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Política para famílias (por organização)
CREATE POLICY "Users can view own organization families" ON families
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Política para membros da família (por organização)
CREATE POLICY "Users can view own organization family members" ON family_members
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Política para documentos (por organização)
CREATE POLICY "Users can view own organization documents" ON documents
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Política para sessões WhatsApp (por organização)
CREATE POLICY "Users can view own organization whatsapp sessions" ON whatsapp_sessions
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Política para mensagens WhatsApp (por organização)
CREATE POLICY "Users can view own organization whatsapp messages" ON whatsapp_messages
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));
```

---

## 📱 **2. INTEGRAÇÃO WHATSAPP BUSINESS API**

### **Arquitetura WhatsApp**
```typescript
// services/whatsapp/WhatsAppService.ts
import { WhatsAppBusinessAPI } from 'whatsapp-business-api'
import { OllamaService } from '../ollama/OllamaService'
import { FamilyDataManager } from '../family/FamilyDataManager'

export class WhatsAppService {
  private whatsappAPI: WhatsAppBusinessAPI
  private ollamaService: OllamaService
  private familyDataManager: FamilyDataManager

  constructor(organizationId: string) {
    this.whatsappAPI = new WhatsAppBusinessAPI({
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
    })
    this.ollamaService = new OllamaService(organizationId)
    this.familyDataManager = new FamilyDataManager(organizationId)
  }

  // Processar mensagem recebida
  async handleIncomingMessage(message: any) {
    try {
      const { from, text, type, timestamp } = message
      
      // 1. Verificar se é uma sessão válida
      const session = await this.getOrCreateSession(from, organizationId)
      
      // 2. Se não autenticado, iniciar processo de autenticação
      if (!session.is_authenticated) {
        return await this.handleAuthentication(session, text)
      }
      
      // 3. Processar com IA
      const aiResponse = await this.ollamaService.chatWithFamilyData(
        text, 
        { session, organizationId }
      )
      
      // 4. Enviar resposta
      await this.sendMessage(from, aiResponse.response)
      
      // 5. Salvar no histórico
      await this.saveMessage({
        sessionId: session.id,
        fromPhone: from,
        content: text,
        aiResponse: aiResponse,
        messageType: 'text'
      })
      
    } catch (error) {
      console.error('Erro ao processar mensagem WhatsApp:', error)
      await this.sendMessage(from, 'Desculpe, ocorreu um erro. Tente novamente.')
    }
  }

  // Autenticação via WhatsApp
  async handleAuthentication(session: any, message: string) {
    const phone = session.user_phone
    
    // Método 1: Verificação por código SMS
    if (message.startsWith('/auth ')) {
      const code = message.split(' ')[1]
      return await this.verifySMSCode(session, code)
    }
    
    // Método 2: Verificação por email
    if (message.startsWith('/email ')) {
      const email = message.split(' ')[1]
      return await this.verifyEmail(session, email)
    }
    
    // Método 3: Aprovação por admin
    if (message.startsWith('/admin ')) {
      const adminCode = message.split(' ')[1]
      return await this.verifyAdminCode(session, adminCode)
    }
    
    // Enviar instruções de autenticação
    const authInstructions = `
🔐 **Autenticação Necessária**

Para usar o Gabi Family Docs via WhatsApp, você precisa se autenticar:

📱 **Opção 1 - Código SMS:**
Digite: /auth [código recebido por SMS]

📧 **Opção 2 - Email:**
Digite: /email [seu email cadastrado]

👨‍💼 **Opção 3 - Código Admin:**
Digite: /admin [código fornecido pelo administrador]

Qual opção você prefere?
    `
    
    await this.sendMessage(session.user_phone, authInstructions)
  }

  // Verificar código SMS
  async verifySMSCode(session: any, code: string) {
    // Implementar verificação de código SMS
    const isValid = await this.validateSMSCode(session.user_phone, code)
    
    if (isValid) {
      await this.authenticateSession(session.id)
      await this.sendMessage(session.user_phone, '✅ Autenticação realizada com sucesso! Agora você pode usar o Gabi Family Docs.')
    } else {
      await this.sendMessage(session.user_phone, '❌ Código inválido. Tente novamente ou use outra opção de autenticação.')
    }
  }

  // Verificar email
  async verifyEmail(session: any, email: string) {
    // Verificar se o email existe na organização
    const user = await this.findUserByEmail(email, session.organization_id)
    
    if (user) {
      // Enviar link de autenticação por email
      const authLink = await this.generateEmailAuthLink(session.id, email)
      await this.sendAuthEmail(email, authLink)
      
      await this.sendMessage(session.user_phone, 
        '📧 Link de autenticação enviado para seu email. Clique no link para confirmar.'
      )
    } else {
      await this.sendMessage(session.user_phone, 
        '❌ Email não encontrado nesta organização. Verifique ou use outra opção.'
      )
    }
  }

  // Verificar código admin
  async verifyAdminCode(session: any, adminCode: string) {
    // Verificar se o código admin é válido
    const isValid = await this.validateAdminCode(session.organization_id, adminCode)
    
    if (isValid) {
      await this.authenticateSession(session.id)
      await this.sendMessage(session.user_phone, 
        '✅ Autenticação aprovada pelo administrador! Bem-vindo ao Gabi Family Docs.'
      )
    } else {
      await this.sendMessage(session.user_phone, 
        '❌ Código admin inválido. Solicite o código correto ao administrador.'
      )
    }
  }

  // Enviar mensagem
  async sendMessage(to: string, text: string) {
    try {
      await this.whatsappAPI.sendMessage({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error)
    }
  }

  // Webhook para receber mensagens
  async handleWebhook(req: any, res: any) {
    const { body } = req
    
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              await this.handleIncomingMessage(message)
            }
          }
        }
      }
      res.status(200).send('OK')
    } else {
      res.status(404).send('Not Found')
    }
  }
}
```

---

## 🔐 **3. SISTEMAS DE AUTENTICAÇÃO WHATSAPP**

### **Método 1: Verificação por SMS**
```typescript
// services/auth/SMSAuthService.ts
export class SMSAuthService {
  // Gerar e enviar código SMS
  async sendAuthCode(phone: string, organizationId: string) {
    const code = this.generateRandomCode(6)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    
    // Salvar código no banco
    await this.saveAuthCode(phone, code, expiresAt, organizationId)
    
    // Enviar SMS
    await this.sendSMS(phone, `Seu código de autenticação Gabi Family Docs: ${code}`)
    
    return { success: true, message: 'Código enviado por SMS' }
  }

  // Verificar código SMS
  async verifyAuthCode(phone: string, code: string, organizationId: string) {
    const savedCode = await this.getAuthCode(phone, organizationId)
    
    if (!savedCode || savedCode.expires_at < new Date()) {
      return { valid: false, message: 'Código expirado ou inválido' }
    }
    
    if (savedCode.code === code) {
      await this.deleteAuthCode(phone, organizationId)
      return { valid: true, message: 'Código válido' }
    }
    
    return { valid: false, message: 'Código incorreto' }
  }
}
```

### **Método 2: Verificação por Email**
```typescript
// services/auth/EmailAuthService.ts
export class EmailAuthService {
  // Enviar link de autenticação por email
  async sendAuthEmail(email: string, sessionId: string, organizationId: string) {
    const token = this.generateSecureToken()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    
    // Salvar token no banco
    await this.saveEmailToken(email, token, expiresAt, sessionId, organizationId)
    
    // Gerar link de autenticação
    const authLink = `${process.env.APP_URL}/auth/email?token=${token}&session=${sessionId}`
    
    // Enviar email
    await this.sendEmail(email, {
      subject: 'Autenticação Gabi Family Docs - WhatsApp',
      template: 'whatsapp-auth',
      data: { authLink, expiresAt }
    })
    
    return { success: true, message: 'Email de autenticação enviado' }
  }

  // Verificar token de email
  async verifyEmailToken(token: string, sessionId: string) {
    const savedToken = await this.getEmailToken(token, sessionId)
    
    if (!savedToken || savedToken.expires_at < new Date()) {
      return { valid: false, message: 'Token expirado ou inválido' }
    }
    
    // Autenticar sessão
    await this.authenticateSession(sessionId)
    await this.deleteEmailToken(token)
    
    return { valid: true, message: 'Autenticação realizada com sucesso' }
  }
}
```

### **Método 3: Aprovação por Admin**
```typescript
// services/auth/AdminAuthService.ts
export class AdminAuthService {
  // Gerar código admin para organização
  async generateAdminCode(organizationId: string, adminUserId: string) {
    const code = this.generateRandomCode(8)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    
    // Salvar código admin
    await this.saveAdminCode(organizationId, code, expiresAt, adminUserId)
    
    return { code, expiresAt }
  }

  // Verificar código admin
  async verifyAdminCode(organizationId: string, code: string) {
    const savedCode = await this.getAdminCode(organizationId)
    
    if (!savedCode || savedCode.expires_at < new Date()) {
      return { valid: false, message: 'Código expirado ou inválido' }
    }
    
    if (savedCode.code === code) {
      await this.deleteAdminCode(organizationId)
      return { valid: true, message: 'Código admin válido' }
    }
    
    return { valid: false, message: 'Código admin incorreto' }
  }
}
```

---

## 🎨 **4. INTERFACE DE ADMINISTRAÇÃO**

### **Dashboard de Organização**
```typescript
// components/admin/OrganizationDashboard.tsx
export const OrganizationDashboard: React.FC = () => {
  const [organization, setOrganization] = useState<any>(null)
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])

  return (
    <View style={styles.container}>
      {/* Configuração WhatsApp */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Configuração WhatsApp</Text>
        
        <TouchableOpacity 
          style={styles.configCard}
          onPress={() => setupWhatsApp()}
        >
          <Text style={styles.configTitle}>WhatsApp Business API</Text>
          <Text style={styles.configStatus}>
            {whatsappConfig?.is_active ? '✅ Ativo' : '❌ Inativo'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.configCard}
          onPress={() => generateAdminCode()}
        >
          <Text style={styles.configTitle}>Gerar Código Admin</Text>
          <Text style={styles.configDescription}>
            Para autenticação de novos usuários via WhatsApp
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessões Ativas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Sessões WhatsApp Ativas</Text>
        
        {sessions.map(session => (
          <View key={session.id} style={styles.sessionCard}>
            <Text style={styles.sessionPhone}>{session.user_phone}</Text>
            <Text style={styles.sessionName}>{session.user_name}</Text>
            <Text style={styles.sessionStatus}>
              {session.is_authenticated ? '✅ Autenticado' : '⏳ Pendente'}
            </Text>
            <Text style={styles.sessionLastActivity}>
              Última atividade: {formatDate(session.last_activity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Estatísticas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{organization?.max_members}</Text>
            <Text style={styles.statLabel}>Membros</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{organization?.max_documents}</Text>
            <Text style={styles.statLabel}>Documentos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Sessões WhatsApp</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
```

---

## 🔧 **5. CONFIGURAÇÃO WHATSAPP BUSINESS API**

### **Setup WhatsApp Business**
```yaml
# docker-compose.whatsapp.yml
version: '3.8'
services:
  whatsapp-business:
    image: whatsapp-business-api:latest
    container_name: gabi-whatsapp-business
    environment:
      - WHATSAPP_PHONE_NUMBER_ID=${WHATSAPP_PHONE_NUMBER_ID}
      - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
      - WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN}
      - WEBHOOK_URL=${WEBHOOK_URL}
    ports:
      - "3001:3001"
    volumes:
      - whatsapp_data:/app/data
    restart: unless-stopped

  webhook-handler:
    image: gabi-webhook:latest
    container_name: gabi-webhook-handler
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - OLLAMA_HOST=${OLLAMA_HOST}
    ports:
      - "3002:3002"
    depends_on:
      - whatsapp-business
    restart: unless-stopped

volumes:
  whatsapp_data:
```

### **Configuração de Webhook**
```typescript
// webhook-handler/index.ts
import express from 'express'
import { WhatsAppService } from './services/WhatsAppService'

const app = express()
app.use(express.json())

// Webhook para WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { body } = req
    
    // Verificar se é do WhatsApp
    if (body.object === 'whatsapp_business_account') {
      
      // Processar cada entrada
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          
          // Se há mensagens
          if (change.value.messages) {
            for (const message of change.value.messages) {
              
              // Identificar organização pelo número de telefone
              const organizationId = await identifyOrganization(message.from)
              
              if (organizationId) {
                const whatsappService = new WhatsAppService(organizationId)
                await whatsappService.handleIncomingMessage(message)
              } else {
                console.log('Organização não encontrada para:', message.from)
              }
            }
          }
        }
      }
      
      res.status(200).send('OK')
    } else {
      res.status(404).send('Not Found')
    }
  } catch (error) {
    console.error('Erro no webhook:', error)
    res.status(500).send('Internal Server Error')
  }
})

// Verificação do webhook (requerido pelo WhatsApp)
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.status(403).send('Forbidden')
  }
})

app.listen(3002, () => {
  console.log('Webhook handler rodando na porta 3002')
})
```

---

## 📊 **6. PLANOS E LIMITAÇÕES**

### **Planos SaaS**
```typescript
// types/plans.ts
export const SAAS_PLANS = {
  free: {
    name: 'Gratuito',
    price: 0,
    maxMembers: 5,
    maxDocuments: 100,
    maxStorageGB: 1,
    whatsappEnabled: false,
    aiFeatures: 'basic',
    support: 'community'
  },
  
  basic: {
    name: 'Básico',
    price: 29.90,
    maxMembers: 10,
    maxDocuments: 500,
    maxStorageGB: 5,
    whatsappEnabled: true,
    aiFeatures: 'standard',
    support: 'email'
  },
  
  premium: {
    name: 'Premium',
    price: 79.90,
    maxMembers: 25,
    maxDocuments: 2000,
    maxStorageGB: 20,
    whatsappEnabled: true,
    aiFeatures: 'advanced',
    support: 'priority'
  },
  
  enterprise: {
    name: 'Empresarial',
    price: 199.90,
    maxMembers: 100,
    maxDocuments: 10000,
    maxStorageGB: 100,
    whatsappEnabled: true,
    aiFeatures: 'enterprise',
    support: 'dedicated'
  }
}
```

---

## 🚀 **7. CRONOGRAMA DE IMPLEMENTAÇÃO**

### **Fase 1: Multitenancy (Semana 1-2)**
- [ ] Configurar schema multitenancy no Supabase
- [ ] Implementar sistema de organizações
- [ ] Configurar RLS para isolamento de dados
- [ ] Criar sistema de convites

### **Fase 2: WhatsApp Setup (Semana 3-4)**
- [ ] Configurar WhatsApp Business API
- [ ] Implementar webhook handler
- [ ] Criar sistema de sessões WhatsApp
- [ ] Desenvolver métodos de autenticação

### **Fase 3: Integração IA (Semana 5-6)**
- [ ] Conectar Ollama por organização
- [ ] Implementar chatbot WhatsApp
- [ ] Criar sistema de histórico de mensagens
- [ ] Testar fluxos de autenticação

### **Fase 4: Interface Admin (Semana 7-8)**
- [ ] Dashboard de organização
- [ ] Configuração WhatsApp
- [ ] Gestão de sessões
- [ ] Monitoramento e analytics

---

## 🎯 **8. VANTAGENS DA INTEGRAÇÃO WHATSAPP**

### **Para o Usuário:**
✅ **Familiaridade**: Interface conhecida
✅ **Acessibilidade**: Funciona em qualquer dispositivo
✅ **Notificações**: Alertas automáticos
✅ **Privacidade**: Conversas privadas
✅ **Multimídia**: Envio de documentos e imagens

### **Para a Plataforma:**
✅ **Engajamento**: Maior uso da plataforma
✅ **Retenção**: Usuários mais ativos
✅ **Diferenciação**: Funcionalidade única
✅ **Escalabilidade**: Fácil expansão
✅ **Monetização**: Valor agregado

---

## 🎉 **9. CONCLUSÃO**

O **SaaS Multitenancy com WhatsApp** oferece:

✅ **Arquitetura escalável** para múltiplas organizações
✅ **Isolamento completo** de dados por tenant
✅ **Integração WhatsApp** com autenticação segura
✅ **Chatbot IA** via WhatsApp
✅ **Múltiplos métodos** de autenticação
✅ **Interface administrativa** completa
✅ **Planos flexíveis** de preços

**Status**: 🚀 **PRONTO PARA DESENVOLVIMENTO SAAS**

---

**Responsável**: BMad Architect + Context7
**Data**: 2025-01-21
**Versão**: 3.0.0
**Status**: ✅ Aprovado para desenvolvimento SaaS multitenancy
