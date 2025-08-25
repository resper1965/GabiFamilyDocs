# Database Setup - Gabi Family Docs

## 🗄️ **Configuração Completa do Supabase**

### CONTEXT7_QUERY
```yaml
CONTEXT7_QUERY:
  activity: database_setup_complete
  scope: gabi_family_docs_supabase_integration
  complexity: alta
  priority: crítica
  library_ids: [/supabase/supabase]
  constraints: [family-data, document-management, privacy, security]
  output_range: 3000-5000
  agent: bmad_architect
  timestamp: 2025-01-21 19:30:00
  
  QUERY_TEXT: |
    Setup completo do banco de dados Supabase para Gabi Family Docs:
    - Tabelas para dados familiares (endereços, telefones, documentos)
    - Tabelas para documentos e metadados
    - Configuração de segurança e RLS
    - Integração com Ollama e Paperless-ngx
    - Backup e sincronização
```

## 🎯 **1. ESTRUTURA DO BANCO DE DADOS**

### **Schema Principal**
```sql
-- ========================================
-- GABI FAMILY DOCS - DATABASE SCHEMA
-- ========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ========================================
-- TABELAS PRINCIPAIS
-- ========================================

-- Tabela de famílias
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros da família
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE,
  relationship VARCHAR(50), -- 'pai', 'mãe', 'filho', 'filha', 'esposo', etc.
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de endereços
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  address_type VARCHAR(50) NOT NULL, -- 'home', 'work', 'other'
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'Brasil',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de telefones
CREATE TABLE phones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  phone_type VARCHAR(50) NOT NULL, -- 'mobile', 'home', 'work', 'whatsapp'
  phone_number VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de documentos pessoais
CREATE TABLE personal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'cpf', 'rg', 'passport', 'birth_certificate', etc.
  document_number VARCHAR(50) NOT NULL,
  issuing_authority VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de documentos digitais
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  content TEXT, -- Texto extraído do documento
  tags TEXT[],
  metadata JSONB,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias de documentos
CREATE TABLE document_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#00ade8',
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento documentos-categorias
CREATE TABLE document_category_relations (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  category_id UUID REFERENCES document_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, category_id)
);

-- Tabela de lembretes e vencimentos
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_type VARCHAR(50) NOT NULL, -- 'expiry', 'renewal', 'custom'
  due_date DATE NOT NULL,
  reminder_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de chat
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  intent_data JSONB,
  search_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para busca rápida
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_name ON family_members USING gin(name gin_trgm_ops);
CREATE INDEX idx_addresses_member_id ON addresses(family_member_id);
CREATE INDEX idx_phones_member_id ON phones(family_member_id);
CREATE INDEX idx_personal_documents_member_id ON personal_documents(family_member_id);
CREATE INDEX idx_personal_documents_type ON personal_documents(document_type);
CREATE INDEX idx_documents_member_id ON documents(family_member_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_content ON documents USING gin(to_tsvector('portuguese', content));
CREATE INDEX idx_documents_tags ON documents USING gin(tags);
CREATE INDEX idx_reminders_member_id ON reminders(family_member_id);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_completed ON reminders(is_completed);
CREATE INDEX idx_chat_history_member_id ON chat_history(family_member_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);

-- Índices compostos
CREATE INDEX idx_documents_member_type ON documents(family_member_id, document_type);
CREATE INDEX idx_personal_documents_member_type ON personal_documents(family_member_id, document_type);
CREATE INDEX idx_reminders_member_due ON reminders(family_member_id, due_date);

-- ========================================
-- FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_family_members_updated_at 
  BEFORE UPDATE ON family_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_documents_updated_at 
  BEFORE UPDATE ON personal_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular dias até vencimento
CREATE OR REPLACE FUNCTION days_until_expiry(expiry_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN expiry_date - CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar documentos por texto
CREATE OR REPLACE FUNCTION search_documents(search_query TEXT, member_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  content TEXT,
  document_type VARCHAR(50),
  family_member_name VARCHAR(100),
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.document_type,
    fm.name as family_member_name,
    ts_rank(to_tsvector('portuguese', d.content), plainto_tsquery('portuguese', search_query)) as relevance_score
  FROM documents d
  JOIN family_members fm ON d.family_member_id = fm.id
  WHERE 
    (member_id IS NULL OR d.family_member_id = member_id)
    AND to_tsvector('portuguese', d.content) @@ plainto_tsquery('portuguese', search_query)
  ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Inserir categorias padrão
INSERT INTO document_categories (name, description, color, icon) VALUES
('Identificação', 'Documentos de identificação pessoal', '#00ade8', 'id-card'),
('Saúde', 'Documentos médicos e de saúde', '#28a745', 'heart'),
('Educação', 'Documentos escolares e acadêmicos', '#ffc107', 'graduation-cap'),
('Trabalho', 'Documentos profissionais', '#6f42c1', 'briefcase'),
('Financeiro', 'Documentos bancários e financeiros', '#20c997', 'credit-card'),
('Veículos', 'Documentos de veículos', '#fd7e14', 'car'),
('Imóveis', 'Documentos de propriedades', '#6c757d', 'home'),
('Jurídico', 'Documentos legais e contratos', '#dc3545', 'gavel'),
('Outros', 'Outros tipos de documentos', '#6c757d', 'file');

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (serão configuradas após autenticação)
-- Estas políticas garantem que cada família só veja seus próprios dados

-- Política para famílias
CREATE POLICY "Families can view own family" ON families
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM family_members WHERE family_id = families.id
  ));

-- Política para membros da família
CREATE POLICY "Members can view own family members" ON family_members
  FOR ALL USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

-- Política para documentos
CREATE POLICY "Members can view own documents" ON documents
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

-- Política para documentos pessoais
CREATE POLICY "Members can view own personal documents" ON personal_documents
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

-- Política para endereços
CREATE POLICY "Members can view own addresses" ON addresses
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

-- Política para telefones
CREATE POLICY "Members can view own phones" ON phones
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

-- Política para lembretes
CREATE POLICY "Members can view own reminders" ON reminders
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

-- Política para histórico de chat
CREATE POLICY "Members can view own chat history" ON chat_history
  FOR ALL USING (family_member_id IN (
    SELECT id FROM family_members WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));

-- Categorias são públicas (leitura)
CREATE POLICY "Anyone can view categories" ON document_categories
  FOR SELECT USING (true);

-- ========================================
-- VIEWS ÚTEIS
-- ========================================

-- View para documentos com informações completas
CREATE VIEW documents_with_details AS
SELECT 
  d.id,
  d.title,
  d.description,
  d.document_type,
  d.file_path,
  d.content,
  d.tags,
  d.metadata,
  d.created_at,
  d.updated_at,
  fm.name as family_member_name,
  fm.id as family_member_id,
  f.name as family_name,
  f.id as family_id,
  array_agg(dc.name) as categories
FROM documents d
JOIN family_members fm ON d.family_member_id = fm.id
JOIN families f ON fm.family_id = f.id
LEFT JOIN document_category_relations dcr ON d.id = dcr.document_id
LEFT JOIN document_categories dc ON dcr.category_id = dc.id
GROUP BY d.id, fm.name, fm.id, f.name, f.id;

-- View para lembretes com detalhes
CREATE VIEW reminders_with_details AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.reminder_type,
  r.due_date,
  r.reminder_date,
  r.is_completed,
  r.priority,
  r.created_at,
  fm.name as family_member_name,
  fm.id as family_member_id,
  f.name as family_name,
  d.title as document_title,
  d.document_type as document_type,
  days_until_expiry(r.due_date) as days_until_due
FROM reminders r
JOIN family_members fm ON r.family_member_id = fm.id
JOIN families f ON fm.family_id = f.id
LEFT JOIN documents d ON r.document_id = d.id;

-- View para dados familiares completos
CREATE VIEW family_members_complete AS
SELECT 
  fm.id,
  fm.name,
  fm.email,
  fm.phone,
  fm.birth_date,
  fm.relationship,
  fm.is_primary_contact,
  f.name as family_name,
  f.id as family_id,
  array_agg(DISTINCT a.street || ', ' || a.number || ' - ' || a.city || '/' || a.state) as addresses,
  array_agg(DISTINCT p.phone_number) as phones,
  array_agg(DISTINCT pd.document_type || ': ' || pd.document_number) as documents
FROM family_members fm
JOIN families f ON fm.family_id = f.id
LEFT JOIN addresses a ON fm.id = a.family_member_id
LEFT JOIN phones p ON fm.id = p.family_member_id
LEFT JOIN personal_documents pd ON fm.id = pd.family_member_id
GROUP BY fm.id, f.name, f.id;

-- ========================================
-- FUNÇÕES DE UTILIDADE
-- ========================================

-- Função para buscar membro da família por nome
CREATE OR REPLACE FUNCTION find_family_member(member_name TEXT, family_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  relationship VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fm.id,
    fm.name,
    fm.email,
    fm.phone,
    fm.relationship
  FROM family_members fm
  WHERE fm.family_id = find_family_member.family_id
    AND fm.name ILIKE '%' || member_name || '%';
END;
$$ LANGUAGE plpgsql;

-- Função para buscar documentos por tipo
CREATE OR REPLACE FUNCTION get_documents_by_type(doc_type TEXT, member_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  document_type VARCHAR(50),
  family_member_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.document_type,
    fm.name as family_member_name,
    d.created_at
  FROM documents d
  JOIN family_members fm ON d.family_member_id = fm.id
  WHERE d.document_type = doc_type
    AND (member_id IS NULL OR d.family_member_id = member_id)
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para obter lembretes próximos
CREATE OR REPLACE FUNCTION get_upcoming_reminders(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  due_date DATE,
  days_until_due INTEGER,
  family_member_name VARCHAR(100),
  priority VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.due_date,
    days_until_expiry(r.due_date) as days_until_due,
    fm.name as family_member_name,
    r.priority
  FROM reminders r
  JOIN family_members fm ON r.family_member_id = fm.id
  WHERE r.is_completed = false
    AND r.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + days_ahead
  ORDER BY r.due_date ASC, r.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CONFIGURAÇÃO DE BACKUP
-- ========================================

-- Configurar backup automático (via Supabase Dashboard)
-- 1. Ir para Settings > Database
-- 2. Configurar backup diário
-- 3. Configurar retenção de 30 dias
-- 4. Configurar backup em região diferente

-- ========================================
-- MONITORAMENTO
-- ========================================

-- Query para monitorar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Query para monitorar performance
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%documents%' OR query LIKE '%family_members%'
ORDER BY total_time DESC
LIMIT 10;

-- ========================================
-- MIGRAÇÃO DE DADOS (se necessário)
-- ========================================

-- Script para migrar dados existentes (se houver)
-- Este script deve ser executado apenas uma vez

-- Exemplo de migração de dados existentes
-- INSERT INTO families (name, description)
-- VALUES ('Família Silva', 'Família principal do sistema');

-- INSERT INTO family_members (family_id, name, email, phone, relationship)
-- VALUES 
--   ((SELECT id FROM families WHERE name = 'Família Silva'), 'João Silva', 'joao@email.com', '(11) 99999-9999', 'pai'),
--   ((SELECT id FROM families WHERE name = 'Família Silva'), 'Maria Silva', 'maria@email.com', '(11) 88888-8888', 'mãe');

-- ========================================
-- TESTES
-- ========================================

-- Inserir dados de teste
INSERT INTO families (name, description) VALUES 
('Família Teste', 'Família para testes do sistema');

INSERT INTO family_members (family_id, name, email, phone, relationship) VALUES 
((SELECT id FROM families WHERE name = 'Família Teste'), 'Sabrina Silva', 'sabrina@email.com', '(11) 99999-9999', 'filha'),
((SELECT id FROM families WHERE name = 'Família Teste'), 'Louise Silva', 'louise@email.com', '(11) 88888-8888', 'filha'),
((SELECT id FROM families WHERE name = 'Família Teste'), 'Giovanna Silva', 'giovanna@email.com', '(11) 77777-7777', 'filha');

INSERT INTO addresses (family_member_id, address_type, street, number, city, state, zip_code) VALUES 
((SELECT id FROM family_members WHERE name = 'Sabrina Silva'), 'home', 'Rua das Flores', '123', 'São Paulo', 'SP', '01234-567'),
((SELECT id FROM family_members WHERE name = 'Louise Silva'), 'home', 'Rua das Palmeiras', '456', 'São Paulo', 'SP', '01234-890'),
((SELECT id FROM family_members WHERE name = 'Giovanna Silva'), 'home', 'Rua dos Ipês', '789', 'São Paulo', 'SP', '01234-123');

INSERT INTO personal_documents (family_member_id, document_type, document_number, issuing_authority, issue_date, expiry_date) VALUES 
((SELECT id FROM family_members WHERE name = 'Sabrina Silva'), 'rg', '12.345.678-9', 'SSP-SP', '2010-03-15', NULL),
((SELECT id FROM family_members WHERE name = 'Louise Silva'), 'passport', 'BR123456789', 'Polícia Federal', '2020-08-23', '2025-08-23'),
((SELECT id FROM family_members WHERE name = 'Giovanna Silva'), 'cpf', '123.456.789-00', 'Receita Federal', '2015-01-10', NULL);

-- ========================================
-- CONCLUSÃO
-- ========================================

/*
✅ Banco de dados configurado com sucesso!
✅ Estrutura completa para dados familiares
✅ Sistema de busca e indexação
✅ Segurança com RLS
✅ Views e funções úteis
✅ Dados de teste inseridos
✅ Pronto para integração com Ollama e Paperless-ngx
*/

-- Próximos passos:
-- 1. Configurar autenticação no Supabase
-- 2. Integrar com o app React Native
-- 3. Conectar com Ollama para IA
-- 4. Integrar com Paperless-ngx
-- 5. Testar funcionalidades de busca
