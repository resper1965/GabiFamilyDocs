import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { notificationService } from './notifications'
import { ollamaService } from './ollama'

interface WhatsAppConfig {
  enabled: boolean
  phone_number: string
  business_id: string
  access_token: string
  webhook_url: string
  auto_reply: boolean
  ai_assistant: boolean
  working_hours: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
    timezone: string
  }
}

interface WhatsAppMessage {
  id: string
  from: string
  to: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  content: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  metadata?: any
}

interface WhatsAppSession {
  id: string
  user_id: string
  phone_number: string
  status: 'pending' | 'active' | 'inactive'
  created_at: string
  last_activity: string
}

export class WhatsAppService {
  private config: WhatsAppConfig = {
    enabled: false,
    phone_number: '',
    business_id: '',
    access_token: '',
    webhook_url: '',
    auto_reply: true,
    ai_assistant: true,
    working_hours: {
      enabled: false,
      start: '09:00',
      end: '18:00',
      timezone: 'America/Sao_Paulo',
    },
  }

  private baseUrl = 'https://graph.facebook.com/v18.0'
  private session: WhatsAppSession | null = null

  constructor() {
    this.initializeWhatsApp()
  }

  private async initializeWhatsApp() {
    await this.loadConfig()
    await this.loadSession()
    
    if (this.config.enabled) {
      await this.setupWebhook()
      await this.startMessageListener()
    }
  }

  private async loadConfig() {
    try {
      const config = await AsyncStorage.getItem('whatsapp_config')
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) }
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error)
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('whatsapp_config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Error saving WhatsApp config:', error)
    }
  }

  private async loadSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        this.session = data
      }
    } catch (error) {
      console.error('Error loading WhatsApp session:', error)
    }
  }

  async updateConfig(newConfig: Partial<WhatsAppConfig>) {
    this.config = { ...this.config, ...newConfig }
    await this.saveConfig()
  }

  async getConfig(): Promise<WhatsAppConfig> {
    return this.config
  }

  // WhatsApp Business API methods
  async sendMessage(to: string, message: string, type: 'text' | 'image' | 'document' = 'text') {
    if (!this.config.enabled || !this.config.access_token) {
      throw new Error('WhatsApp integration not configured')
    }

    if (this.isOutsideWorkingHours()) {
      await this.sendOutOfHoursMessage(to)
      return
    }

    try {
      const endpoint = `${this.baseUrl}/${this.config.phone_number}/messages`
      const payload = this.buildMessagePayload(to, message, type)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status}`)
      }

      const result = await response.json()
      
      // Save message to database
      await this.saveMessage({
        id: result.messages?.[0]?.id || `msg_${Date.now()}`,
        from: this.config.phone_number,
        to,
        type,
        content: message,
        timestamp: new Date().toISOString(),
        status: 'sent',
      })

      return result
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  private buildMessagePayload(to: string, message: string, type: 'text' | 'image' | 'document') {
    const basePayload = {
      messaging_product: 'whatsapp',
      to,
    }

    switch (type) {
      case 'text':
        return {
          ...basePayload,
          type: 'text',
          text: { body: message },
        }
      case 'image':
        return {
          ...basePayload,
          type: 'image',
          image: { link: message },
        }
      case 'document':
        return {
          ...basePayload,
          type: 'document',
          document: { link: message },
        }
      default:
        return {
          ...basePayload,
          type: 'text',
          text: { body: message },
        }
    }
  }

  async sendTemplateMessage(to: string, templateName: string, parameters: any[]) {
    if (!this.config.enabled || !this.config.access_token) {
      throw new Error('WhatsApp integration not configured')
    }

    try {
      const endpoint = `${this.baseUrl}/${this.config.phone_number}/messages`
      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'pt_BR',
          },
          components: parameters.map(param => ({
            type: 'body',
            parameters: [{
              type: 'text',
              text: param,
            }],
          })),
        },
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending template message:', error)
      throw error
    }
  }

  // AI-powered auto-reply
  async handleIncomingMessage(message: WhatsAppMessage) {
    if (!this.config.auto_reply) return

    try {
      // Check if it's a command
      if (message.content.startsWith('/')) {
        await this.handleCommand(message)
        return
      }

      // Use AI to generate response
      if (this.config.ai_assistant) {
        const aiResponse = await this.generateAIResponse(message.content)
        await this.sendMessage(message.from, aiResponse)
      } else {
        // Send default auto-reply
        await this.sendAutoReply(message.from)
      }
    } catch (error) {
      console.error('Error handling incoming message:', error)
    }
  }

  private async handleCommand(message: WhatsAppMessage) {
    const command = message.content.toLowerCase()
    const userPhone = message.from

    try {
      if (command.includes('/documento')) {
        await this.handleDocumentCommand(userPhone, message.content)
      } else if (command.includes('/alerta')) {
        await this.handleAlertCommand(userPhone, message.content)
      } else if (command.includes('/ajuda')) {
        await this.sendHelpMessage(userPhone)
      } else if (command.includes('/status')) {
        await this.sendStatusMessage(userPhone)
      } else {
        await this.sendMessage(userPhone, 'Comando não reconhecido. Digite /ajuda para ver os comandos disponíveis.')
      }
    } catch (error) {
      console.error('Error handling command:', error)
      await this.sendMessage(userPhone, 'Erro ao processar comando. Tente novamente.')
    }
  }

  private async handleDocumentCommand(userPhone: string, command: string) {
    // Extract document query from command
    const query = command.replace('/documento', '').trim()
    
    if (!query) {
      await this.sendMessage(userPhone, 'Por favor, especifique qual documento você está procurando. Exemplo: /documento RG da Sabrina')
      return
    }

    try {
      // Search documents using AI
      const documents = await this.searchDocuments(query)
      
      if (documents.length > 0) {
        const response = `Encontrei ${documents.length} documento(s):\n\n${documents.map(doc => 
          `📄 ${doc.title}\n👤 ${doc.family_member_name}\n📅 ${new Date(doc.created_at).toLocaleDateString('pt-BR')}`
        ).join('\n\n')}`
        
        await this.sendMessage(userPhone, response)
      } else {
        await this.sendMessage(userPhone, 'Nenhum documento encontrado com essa descrição.')
      }
    } catch (error) {
      console.error('Error searching documents:', error)
      await this.sendMessage(userPhone, 'Erro ao buscar documentos. Tente novamente.')
    }
  }

  private async handleAlertCommand(userPhone: string, command: string) {
    try {
      // Get user's alerts
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (alerts && alerts.length > 0) {
        const response = `Você tem ${alerts.length} alerta(s) não lido(s):\n\n${alerts.map(alert => 
          `🚨 ${alert.message}\n📅 ${new Date(alert.created_at).toLocaleDateString('pt-BR')}`
        ).join('\n\n')}`
        
        await this.sendMessage(userPhone, response)
      } else {
        await this.sendMessage(userPhone, 'Você não tem alertas pendentes.')
      }
    } catch (error) {
      console.error('Error getting alerts:', error)
      await this.sendMessage(userPhone, 'Erro ao buscar alertas. Tente novamente.')
    }
  }

  private async sendHelpMessage(userPhone: string) {
    const helpText = `🤖 **Comandos disponíveis:**

📄 **/documento [busca]** - Buscar documentos
🚨 **/alerta** - Ver alertas pendentes
📊 **/status** - Status da conta
❓ **/ajuda** - Esta mensagem

**Exemplos:**
/documento RG da Sabrina
/documento passaporte Louise
/alerta
/status`

    await this.sendMessage(userPhone, helpText)
  }

  private async sendStatusMessage(userPhone: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user stats
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)

      const { data: alerts } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false)

      const statusText = `📊 **Status da Conta:**

👤 Usuário: ${user.email}
📄 Documentos: ${documents?.length || 0}
🚨 Alertas pendentes: ${alerts?.length || 0}
📱 WhatsApp: ${this.config.enabled ? '✅ Ativo' : '❌ Inativo'}`

      await this.sendMessage(userPhone, statusText)
    } catch (error) {
      console.error('Error getting status:', error)
      await this.sendMessage(userPhone, 'Erro ao buscar status. Tente novamente.')
    }
  }

  private async generateAIResponse(message: string): Promise<string> {
    try {
      // Use Ollama to generate response
      const context = {
        userMessage: message,
        timestamp: new Date().toISOString(),
        platform: 'whatsapp',
      }

      const response = await ollamaService.chatWithFamilyData(message, context)
      return response
    } catch (error) {
      console.error('Error generating AI response:', error)
      return 'Desculpe, não consegui processar sua mensagem. Tente novamente.'
    }
  }

  private async sendAutoReply(to: string) {
    const autoReply = `Olá! 👋

Sou o assistente do Gabi Family Docs. Como posso ajudar você hoje?

Digite /ajuda para ver os comandos disponíveis.`

    await this.sendMessage(to, autoReply)
  }

  private async sendOutOfHoursMessage(to: string) {
    const outOfHoursMessage = `Olá! 👋

Estamos fora do horário de funcionamento (${this.config.working_hours.start} - ${this.config.working_hours.end}).

Sua mensagem será respondida no próximo dia útil.

Para emergências, entre em contato pelo email de suporte.`

    await this.sendMessage(to, outOfHoursMessage)
  }

  private isOutsideWorkingHours(): boolean {
    if (!this.config.working_hours.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { start, end } = this.config.working_hours
    
    if (start <= end) {
      // Same day (e.g., 09:00 to 18:00)
      return currentTime < start || currentTime > end
    } else {
      // Overnight (e.g., 18:00 to 09:00)
      return currentTime < start && currentTime > end
    }
  }

  // Document search using AI
  private async searchDocuments(query: string): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Use Supabase full-text search
      const { data, error } = await supabase
        .rpc('search_documents', {
          search_query: query,
        })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching documents:', error)
      return []
    }
  }

  // Webhook setup
  private async setupWebhook() {
    if (!this.config.webhook_url) return

    try {
      const endpoint = `${this.baseUrl}/${this.config.phone_number}/subscribed_apps`
      const payload = {
        access_token: this.config.access_token,
        callback_url: this.config.webhook_url,
        verify_token: 'gabi_family_docs_webhook',
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.error('Error setting up webhook:', response.status)
      }
    } catch (error) {
      console.error('Error setting up webhook:', error)
    }
  }

  // Message listener
  private async startMessageListener() {
    // In a real implementation, this would listen to webhook events
    // For now, we'll simulate message handling
    setInterval(() => {
      this.checkForNewMessages()
    }, 30000) // Check every 30 seconds
  }

  private async checkForNewMessages() {
    // This would check for new messages from WhatsApp API
    // For demo purposes, we'll skip this implementation
  }

  // Database operations
  private async saveMessage(message: WhatsAppMessage) {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert([message])

      if (error) {
        console.error('Error saving WhatsApp message:', error)
      }
    } catch (error) {
      console.error('Error saving WhatsApp message:', error)
    }
  }

  async getMessages(limit: number = 50): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting WhatsApp messages:', error)
      return []
    }
  }

  // Session management
  async createSession(phoneNumber: string): Promise<WhatsAppSession> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const session: WhatsAppSession = {
        id: `session_${Date.now()}`,
        user_id: user.id,
        phone_number: phoneNumber,
        status: 'pending',
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('whatsapp_sessions')
        .insert([session])

      if (error) throw error

      this.session = session
      return session
    } catch (error) {
      console.error('Error creating WhatsApp session:', error)
      throw error
    }
  }

  async updateSessionStatus(status: 'pending' | 'active' | 'inactive') {
    if (!this.session) return

    try {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .update({
          status,
          last_activity: new Date().toISOString(),
        })
        .eq('id', this.session.id)

      if (error) throw error

      this.session.status = status
    } catch (error) {
      console.error('Error updating WhatsApp session:', error)
    }
  }

  // Analytics
  async getMessageStats(): Promise<{
    total_messages: number
    sent_messages: number
    received_messages: number
    response_rate: number
  }> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')

      if (error) throw error

      const totalMessages = data?.length || 0
      const sentMessages = data?.filter(msg => msg.from === this.config.phone_number).length || 0
      const receivedMessages = totalMessages - sentMessages
      const responseRate = receivedMessages > 0 ? (sentMessages / receivedMessages) * 100 : 0

      return {
        total_messages: totalMessages,
        sent_messages: sentMessages,
        received_messages: receivedMessages,
        response_rate: responseRate,
      }
    } catch (error) {
      console.error('Error getting message stats:', error)
      return {
        total_messages: 0,
        sent_messages: 0,
        received_messages: 0,
        response_rate: 0,
      }
    }
  }
}

export const whatsappService = new WhatsAppService()
