// Serviço Ollama para IA local
// Nota: Para React Native, usaremos uma API REST para comunicação com Ollama

export class OllamaService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_OLLAMA_HOST || 'http://localhost:11434'
  }

  // Verificar se o Ollama está rodando
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (response.ok) {
        const data = await response.json()
        return { status: 'healthy', models: data.models }
      } else {
        return { status: 'unhealthy', error: 'Ollama não está respondendo' }
      }
    } catch (error) {
      console.error('Ollama não está rodando:', error)
      return { status: 'unhealthy', error: error.message }
    }
  }

  // Análise de documento
  async analyzeDocument(content: string, metadata: any) {
    try {
      const prompt = `
        Analise este documento e forneça:
        1. Tipo de documento
        2. Informações importantes (datas, valores, números)
        3. Sugestões de categoria
        4. Ações necessárias (renovação, vencimento, etc.)
        
        Documento: ${content}
        Metadados: ${JSON.stringify(metadata)}
        
        Responda em JSON:
        {
          "document_type": "rg|cpf|passport|etc",
          "important_info": {
            "dates": [],
            "numbers": [],
            "values": []
          },
          "suggested_category": "identificacao|saude|trabalho|etc",
          "actions_needed": [],
          "confidence": 0.95
        }
      `
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro na comunicação com Ollama')
      }
      
      const data = await response.json()
      return JSON.parse(data.response)
    } catch (error) {
      console.error('Erro na análise de documento:', error)
      throw error
    }
  }

  // Chatbot para perguntas
  async chatWithDocuments(question: string, context: any) {
    try {
      const prompt = `
        Baseado nos documentos da família, responda:
        
        Pergunta: ${question}
        
        Contexto dos documentos:
        ${JSON.stringify(context)}
        
        Responda de forma clara e útil para uma família.
      `
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro na comunicação com Ollama')
      }
      
      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Erro no chat:', error)
      throw error
    }
  }

  // Sugestões automáticas
  async suggestCategories(documentContent: string) {
    try {
      const prompt = `
        Analise este documento e sugira categorias apropriadas:
        
        Conteúdo: ${documentContent}
        
        Sugira até 3 categorias mais apropriadas.
      `
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro na comunicação com Ollama')
      }
      
      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Erro nas sugestões:', error)
      throw error
    }
  }

  // Extração de informações específicas
  async extractInformation(content: string, informationType: string) {
    try {
      const prompt = `
        Extraia informações específicas do documento:
        
        Tipo de informação: ${informationType}
        Conteúdo: ${content}
        
        Responda apenas com as informações solicitadas.
      `
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro na comunicação com Ollama')
      }
      
      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Erro na extração:', error)
      throw error
    }
  }

  // Geração de resumos
  async generateSummary(content: string) {
    try {
      const prompt = `
        Gere um resumo conciso deste documento:
        
        Conteúdo: ${content}
        
        Resumo:
      `
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro na comunicação com Ollama')
      }
      
      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Erro na geração de resumo:', error)
      throw error
    }
  }
}

export const ollamaService = new OllamaService()
