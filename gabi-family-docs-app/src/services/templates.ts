import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ollamaService } from './ollama'

interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables: TemplateVariable[]
  is_system: boolean
  created_at: string
  updated_at: string
}

interface TemplateVariable {
  name: string
  type: 'text' | 'date' | 'number' | 'select' | 'boolean'
  label: string
  required: boolean
  default_value?: any
  options?: string[] // For select type
  validation?: {
    min_length?: number
    max_length?: number
    pattern?: string
  }
}

interface GeneratedDocument {
  id: string
  template_id: string
  title: string
  content: string
  variables: Record<string, any>
  generated_at: string
  status: 'draft' | 'final' | 'archived'
}

export class TemplateService {
  private systemTemplates: DocumentTemplate[] = [
    {
      id: 'procuração',
      name: 'Procuração',
      description: 'Modelo de procuração para representação legal',
      category: 'legal',
      content: `PROCURAÇÃO

Eu, {{nome_principal}}, {{nacionalidade}}, {{estado_civil}}, {{profissão}}, portador(a) da Cédula de Identidade RG nº {{rg_principal}}, inscrito(a) no CPF sob o nº {{cpf_principal}}, residente e domiciliado(a) na {{endereco_principal}}, nomeio e constituo como meu bastante procurador(a) {{nome_procurador}}, {{nacionalidade_procurador}}, {{estado_civil_procurador}}, portador(a) da Cédula de Identidade RG nº {{rg_procurador}}, inscrito(a) no CPF sob o nº {{cpf_procurador}}, residente e domiciliado(a) na {{endereco_procurador}}.

PODERES:
{{poderes}}

Vigência: Esta procuração terá vigência até {{data_vencimento}}.

Local e data: {{cidade}}, {{data_atual}}.

_________________________________
{{nome_principal}}
RG: {{rg_principal}}
CPF: {{cpf_principal}}`,
      variables: [
        {
          name: 'nome_principal',
          type: 'text',
          label: 'Nome do Principal',
          required: true,
          validation: { min_length: 3, max_length: 100 }
        },
        {
          name: 'nacionalidade',
          type: 'text',
          label: 'Nacionalidade',
          required: true,
          default_value: 'brasileiro(a)'
        },
        {
          name: 'estado_civil',
          type: 'select',
          label: 'Estado Civil',
          required: true,
          options: ['solteiro(a)', 'casado(a)', 'divorciado(a)', 'viúvo(a)', 'separado(a)']
        },
        {
          name: 'profissão',
          type: 'text',
          label: 'Profissão',
          required: true
        },
        {
          name: 'rg_principal',
          type: 'text',
          label: 'RG do Principal',
          required: true
        },
        {
          name: 'cpf_principal',
          type: 'text',
          label: 'CPF do Principal',
          required: true,
          validation: { pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' }
        },
        {
          name: 'endereco_principal',
          type: 'text',
          label: 'Endereço do Principal',
          required: true
        },
        {
          name: 'nome_procurador',
          type: 'text',
          label: 'Nome do Procurador',
          required: true
        },
        {
          name: 'nacionalidade_procurador',
          type: 'text',
          label: 'Nacionalidade do Procurador',
          required: true,
          default_value: 'brasileiro(a)'
        },
        {
          name: 'estado_civil_procurador',
          type: 'select',
          label: 'Estado Civil do Procurador',
          required: true,
          options: ['solteiro(a)', 'casado(a)', 'divorciado(a)', 'viúvo(a)', 'separado(a)']
        },
        {
          name: 'rg_procurador',
          type: 'text',
          label: 'RG do Procurador',
          required: true
        },
        {
          name: 'cpf_procurador',
          type: 'text',
          label: 'CPF do Procurador',
          required: true,
          validation: { pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' }
        },
        {
          name: 'endereco_procurador',
          type: 'text',
          label: 'Endereço do Procurador',
          required: true
        },
        {
          name: 'poderes',
          type: 'text',
          label: 'Poderes Concedidos',
          required: true,
          default_value: 'Para representar-me em todos os atos e negócios jurídicos, com poderes para substabelecer.'
        },
        {
          name: 'data_vencimento',
          type: 'date',
          label: 'Data de Vencimento',
          required: true
        },
        {
          name: 'cidade',
          type: 'text',
          label: 'Cidade',
          required: true
        },
        {
          name: 'data_atual',
          type: 'date',
          label: 'Data Atual',
          required: true
        }
      ],
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'declaração',
      name: 'Declaração',
      description: 'Modelo de declaração simples',
      category: 'administrativo',
      content: `DECLARAÇÃO

Eu, {{nome_declarante}}, {{nacionalidade}}, portador(a) da Cédula de Identidade RG nº {{rg_declarante}}, inscrito(a) no CPF sob o nº {{cpf_declarante}}, residente e domiciliado(a) na {{endereco_declarante}}, declaro, sob as penas da lei, que:

{{conteudo_declaracao}}

Esta declaração é verdadeira e pode ser confirmada pelos meios legais cabíveis.

Local e data: {{cidade}}, {{data_atual}}.

_________________________________
{{nome_declarante}}
RG: {{rg_declarante}}
CPF: {{cpf_declarante}}`,
      variables: [
        {
          name: 'nome_declarante',
          type: 'text',
          label: 'Nome do Declarante',
          required: true
        },
        {
          name: 'nacionalidade',
          type: 'text',
          label: 'Nacionalidade',
          required: true,
          default_value: 'brasileiro(a)'
        },
        {
          name: 'rg_declarante',
          type: 'text',
          label: 'RG do Declarante',
          required: true
        },
        {
          name: 'cpf_declarante',
          type: 'text',
          label: 'CPF do Declarante',
          required: true,
          validation: { pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' }
        },
        {
          name: 'endereco_declarante',
          type: 'text',
          label: 'Endereço do Declarante',
          required: true
        },
        {
          name: 'conteudo_declaracao',
          type: 'text',
          label: 'Conteúdo da Declaração',
          required: true
        },
        {
          name: 'cidade',
          type: 'text',
          label: 'Cidade',
          required: true
        },
        {
          name: 'data_atual',
          type: 'date',
          label: 'Data Atual',
          required: true
        }
      ],
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'contrato',
      name: 'Contrato Simples',
      description: 'Modelo de contrato básico',
      category: 'legal',
      content: `CONTRATO DE {{tipo_contrato}}

Pelo presente instrumento particular, as partes abaixo qualificadas:

CONTRATANTE:
Nome: {{nome_contratante}}
RG: {{rg_contratante}}
CPF: {{cpf_contratante}}
Endereço: {{endereco_contratante}}

CONTRATADO:
Nome: {{nome_contratado}}
RG: {{rg_contratado}}
CPF: {{cpf_contratado}}
Endereço: {{endereco_contratado}}

Resolvem celebrar o presente contrato de {{tipo_contrato}}, que se regerá pelas seguintes cláusulas e condições:

CLÁUSULA PRIMEIRA - DO OBJETO
{{objeto_contrato}}

CLÁUSULA SEGUNDA - DO VALOR
O valor do contrato é de R$ {{valor_contrato}} ({{valor_por_extenso}}).

CLÁUSULA TERCEIRA - DO PRAZO
O prazo de execução é de {{prazo_execucao}}.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES
{{obrigacoes_contratante}}

{{obrigacoes_contratado}}

CLÁUSULA QUINTA - DA RESCISÃO
{{condicoes_rescisao}}

E por estar de acordo com todas as cláusulas e condições estabelecidas, as partes assinam o presente contrato.

Local e data: {{cidade}}, {{data_atual}}.

_________________________________
{{nome_contratante}}
RG: {{rg_contratante}}
CPF: {{cpf_contratante}}

_________________________________
{{nome_contratado}}
RG: {{rg_contratado}}
CPF: {{cpf_contratado}}`,
      variables: [
        {
          name: 'tipo_contrato',
          type: 'text',
          label: 'Tipo de Contrato',
          required: true
        },
        {
          name: 'nome_contratante',
          type: 'text',
          label: 'Nome do Contratante',
          required: true
        },
        {
          name: 'rg_contratante',
          type: 'text',
          label: 'RG do Contratante',
          required: true
        },
        {
          name: 'cpf_contratante',
          type: 'text',
          label: 'CPF do Contratante',
          required: true,
          validation: { pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' }
        },
        {
          name: 'endereco_contratante',
          type: 'text',
          label: 'Endereço do Contratante',
          required: true
        },
        {
          name: 'nome_contratado',
          type: 'text',
          label: 'Nome do Contratado',
          required: true
        },
        {
          name: 'rg_contratado',
          type: 'text',
          label: 'RG do Contratado',
          required: true
        },
        {
          name: 'cpf_contratado',
          type: 'text',
          label: 'CPF do Contratado',
          required: true,
          validation: { pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}' }
        },
        {
          name: 'endereco_contratado',
          type: 'text',
          label: 'Endereço do Contratado',
          required: true
        },
        {
          name: 'objeto_contrato',
          type: 'text',
          label: 'Objeto do Contrato',
          required: true
        },
        {
          name: 'valor_contrato',
          type: 'number',
          label: 'Valor do Contrato (R$)',
          required: true
        },
        {
          name: 'valor_por_extenso',
          type: 'text',
          label: 'Valor por Extenso',
          required: true
        },
        {
          name: 'prazo_execucao',
          type: 'text',
          label: 'Prazo de Execução',
          required: true
        },
        {
          name: 'obrigacoes_contratante',
          type: 'text',
          label: 'Obrigações do Contratante',
          required: true
        },
        {
          name: 'obrigacoes_contratado',
          type: 'text',
          label: 'Obrigações do Contratado',
          required: true
        },
        {
          name: 'condicoes_rescisao',
          type: 'text',
          label: 'Condições de Rescisão',
          required: true
        },
        {
          name: 'cidade',
          type: 'text',
          label: 'Cidade',
          required: true
        },
        {
          name: 'data_atual',
          type: 'date',
          label: 'Data Atual',
          required: true
        }
      ],
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  constructor() {
    this.initializeTemplates()
  }

  private async initializeTemplates() {
    // Load system templates to database if they don't exist
    await this.ensureSystemTemplates()
  }

  private async ensureSystemTemplates() {
    try {
      for (const template of this.systemTemplates) {
        const { data: existing } = await supabase
          .from('document_templates')
          .select('id')
          .eq('id', template.id)
          .single()

        if (!existing) {
          await supabase
            .from('document_templates')
            .insert([template])
        }
      }
    } catch (error) {
      console.error('Error ensuring system templates:', error)
    }
  }

  async getTemplates(category?: string): Promise<DocumentTemplate[]> {
    try {
      let query = supabase
        .from('document_templates')
        .select('*')
        .order('name', { ascending: true })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting templates:', error)
      return []
    }
  }

  async getTemplate(templateId: string): Promise<DocumentTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting template:', error)
      return null
    }
  }

  async createTemplate(template: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<DocumentTemplate> {
    try {
      const newTemplate: DocumentTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('document_templates')
        .insert([newTemplate])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  async updateTemplate(templateId: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  async generateDocument(
    templateId: string,
    variables: Record<string, any>,
    title?: string
  ): Promise<GeneratedDocument> {
    try {
      const template = await this.getTemplate(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      // Validate variables
      this.validateVariables(template.variables, variables)

      // Generate content
      let content = template.content
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`
        content = content.replace(new RegExp(placeholder, 'g'), this.formatVariableValue(value))
      }

      // Use AI to enhance content if needed
      if (variables.ai_enhance) {
        content = await this.enhanceContentWithAI(content, variables)
      }

      const generatedDocument: GeneratedDocument = {
        id: `doc_${Date.now()}`,
        template_id: templateId,
        title: title || `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`,
        content,
        variables,
        generated_at: new Date().toISOString(),
        status: 'draft',
      }

      // Save to database
      const { error } = await supabase
        .from('generated_documents')
        .insert([generatedDocument])

      if (error) throw error

      return generatedDocument
    } catch (error) {
      console.error('Error generating document:', error)
      throw error
    }
  }

  private validateVariables(templateVariables: TemplateVariable[], providedVariables: Record<string, any>) {
    for (const variable of templateVariables) {
      if (variable.required && !providedVariables[variable.name]) {
        throw new Error(`Required variable '${variable.label}' is missing`)
      }

      if (providedVariables[variable.name]) {
        const value = providedVariables[variable.name]
        
        // Type validation
        switch (variable.type) {
          case 'number':
            if (typeof value !== 'number') {
              throw new Error(`Variable '${variable.label}' must be a number`)
            }
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new Error(`Variable '${variable.label}' must be a boolean`)
            }
            break
          case 'select':
            if (variable.options && !variable.options.includes(value)) {
              throw new Error(`Variable '${variable.label}' must be one of: ${variable.options.join(', ')}`)
            }
            break
        }

        // Length validation
        if (variable.validation) {
          if (variable.validation.min_length && value.length < variable.validation.min_length) {
            throw new Error(`Variable '${variable.label}' must be at least ${variable.validation.min_length} characters`)
          }
          if (variable.validation.max_length && value.length > variable.validation.max_length) {
            throw new Error(`Variable '${variable.label}' must be at most ${variable.validation.max_length} characters`)
          }
          if (variable.validation.pattern && !new RegExp(variable.validation.pattern).test(value)) {
            throw new Error(`Variable '${variable.label}' format is invalid`)
          }
        }
      }
    }
  }

  private formatVariableValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    if (typeof value === 'date' || value instanceof Date) {
      return value.toLocaleDateString('pt-BR')
    }

    return String(value)
  }

  private async enhanceContentWithAI(content: string, variables: Record<string, any>): Promise<string> {
    try {
      const prompt = `Melhore o seguinte documento legal, mantendo a estrutura e adicionando clareza e formalidade:

${content}

Variáveis utilizadas: ${JSON.stringify(variables)}

Por favor, melhore o texto mantendo o mesmo formato e estrutura, apenas aprimorando a linguagem e clareza.`

      const enhancedContent = await ollamaService.chatWithFamilyData(prompt, {
        context: 'document_enhancement',
        variables,
      })

      return enhancedContent
    } catch (error) {
      console.error('Error enhancing content with AI:', error)
      return content // Return original content if AI enhancement fails
    }
  }

  async getGeneratedDocuments(): Promise<GeneratedDocument[]> {
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .order('generated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting generated documents:', error)
      return []
    }
  }

  async getGeneratedDocument(documentId: string): Promise<GeneratedDocument | null> {
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting generated document:', error)
      return null
    }
  }

  async updateGeneratedDocument(documentId: string, updates: Partial<GeneratedDocument>): Promise<GeneratedDocument> {
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating generated document:', error)
      throw error
    }
  }

  async deleteGeneratedDocument(documentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting generated document:', error)
      throw error
    }
  }

  // Template categories
  async getTemplateCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('category')
        .order('category')

      if (error) throw error

      const categories = [...new Set(data?.map(item => item.category) || [])]
      return categories
    } catch (error) {
      console.error('Error getting template categories:', error)
      return []
    }
  }

  // Template search
  async searchTemplates(query: string): Promise<DocumentTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching templates:', error)
      return []
    }
  }

  // Template analytics
  async getTemplateUsageStats(): Promise<{
    total_templates: number
    total_generated: number
    most_used_template: string | null
    recent_generations: number
  }> {
    try {
      // Get total templates
      const { data: templates } = await supabase
        .from('document_templates')
        .select('id')

      // Get total generated documents
      const { data: generated } = await supabase
        .from('generated_documents')
        .select('template_id, generated_at')

      // Get most used template
      const templateUsage = generated?.reduce((acc, doc) => {
        acc[doc.template_id] = (acc[doc.template_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const mostUsedTemplate = templateUsage ? 
        Object.entries(templateUsage).sort(([,a], [,b]) => b - a)[0]?.[0] : null

      // Get recent generations (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentGenerations = generated?.filter(doc => 
        new Date(doc.generated_at) > thirtyDaysAgo
      ).length || 0

      return {
        total_templates: templates?.length || 0,
        total_generated: generated?.length || 0,
        most_used_template: mostUsedTemplate,
        recent_generations: recentGenerations,
      }
    } catch (error) {
      console.error('Error getting template usage stats:', error)
      return {
        total_templates: 0,
        total_generated: 0,
        most_used_template: null,
        recent_generations: 0,
      }
    }
  }
}

export const templateService = new TemplateService()
