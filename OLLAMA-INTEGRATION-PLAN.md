# Ollama Integration Plan - Gabi Family Docs

## 🤖 **Chatbot IA com Ollama Local - Busca Fluida e Dados Familiares**

### CONTEXT7_QUERY
```yaml
CONTEXT7_QUERY:
  activity: ollama_integration_plan_enhanced
  scope: gabi_family_docs_ai_chatbot_fluent_search
  complexity: alta
  priority: crítica
  library_ids: [/ollama/ollama, /ollama/ollama-python, /ollama/ollama-js]
  constraints: [local-llm, privacy, document-search, family-data, document-generation]
  output_range: 5000-8000
  agent: bmad_architect
  timestamp: 2025-01-21 19:00:00
  
  QUERY_TEXT: |
    Chatbot Ollama com busca fluida em documentos e dados familiares:
    - Busca inteligente em documentos: "qual o número do RG da Sabrina?"
    - Consulta de vencimentos: "quando vence o passaporte da Louise?"
    - Geração de documentos: "crie uma procuração da Giovanna para a Louise"
    - Gestão de dados familiares: endereços, telefones, informações pessoais
    - Interface conversacional natural e fluida
```

## 🎯 **1. VISÃO GERAL DO CHATBOT FLUIDO**

### Objetivo Principal
Criar um **chatbot conversacional fluido** que:
- **Busca em documentos**: Encontra informações específicas nos documentos
- **Consulta dados familiares**: Acessa endereços, telefones, informações pessoais
- **Gera documentos**: Cria procurações, relatórios, formulários
- **Responde naturalmente**: Interface conversacional como WhatsApp
- **Funciona offline**: Processamento 100% local

### Exemplos de Interação
```
👤 "Qual o número do RG da Sabrina?"
🤖 "Encontrei o RG da Sabrina: 12.345.678-9, emitido em 15/03/2010 pela SSP-SP"

👤 "Quando vence o passaporte brasileiro da Louise?"
🤖 "O passaporte da Louise vence em 23/08/2025. Faltam 7 meses para renovar!"

👤 "Crie uma procuração da Giovanna para a Louise"
🤖 "Vou criar uma procuração. Preciso de algumas informações:
    - Qual o objetivo da procuração?
    - Qual o prazo de validade?
    - Precisa ser reconhecida em cartório?"

👤 "Qual o endereço da Sabrina?"
🤖 "O endereço da Sabrina é: Rua das Flores, 123, Apto 45, São Paulo-SP, CEP 01234-567"
```

---

## 🏗️ **2. ARQUITETURA AVANÇADA**

### **Estrutura do Sistema Inteligente**
```
📱 App Mobile (React Native)
    ↓
💬 Chat Interface (Fluida)
    ↓
🧠 Ollama Service (Local LLM)
    ↓
📄 Document Search Engine
    ↓
👨‍👩‍👧‍👦 Family Data Manager
    ↓
📝 Document Generator
    ↓
🔍 Vector Database (Embeddings)
```

### **Componentes Principais**

#### **1. Ollama Service Avançado**
```typescript
// services/ollama.ts
import { Ollama } from 'ollama'

export class OllamaService {
  private ollama: Ollama
  private documentSearch: DocumentSearchEngine
  private familyData: FamilyDataManager
  private documentGenerator: DocumentGenerator
  
  constructor() {
    this.ollama = new Ollama({
      host: process.env.EXPO_PUBLIC_OLLAMA_HOST || 'http://localhost:11434'
    })
    this.documentSearch = new DocumentSearchEngine()
    this.familyData = new FamilyDataManager()
    this.documentGenerator = new DocumentGenerator()
  }

  // Chat principal com busca fluida
  async chatWithFamilyData(question: string, context: any) {
    // 1. Analisar a intenção da pergunta
    const intent = await this.analyzeIntent(question)
    
    // 2. Buscar dados relevantes
    let relevantData = {}
    
    if (intent.type === 'document_search') {
      relevantData = await this.documentSearch.searchDocuments(
        intent.query, 
        intent.familyMember
      )
    } else if (intent.type === 'family_data') {
      relevantData = await this.familyData.getFamilyMemberData(
        intent.familyMember,
        intent.dataType
      )
    } else if (intent.type === 'document_generation') {
      relevantData = await this.prepareDocumentGeneration(intent)
    }

    // 3. Gerar resposta contextualizada
    const prompt = `
      Você é um assistente familiar amigável. Responda de forma natural e útil.
      
      Pergunta: ${question}
      Contexto encontrado: ${JSON.stringify(relevantData)}
      Tipo de intenção: ${intent.type}
      
      Responda de forma conversacional, como se fosse um WhatsApp.
      Se precisar de mais informações, pergunte de forma natural.
    `
    
    const response = await this.ollama.chat({
      model: 'llama2',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente familiar que ajuda com documentos e informações da família. Seja amigável e conversacional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    
    return {
      response: response.message.content,
      intent: intent,
      data: relevantData
    }
  }

  // Análise de intenção da pergunta
  async analyzeIntent(question: string) {
    const prompt = `
      Analise esta pergunta e identifique:
      1. Tipo de intenção: document_search, family_data, document_generation, general_question
      2. Membro da família mencionado (se houver)
      3. Tipo de documento (se aplicável)
      4. Tipo de dado familiar (se aplicável)
      5. Query de busca (se aplicável)
      
      Pergunta: "${question}"
      
      Responda em JSON:
      {
        "type": "document_search|family_data|document_generation|general_question",
        "familyMember": "nome_do_membro",
        "documentType": "rg|passaporte|cpf|etc",
        "dataType": "endereco|telefone|email|etc",
        "query": "termo de busca",
        "confidence": 0.95
      }
    `
    
    const response = await this.ollama.chat({
      model: 'llama2',
      messages: [
        {
          role: 'system',
          content: 'Você é um analisador de intenções. Responda apenas em JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    
    return JSON.parse(response.message.content)
  }

  // Busca inteligente em documentos
  async searchDocuments(query: string, familyMember: string) {
    return await this.documentSearch.searchDocuments(query, familyMember)
  }

  // Geração de documentos
  async generateDocument(documentType: string, data: any) {
    return await this.documentGenerator.generate(documentType, data)
  }
}
```

#### **2. Document Search Engine**
```typescript
// services/documentSearch.ts
export class DocumentSearchEngine {
  private supabase: any
  private vectorDB: any

  constructor() {
    this.supabase = createClient(/* config */)
    this.vectorDB = new VectorDatabase()
  }

  // Busca inteligente em documentos
  async searchDocuments(query: string, familyMember?: string) {
    try {
      // 1. Busca por texto completo
      const textResults = await this.searchByText(query, familyMember)
      
      // 2. Busca por embeddings (semântica)
      const semanticResults = await this.searchBySemantics(query, familyMember)
      
      // 3. Busca por metadados
      const metadataResults = await this.searchByMetadata(query, familyMember)
      
      // 4. Combinar e rankear resultados
      const combinedResults = this.combineAndRankResults(
        textResults, 
        semanticResults, 
        metadataResults
      )
      
      return {
        query,
        familyMember,
        results: combinedResults,
        totalFound: combinedResults.length
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      throw error
    }
  }

  // Busca por texto completo
  private async searchByText(query: string, familyMember?: string) {
    let searchQuery = this.supabase
      .from('documents')
      .select('*')
      .textSearch('content', query)
    
    if (familyMember) {
      searchQuery = searchQuery.eq('family_member', familyMember)
    }
    
    const { data, error } = await searchQuery
    return data || []
  }

  // Busca semântica por embeddings
  private async searchBySemantics(query: string, familyMember?: string) {
    // Implementar busca por similaridade semântica
    // usando embeddings do Ollama
    return []
  }

  // Busca por metadados
  private async searchByMetadata(query: string, familyMember?: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
    
    return data || []
  }

  // Combinar e rankear resultados
  private combineAndRankResults(textResults: any[], semanticResults: any[], metadataResults: any[]) {
    // Algoritmo de ranking personalizado
    const allResults = [...textResults, ...semanticResults, ...metadataResults]
    
    // Remover duplicatas
    const uniqueResults = this.removeDuplicates(allResults)
    
    // Aplicar scoring
    const scoredResults = uniqueResults.map(result => ({
      ...result,
      score: this.calculateRelevanceScore(result)
    }))
    
    // Ordenar por relevância
    return scoredResults.sort((a, b) => b.score - a.score)
  }

  private calculateRelevanceScore(result: any): number {
    let score = 0
    
    // Score baseado no tipo de match
    if (result.matchType === 'exact') score += 10
    if (result.matchType === 'partial') score += 5
    if (result.matchType === 'semantic') score += 3
    
    // Score baseado na data (documentos mais recentes)
    const daysSinceCreation = (Date.now() - new Date(result.created_at).getTime()) / (1000 * 60 * 60 * 24)
    score += Math.max(0, 10 - daysSinceCreation / 30)
    
    return score
  }
}
```

#### **3. Family Data Manager**
```typescript
// services/familyData.ts
export class FamilyDataManager {
  private supabase: any

  constructor() {
    this.supabase = createClient(/* config */)
  }

  // Buscar dados de um membro da família
  async getFamilyMemberData(familyMember: string, dataType?: string) {
    try {
      let query = this.supabase
        .from('family_members')
        .select('*')
        .ilike('name', `%${familyMember}%`)
      
      if (dataType) {
        query = query.select(`id, name, ${dataType}`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return {
        familyMember,
        dataType,
        results: data || [],
        found: data?.length > 0
      }
    } catch (error) {
      console.error('Erro ao buscar dados familiares:', error)
      throw error
    }
  }

  // Buscar endereço
  async getAddress(familyMember: string) {
    const result = await this.getFamilyMemberData(familyMember, 'address')
    return result.results[0]?.address || null
  }

  // Buscar telefone
  async getPhone(familyMember: string) {
    const result = await this.getFamilyMemberData(familyMember, 'phone')
    return result.results[0]?.phone || null
  }

  // Buscar email
  async getEmail(familyMember: string) {
    const result = await this.getFamilyMemberData(familyMember, 'email')
    return result.results[0]?.email || null
  }

  // Buscar documentos
  async getDocuments(familyMember: string) {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('family_member', familyMember)
    
    if (error) throw error
    
    return data || []
  }

  // Atualizar dados
  async updateFamilyMemberData(familyMember: string, data: any) {
    const { data: result, error } = await this.supabase
      .from('family_members')
      .update(data)
      .eq('name', familyMember)
    
    if (error) throw error
    
    return result
  }
}
```

#### **4. Document Generator**
```typescript
// services/documentGenerator.ts
export class DocumentGenerator {
  private ollama: OllamaService

  constructor() {
    this.ollama = new OllamaService()
  }

  // Gerar documento
  async generateDocument(documentType: string, data: any) {
    try {
      const template = await this.getTemplate(documentType)
      const filledTemplate = await this.fillTemplate(template, data)
      
      return {
        type: documentType,
        content: filledTemplate,
        generated_at: new Date().toISOString(),
        data_used: data
      }
    } catch (error) {
      console.error('Erro na geração de documento:', error)
      throw error
    }
  }

  // Gerar procuração
  async generatePowerOfAttorney(fromPerson: string, toPerson: string, purpose: string) {
    const data = {
      from_person: fromPerson,
      to_person: toPerson,
      purpose: purpose,
      date: new Date().toLocaleDateString('pt-BR'),
      template_type: 'power_of_attorney'
    }
    
    return await this.generateDocument('power_of_attorney', data)
  }

  // Preencher template
  private async fillTemplate(template: string, data: any) {
    const prompt = `
      Preencha este template com os dados fornecidos:
      
      Template:
      ${template}
      
      Dados:
      ${JSON.stringify(data, null, 2)}
      
      Retorne apenas o documento preenchido, sem explicações adicionais.
    `
    
    const response = await this.ollama.chat({
      model: 'llama2',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em documentos legais. Preencha templates de forma precisa e profissional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    
    return response.message.content
  }

  // Obter template
  private async getTemplate(documentType: string): Promise<string> {
    const templates = {
      power_of_attorney: `
        PROCURAÇÃO

        Eu, {{from_person}}, brasileiro(a), portador(a) do RG nº ________ e CPF nº ________, residente e domiciliado(a) em ________, nomeio e constituo como meu bastante procurador(a) {{to_person}}, brasileiro(a), portador(a) do RG nº ________ e CPF nº ________, residente e domiciliado(a) em ________, para que em meu nome e à minha conta possa:

        {{purpose}}

        Outorga poderes para substabelecer, no todo ou em parte, a presente procuração.

        Local e data: ________, {{date}}

        _________________________________
        {{from_person}}
        Outorgante
      `,
      
      // Adicionar mais templates conforme necessário
    }
    
    return templates[documentType] || 'Template não encontrado'
  }
}
```

---

## 🎨 **3. INTERFACE FLUIDA DO CHAT**

### **Chat Interface Melhorada**
```typescript
// components/ai/FluentChat.tsx
import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { OllamaService } from '../../services/ollama'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  intent?: any
  data?: any
  isLoading?: boolean
}

export const FluentChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const ollamaService = new OllamaService()
  const scrollViewRef = useRef<ScrollView>(null)

  // Mensagem de boas-vindas
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: 'Olá! Sou seu assistente familiar. Posso ajudar com:\n\n📄 Buscar documentos\n👨‍👩‍👧‍👦 Informações da família\n📝 Gerar documentos\n⏰ Lembretes de vencimento\n\nComo posso ajudar?',
      isUser: false,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Adicionar mensagem de "digitando..."
    const typingMessage: Message = {
      id: 'typing',
      text: '🤔 Pensando...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      // Buscar contexto da família
      const familyContext = await getFamilyContext()
      
      // Processar com Ollama
      const result = await ollamaService.chatWithFamilyData(
        inputText, 
        familyContext
      )

      // Remover mensagem de "digitando..."
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'))

      // Adicionar resposta
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        isUser: false,
        timestamp: new Date(),
        intent: result.intent,
        data: result.data
      }

      setMessages(prev => [...prev, aiMessage])

      // Se for geração de documento, mostrar opções
      if (result.intent.type === 'document_generation') {
        await showDocumentOptions(result.intent, result.data)
      }

    } catch (error) {
      console.error('Erro no chat:', error)
      
      // Remover mensagem de "digitando..."
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'))
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, não consegui processar sua pergunta. Pode reformular?',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Mostrar opções para geração de documentos
  const showDocumentOptions = async (intent: any, data: any) => {
    const optionsMessage: Message = {
      id: 'options',
      text: 'Preciso de mais algumas informações para gerar o documento. Pode me ajudar?',
      isUser: false,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, optionsMessage])
    
    // Adicionar botões de opções rápidas
    const quickOptions = generateQuickOptions(intent, data)
    // Implementar interface de botões
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString()}
            </Text>
            
            {/* Mostrar dados encontrados */}
            {message.data && message.data.results && (
              <View style={styles.dataPreview}>
                <Text style={styles.dataTitle}>📄 Documentos encontrados:</Text>
                {message.data.results.slice(0, 3).map((result: any, index: number) => (
                  <Text key={index} style={styles.dataItem}>
                    • {result.title} ({result.document_type})
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Pergunte sobre documentos, endereços, telefones..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isTyping}
        >
          <Text style={styles.sendButtonText}>
            {isTyping ? '⏳' : '📤'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
```

---

## 📊 **4. BASE DE DADOS FAMILIARES**

### **Schema do Banco de Dados**
```sql
-- Tabela de membros da família
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  birth_date DATE,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  passport VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de documentos
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  document_type VARCHAR(50),
  file_path VARCHAR(500),
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de dados pessoais
CREATE TABLE personal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id),
  data_type VARCHAR(50) NOT NULL, -- 'address', 'phone', 'email', 'document_number'
  data_key VARCHAR(100) NOT NULL, -- 'home_address', 'work_phone', 'rg_number'
  data_value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX idx_documents_family_member ON documents(family_member_id);
CREATE INDEX idx_documents_content ON documents USING gin(to_tsvector('portuguese', content));
CREATE INDEX idx_personal_data_member_type ON personal_data(family_member_id, data_type);
```

---

## 🔍 **5. FUNCIONALIDADES DE BUSCA**

### **Tipos de Busca Implementados**

#### **1. Busca por Documento Específico**
```
👤 "Qual o número do RG da Sabrina?"
🤖 "Encontrei o RG da Sabrina: 12.345.678-9, emitido em 15/03/2010 pela SSP-SP"
```

#### **2. Busca por Vencimento**
```
👤 "Quando vence o passaporte da Louise?"
🤖 "O passaporte da Louise vence em 23/08/2025. Faltam 7 meses para renovar!"
```

#### **3. Busca por Informações Pessoais**
```
👤 "Qual o endereço da Sabrina?"
🤖 "O endereço da Sabrina é: Rua das Flores, 123, Apto 45, São Paulo-SP, CEP 01234-567"
```

#### **4. Geração de Documentos**
```
👤 "Crie uma procuração da Giovanna para a Louise"
🤖 "Vou criar uma procuração. Preciso de algumas informações:
    - Qual o objetivo da procuração?
    - Qual o prazo de validade?
    - Precisa ser reconhecida em cartório?"
```

---

## 📝 **6. GERAÇÃO DE DOCUMENTOS**

### **Templates Disponíveis**
- **Procuração**: Procuração geral ou específica
- **Declaração**: Declarações simples
- **Relatório**: Relatórios de documentos
- **Lista**: Listas de documentos por categoria
- **Lembrete**: Lembretes de vencimento

### **Processo de Geração**
1. **Análise da Solicitação**: Ollama identifica o tipo de documento
2. **Coleta de Dados**: Busca informações necessárias
3. **Seleção de Template**: Escolhe template apropriado
4. **Preenchimento**: Preenche com dados reais
5. **Revisão**: Verifica consistência
6. **Entrega**: Retorna documento pronto

---

## 🎯 **7. PRÓXIMOS PASSOS**

### **Imediatos**
1. 🔄 **Implementar Document Search Engine**
2. 🔄 **Criar Family Data Manager**
3. 🔄 **Desenvolver Document Generator**
4. 🔄 **Interface fluida do chat**

### **Curto Prazo**
1. 🔄 **Templates de documentos**
2. 🔄 **Busca semântica avançada**
3. 🔄 **Integração com Supabase**
4. 🔄 **Testes de usabilidade**

### **Médio Prazo**
1. 🔄 **Otimizações de performance**
2. 🔄 **Mais tipos de documentos**
3. 🔄 **Busca por voz**
4. 🔄 **Notificações inteligentes**

---

## 🎉 **8. CONCLUSÃO**

O **Chatbot Fluido Ollama** oferece:

✅ **Busca Inteligente**: Encontra informações específicas em documentos
✅ **Dados Familiares**: Gerencia endereços, telefones, informações pessoais
✅ **Geração de Documentos**: Cria procurações, relatórios, formulários
✅ **Interface Natural**: Conversação fluida como WhatsApp
✅ **Processamento Local**: 100% privado e seguro
✅ **Contexto Familiar**: Entende relacionamentos e necessidades da família

**Status**: 🚀 **PRONTO PARA IMPLEMENTAÇÃO AVANÇADA**

---

**Responsável**: BMad Architect + Context7
**Data**: 2025-01-21
**Versão**: 2.0.0
**Status**: ✅ Aprovado para desenvolvimento avançado
