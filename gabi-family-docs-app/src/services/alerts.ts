import { supabase } from '../lib/supabase'

export class AlertService {
  // Buscar alertas da família
  async getFamilyAlerts(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      throw error
    }
  }

  // Buscar lembretes com detalhes (usando view)
  async getRemindersWithDetails(familyId: string) {
    try {
      const { data, error } = await supabase
        .from('reminders_with_details')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_completed', false)
        .order('due_date', { ascending: true })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error)
      throw error
    }
  }

  // Buscar lembretes próximos (usando função)
  async getUpcomingReminders(daysAhead: number = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_upcoming_reminders', {
          days_ahead: daysAhead
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar lembretes próximos:', error)
      throw error
    }
  }

  // Criar alerta
  async createAlert(familyId: string, alertData: any) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          family_id: familyId,
          document_id: alertData.documentId,
          alert_type: alertData.type,
          message: alertData.message,
          due_date: alertData.dueDate,
          priority: alertData.priority || 'medium'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar alerta:', error)
      throw error
    }
  }

  // Marcar alerta como lido
  async markAlertAsRead(alertId: string) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          is_read: true
        })
        .eq('id', alertId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error)
      throw error
    }
  }

  // Deletar alerta
  async deleteAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar alerta:', error)
      throw error
    }
  }

  // Criar alerta de vencimento
  async createExpirationAlert(familyId: string, documentId: string, dueDate: string) {
    try {
      const daysUntilExpiry = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      let priority = 'low'
      if (daysUntilExpiry <= 7) priority = 'high'
      else if (daysUntilExpiry <= 30) priority = 'medium'

      const message = `Documento vence em ${daysUntilExpiry} dias`

      return await this.createAlert(familyId, {
        documentId,
        type: 'expiration',
        message,
        dueDate,
        priority
      })
    } catch (error) {
      console.error('Erro ao criar alerta de vencimento:', error)
      throw error
    }
  }

  // Criar alerta de renovação
  async createRenewalAlert(familyId: string, documentId: string, renewalDate: string) {
    try {
      const message = 'Documento precisa ser renovado'

      return await this.createAlert(familyId, {
        documentId,
        type: 'renewal',
        message,
        dueDate: renewalDate,
        priority: 'medium'
      })
    } catch (error) {
      console.error('Erro ao criar alerta de renovação:', error)
      throw error
    }
  }

  // Buscar alertas por tipo
  async getAlertsByType(familyId: string, alertType: string) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('family_id', familyId)
        .eq('alert_type', alertType)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar alertas por tipo:', error)
      throw error
    }
  }

  // Buscar alertas por prioridade
  async getAlertsByPriority(familyId: string, priority: string) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('family_id', familyId)
        .eq('priority', priority)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar alertas por prioridade:', error)
      throw error
    }
  }

  // Contar alertas não lidos
  async getUnreadAlertsCount(familyId: string) {
    try {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao contar alertas não lidos:', error)
      throw error
    }
  }

  // Marcar todos os alertas como lidos
  async markAllAlertsAsRead(familyId: string) {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          is_read: true
        })
        .eq('family_id', familyId)
        .eq('is_read', false)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Erro ao marcar todos os alertas como lidos:', error)
      throw error
    }
  }

  // Realtime subscription para alertas
  subscribeToAlerts(familyId: string, callback: (payload: any) => void) {
    return supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `family_id=eq.${familyId}`
        },
        callback
      )
      .subscribe()
  }
}

export const alertService = new AlertService()
