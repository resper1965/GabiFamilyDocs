import { supabase } from '../lib/supabase'

export class RealtimeService {
  // Inscrever-se em mudanças de tabela
  subscribeToTable(table: string, callback: (payload: any) => void, filter?: string) {
    return supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        callback
      )
      .subscribe()
  }

  // Inscrever-se em mudanças específicas (INSERT, UPDATE, DELETE)
  subscribeToTableEvents(
    table: string, 
    events: ('INSERT' | 'UPDATE' | 'DELETE')[], 
    callback: (payload: any) => void,
    filter?: string
  ) {
    return supabase
      .channel(`${table}_events`)
      .on(
        'postgres_changes',
        {
          event: events.join(','),
          schema: 'public',
          table: table,
          filter: filter
        },
        callback
      )
      .subscribe()
  }

  // Inscrever-se em mudanças de documentos
  subscribeToDocuments(familyId: string, callback: (payload: any) => void) {
    return this.subscribeToTable('documents', callback, `family_id=eq.${familyId}`)
  }

  // Inscrever-se em mudanças de alertas
  subscribeToAlerts(familyId: string, callback: (payload: any) => void) {
    return this.subscribeToTable('alerts', callback, `family_id=eq.${familyId}`)
  }

  // Inscrever-se em mudanças de membros da família
  subscribeToFamilyMembers(familyId: string, callback: (payload: any) => void) {
    return this.subscribeToTable('family_members', callback, `family_id=eq.${familyId}`)
  }

  // Inscrever-se em mudanças de chat AI
  subscribeToAIChat(familyId: string, callback: (payload: any) => void) {
    return this.subscribeToTable('ai_chat_history', callback, `family_id=eq.${familyId}`)
  }

  // Broadcast de mensagens
  async broadcastMessage(channel: string, message: any) {
    try {
      const { data, error } = await supabase
        .channel(channel)
        .send({
          type: 'broadcast',
          event: 'message',
          payload: message
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro no broadcast de mensagem:', error)
      throw error
    }
  }

  // Inscrever-se em broadcast
  subscribeToBroadcast(channel: string, callback: (payload: any) => void) {
    return supabase
      .channel(channel)
      .on('broadcast', { event: 'message' }, callback)
      .subscribe()
  }

  // Presence (presença de usuários)
  async trackPresence(channel: string, presence: any) {
    try {
      const { data, error } = await supabase
        .channel(channel)
        .track(presence)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao rastrear presença:', error)
      throw error
    }
  }

  // Inscrever-se em mudanças de presença
  subscribeToPresence(channel: string, callback: (payload: any) => void) {
    return supabase
      .channel(channel)
      .on('presence', { event: 'sync' }, callback)
      .on('presence', { event: 'join' }, callback)
      .on('presence', { event: 'leave' }, callback)
      .subscribe()
  }

  // Obter presença atual
  async getPresence(channel: string) {
    try {
      const { data, error } = await supabase
        .channel(channel)
        .presence()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao obter presença:', error)
      throw error
    }
  }

  // Chat em tempo real
  async sendChatMessage(channel: string, message: any) {
    try {
      const { data, error } = await supabase
        .channel(channel)
        .send({
          type: 'broadcast',
          event: 'chat_message',
          payload: {
            ...message,
            timestamp: new Date().toISOString()
          }
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao enviar mensagem de chat:', error)
      throw error
    }
  }

  // Inscrever-se em mensagens de chat
  subscribeToChat(channel: string, callback: (payload: any) => void) {
    return supabase
      .channel(channel)
      .on('broadcast', { event: 'chat_message' }, callback)
      .subscribe()
  }

  // Notificações em tempo real
  async sendNotification(channel: string, notification: any) {
    try {
      const { data, error } = await supabase
        .channel(channel)
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: {
            ...notification,
            timestamp: new Date().toISOString()
          }
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      throw error
    }
  }

  // Inscrever-se em notificações
  subscribeToNotifications(channel: string, callback: (payload: any) => void) {
    return supabase
      .channel(channel)
      .on('broadcast', { event: 'notification' }, callback)
      .subscribe()
  }

  // Atualizar token de autenticação
  updateAuthToken(token: string) {
    supabase.realtime.setAuth(token)
  }

  // Desconectar de um canal
  async unsubscribe(channel: string) {
    try {
      const { error } = await supabase
        .channel(channel)
        .unsubscribe()

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao desconectar do canal:', error)
      throw error
    }
  }

  // Desconectar de todos os canais
  async unsubscribeAll() {
    try {
      const { error } = await supabase
        .removeAllChannels()

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao desconectar de todos os canais:', error)
      throw error
    }
  }

  // Obter status da conexão
  getConnectionStatus() {
    return supabase.realtime.getConnectionStatus()
  }

  // Canal para família específica
  getFamilyChannel(familyId: string) {
    return `family_${familyId}`
  }

  // Canal para documento específico
  getDocumentChannel(documentId: string) {
    return `document_${documentId}`
  }

  // Canal para usuário específico
  getUserChannel(userId: string) {
    return `user_${userId}`
  }

  // Inscrever-se em mudanças de documento específico
  subscribeToDocument(documentId: string, callback: (payload: any) => void) {
    return this.subscribeToTable('documents', callback, `id=eq.${documentId}`)
  }

  // Inscrever-se em mudanças de usuário específico
  subscribeToUser(userId: string, callback: (payload: any) => void) {
    return this.subscribeToTable('family_members', callback, `id=eq.${userId}`)
  }

  // Sistema de notificações em tempo real
  async sendFamilyNotification(familyId: string, notification: any) {
    const channel = this.getFamilyChannel(familyId)
    return await this.sendNotification(channel, notification)
  }

  // Inscrever-se em notificações da família
  subscribeToFamilyNotifications(familyId: string, callback: (payload: any) => void) {
    const channel = this.getFamilyChannel(familyId)
    return this.subscribeToNotifications(channel, callback)
  }

  // Chat da família
  async sendFamilyChatMessage(familyId: string, message: any) {
    const channel = this.getFamilyChannel(familyId)
    return await this.sendChatMessage(channel, message)
  }

  // Inscrever-se no chat da família
  subscribeToFamilyChat(familyId: string, callback: (payload: any) => void) {
    const channel = this.getFamilyChannel(familyId)
    return this.subscribeToChat(channel, callback)
  }

  // Presença da família
  async trackFamilyPresence(familyId: string, presence: any) {
    const channel = this.getFamilyChannel(familyId)
    return await this.trackPresence(channel, presence)
  }

  // Inscrever-se na presença da família
  subscribeToFamilyPresence(familyId: string, callback: (payload: any) => void) {
    const channel = this.getFamilyChannel(familyId)
    return this.subscribeToPresence(channel, callback)
  }

  // Obter presença da família
  async getFamilyPresence(familyId: string) {
    const channel = this.getFamilyChannel(familyId)
    return await this.getPresence(channel)
  }
}

export const realtimeService = new RealtimeService()
