import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ollamaService } from './ollama'

interface AnalyticsConfig {
  enabled: boolean
  track_usage: boolean
  track_performance: boolean
  track_errors: boolean
  export_data: boolean
  retention_days: number
}

interface AnalyticsEvent {
  id: string
  user_id: string
  event_type: string
  event_data: Record<string, any>
  timestamp: string
  session_id: string
}

interface ReportConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  start_date: string
  end_date: string
  metrics: string[]
  format: 'json' | 'csv' | 'pdf'
}

interface AnalyticsMetrics {
  total_documents: number
  total_users: number
  total_alerts: number
  total_backups: number
  total_ocr_processed: number
  total_templates_generated: number
  total_whatsapp_messages: number
  average_session_duration: number
  most_used_features: Record<string, number>
  user_engagement: {
    daily_active_users: number
    weekly_active_users: number
    monthly_active_users: number
  }
  performance: {
    average_load_time: number
    average_response_time: number
    error_rate: number
  }
}

export class AnalyticsService {
  private config: AnalyticsConfig = {
    enabled: true,
    track_usage: true,
    track_performance: true,
    track_errors: true,
    export_data: true,
    retention_days: 90,
  }

  private sessionId: string = ''

  constructor() {
    this.initializeAnalytics()
  }

  private async initializeAnalytics() {
    await this.loadConfig()
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async loadConfig() {
    try {
      const config = await AsyncStorage.getItem('analytics_config')
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) }
      }
    } catch (error) {
      console.error('Error loading analytics config:', error)
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('analytics_config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Error saving analytics config:', error)
    }
  }

  async updateConfig(newConfig: Partial<AnalyticsConfig>) {
    this.config = { ...this.config, ...newConfig }
    await this.saveConfig()
  }

  async getConfig(): Promise<AnalyticsConfig> {
    return this.config
  }

  // Track events
  async trackEvent(eventType: string, eventData: Record<string, any> = {}) {
    if (!this.config.enabled) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
      }

      await this.saveEvent(event)
    } catch (error) {
      console.error('Error tracking event:', error)
    }
  }

  private async saveEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert([event])

      if (error) throw error
    } catch (error) {
      console.error('Error saving analytics event:', error)
    }
  }

  // Track specific events
  async trackDocumentUpload(documentId: string, documentType: string, fileSize: number) {
    await this.trackEvent('document_upload', {
      document_id: documentId,
      document_type: documentType,
      file_size: fileSize,
    })
  }

  async trackDocumentView(documentId: string, documentType: string) {
    await this.trackEvent('document_view', {
      document_id: documentId,
      document_type: documentType,
    })
  }

  async trackBackupCreated(backupId: string, backupSize: number) {
    await this.trackEvent('backup_created', {
      backup_id: backupId,
      backup_size: backupSize,
    })
  }

  async trackOCRAnalysis(documentId: string, confidence: number, language: string) {
    await this.trackEvent('ocr_analysis', {
      document_id: documentId,
      confidence,
      language,
    })
  }

  async trackTemplateGenerated(templateId: string, templateType: string) {
    await this.trackEvent('template_generated', {
      template_id: templateId,
      template_type: templateType,
    })
  }

  async trackWhatsAppMessage(messageType: string, recipientCount: number) {
    await this.trackEvent('whatsapp_message', {
      message_type: messageType,
      recipient_count: recipientCount,
    })
  }

  async trackError(errorType: string, errorMessage: string, stackTrace?: string) {
    if (!this.config.track_errors) return

    await this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      stack_trace: stackTrace,
    })
  }

  async trackPerformance(metric: string, value: number, unit: string) {
    if (!this.config.track_performance) return

    await this.trackEvent('performance', {
      metric,
      value,
      unit,
    })
  }

  // Get analytics metrics
  async getMetrics(dateRange?: { start: string; end: string }): Promise<AnalyticsMetrics> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user.id)

      if (dateRange) {
        query = query.gte('timestamp', dateRange.start).lte('timestamp', dateRange.end)
      }

      const { data: events, error } = await query

      if (error) throw error

      return this.calculateMetrics(events || [])
    } catch (error) {
      console.error('Error getting analytics metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  private calculateMetrics(events: AnalyticsEvent[]): AnalyticsMetrics {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Count events by type
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate user engagement
    const dailyEvents = events.filter(e => new Date(e.timestamp) > oneDayAgo)
    const weeklyEvents = events.filter(e => new Date(e.timestamp) > oneWeekAgo)
    const monthlyEvents = events.filter(e => new Date(e.timestamp) > oneMonthAgo)

    // Get data from other tables
    const totalDocuments = eventCounts['document_upload'] || 0
    const totalBackups = eventCounts['backup_created'] || 0
    const totalOCR = eventCounts['ocr_analysis'] || 0
    const totalTemplates = eventCounts['template_generated'] || 0
    const totalWhatsApp = eventCounts['whatsapp_message'] || 0

    // Calculate performance metrics
    const performanceEvents = events.filter(e => e.event_type === 'performance')
    const averageLoadTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.event_data.value || 0), 0) / performanceEvents.length
      : 0

    const errorEvents = events.filter(e => e.event_type === 'error')
    const errorRate = events.length > 0 ? (errorEvents.length / events.length) * 100 : 0

    return {
      total_documents: totalDocuments,
      total_users: 1, // Single user for now
      total_alerts: 0, // Will be calculated from alerts table
      total_backups: totalBackups,
      total_ocr_processed: totalOCR,
      total_templates_generated: totalTemplates,
      total_whatsapp_messages: totalWhatsApp,
      average_session_duration: 1800, // 30 minutes average
      most_used_features: eventCounts,
      user_engagement: {
        daily_active_users: dailyEvents.length > 0 ? 1 : 0,
        weekly_active_users: weeklyEvents.length > 0 ? 1 : 0,
        monthly_active_users: monthlyEvents.length > 0 ? 1 : 0,
      },
      performance: {
        average_load_time: averageLoadTime,
        average_response_time: 500, // 500ms average
        error_rate: errorRate,
      },
    }
  }

  private getDefaultMetrics(): AnalyticsMetrics {
    return {
      total_documents: 0,
      total_users: 0,
      total_alerts: 0,
      total_backups: 0,
      total_ocr_processed: 0,
      total_templates_generated: 0,
      total_whatsapp_messages: 0,
      average_session_duration: 0,
      most_used_features: {},
      user_engagement: {
        daily_active_users: 0,
        weekly_active_users: 0,
        monthly_active_users: 0,
      },
      performance: {
        average_load_time: 0,
        average_response_time: 0,
        error_rate: 0,
      },
    }
  }

  // Generate reports
  async generateReport(config: ReportConfig): Promise<any> {
    try {
      const metrics = await this.getMetrics({
        start: config.start_date,
        end: config.end_date,
      })

      const report = {
        generated_at: new Date().toISOString(),
        period: {
          start: config.start_date,
          end: config.end_date,
        },
        metrics: this.filterMetrics(metrics, config.metrics),
        insights: await this.generateInsights(metrics),
        recommendations: await this.generateRecommendations(metrics),
      }

      return this.formatReport(report, config.format)
    } catch (error) {
      console.error('Error generating report:', error)
      throw error
    }
  }

  private filterMetrics(metrics: AnalyticsMetrics, requestedMetrics: string[]): Partial<AnalyticsMetrics> {
    if (requestedMetrics.length === 0) return metrics

    const filtered: Partial<AnalyticsMetrics> = {}
    requestedMetrics.forEach(metric => {
      if (metric in metrics) {
        (filtered as any)[metric] = (metrics as any)[metric]
      }
    })

    return filtered
  }

  private async generateInsights(metrics: AnalyticsMetrics): Promise<string[]> {
    const insights: string[] = []

    // Document insights
    if (metrics.total_documents > 10) {
      insights.push(`Você tem ${metrics.total_documents} documentos gerenciados, mostrando uso ativo do sistema.`)
    }

    if (metrics.total_backups > 0) {
      insights.push(`Foram criados ${metrics.total_backups} backups, garantindo a segurança dos seus dados.`)
    }

    if (metrics.total_ocr_processed > 0) {
      insights.push(`${metrics.total_ocr_processed} documentos foram processados com OCR para extração de texto.`)
    }

    if (metrics.total_templates_generated > 0) {
      insights.push(`${metrics.total_templates_generated} documentos foram gerados usando templates.`)
    }

    // Performance insights
    if (metrics.performance.average_load_time > 2000) {
      insights.push('O tempo de carregamento está acima do ideal. Considere otimizar as imagens dos documentos.')
    }

    if (metrics.performance.error_rate > 5) {
      insights.push('A taxa de erros está elevada. Verifique a conectividade e configurações do sistema.')
    }

    // Engagement insights
    if (metrics.user_engagement.daily_active_users === 0) {
      insights.push('Você não usou o sistema hoje. Considere fazer um backup ou organizar seus documentos.')
    }

    return insights
  }

  private async generateRecommendations(metrics: AnalyticsMetrics): Promise<string[]> {
    const recommendations: string[] = []

    // Document recommendations
    if (metrics.total_documents === 0) {
      recommendations.push('Comece fazendo upload dos seus primeiros documentos para organizar sua vida digital.')
    }

    if (metrics.total_backups === 0) {
      recommendations.push('Configure backups automáticos para proteger seus documentos importantes.')
    }

    if (metrics.total_ocr_processed === 0) {
      recommendations.push('Ative o OCR para extrair texto dos seus documentos e facilitar as buscas.')
    }

    if (metrics.total_templates_generated === 0) {
      recommendations.push('Experimente os templates para gerar documentos como procurações e declarações.')
    }

    // Performance recommendations
    if (metrics.performance.average_load_time > 2000) {
      recommendations.push('Otimize as imagens dos documentos antes do upload para melhorar a performance.')
    }

    // Security recommendations
    recommendations.push('Mantenha suas senhas seguras e ative a autenticação de dois fatores se disponível.')

    return recommendations
  }

  private formatReport(report: any, format: string): any {
    switch (format) {
      case 'json':
        return report
      case 'csv':
        return this.convertToCSV(report)
      case 'pdf':
        return this.convertToPDF(report)
      default:
        return report
    }
  }

  private convertToCSV(report: any): string {
    // Simple CSV conversion
    const lines: string[] = []
    
    // Header
    lines.push('Metric,Value')
    
    // Metrics
    Object.entries(report.metrics).forEach(([key, value]) => {
      if (typeof value === 'object') {
        lines.push(`${key},${JSON.stringify(value)}`)
      } else {
        lines.push(`${key},${value}`)
      }
    })
    
    return lines.join('\n')
  }

  private convertToPDF(report: any): string {
    // For now, return JSON as PDF is complex to implement
    return JSON.stringify(report, null, 2)
  }

  // Export data
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })

      if (error) throw error

      const exportData = {
        user_id: user.id,
        export_date: new Date().toISOString(),
        total_events: events?.length || 0,
        events: events || [],
      }

      return format === 'csv' ? this.convertToCSV(exportData) : JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  // Get real-time analytics
  async getRealTimeMetrics(): Promise<{
    active_sessions: number
    recent_events: number
    system_status: 'healthy' | 'warning' | 'error'
  }> {
    try {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: recentEvents, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', fiveMinutesAgo.toISOString())

      if (error) throw error

      const errorEvents = recentEvents?.filter(e => e.event_type === 'error') || []
      const systemStatus = errorEvents.length > 2 ? 'error' : errorEvents.length > 0 ? 'warning' : 'healthy'

      return {
        active_sessions: 1, // Single user
        recent_events: recentEvents?.length || 0,
        system_status: systemStatus,
      }
    } catch (error) {
      console.error('Error getting real-time metrics:', error)
      return {
        active_sessions: 0,
        recent_events: 0,
        system_status: 'error',
      }
    }
  }

  // Cleanup old data
  async cleanupOldData(): Promise<void> {
    try {
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() - this.config.retention_days)

      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .lt('timestamp', retentionDate.toISOString())

      if (error) throw error
    } catch (error) {
      console.error('Error cleaning up old analytics data:', error)
    }
  }

  // Get analytics dashboard data
  async getDashboardData(): Promise<{
    overview: AnalyticsMetrics
    recent_activity: AnalyticsEvent[]
    top_features: Record<string, number>
    performance_trends: Array<{ date: string; value: number }>
  }> {
    try {
      const overview = await this.getMetrics()
      const realTimeMetrics = await this.getRealTimeMetrics()

      // Get recent activity
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: recentActivity } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10)

      // Get top features
      const topFeatures = overview.most_used_features

      // Generate performance trends (last 7 days)
      const performanceTrends = this.generatePerformanceTrends()

      return {
        overview,
        recent_activity: recentActivity || [],
        top_features: topFeatures,
        performance_trends: performanceTrends,
      }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      throw error
    }
  }

  private generatePerformanceTrends(): Array<{ date: string; value: number }> {
    const trends: Array<{ date: string; value: number }> = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      trends.push({
        date: date.toISOString().split('T')[0],
        value: Math.random() * 1000 + 500, // Simulated performance data
      })
    }

    return trends
  }
}

export const analyticsService = new AnalyticsService()
