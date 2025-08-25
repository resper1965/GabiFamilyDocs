import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

interface NotificationConfig {
  enabled: boolean
  document_expiry: boolean
  document_upload: boolean
  chat_messages: boolean
  system_alerts: boolean
  quiet_hours: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
  }
  sound_enabled: boolean
  vibration_enabled: boolean
}

interface NotificationSchedule {
  id: string
  title: string
  body: string
  data?: any
  trigger: Notifications.NotificationTriggerInput
  category?: string
}

interface NotificationCategory {
  identifier: string
  actions: Notifications.NotificationAction[]
  options?: Notifications.NotificationCategoryOptions
}

export class NotificationService {
  private config: NotificationConfig = {
    enabled: true,
    document_expiry: true,
    document_upload: true,
    chat_messages: true,
    system_alerts: true,
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    sound_enabled: true,
    vibration_enabled: true,
  }

  constructor() {
    this.initializeNotifications()
  }

  private async initializeNotifications() {
    await this.loadConfig()
    await this.setupNotificationHandler()
    await this.registerForPushNotifications()
    await this.setupNotificationCategories()
  }

  private async loadConfig() {
    try {
      const config = await AsyncStorage.getItem('notification_config')
      if (config) {
        this.config = { ...this.config, ...JSON.parse(config) }
      }
    } catch (error) {
      console.error('Error loading notification config:', error)
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('notification_config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Error saving notification config:', error)
    }
  }

  private async setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        return {
          shouldShowAlert: true,
          shouldPlaySound: this.config.sound_enabled,
          shouldSetBadge: true,
        }
      },
    })
  }

  private async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications')
      return
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID,
    })

    // Save token to Supabase
    await this.savePushToken(token.data)

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }
  }

  private async savePushToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: Platform.OS,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error saving push token:', error)
      }
    } catch (error) {
      console.error('Error saving push token:', error)
    }
  }

  private async setupNotificationCategories() {
    const categories: NotificationCategory[] = [
      {
        identifier: 'document_actions',
        actions: [
          {
            identifier: 'view_document',
            buttonTitle: 'Ver Documento',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: 'mark_read',
            buttonTitle: 'Marcar como Lido',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
        ],
        options: {
          allowAnnouncement: true,
        },
      },
      {
        identifier: 'alert_actions',
        actions: [
          {
            identifier: 'view_alert',
            buttonTitle: 'Ver Alerta',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: 'dismiss_alert',
            buttonTitle: 'Dispensar',
            options: {
              isDestructive: true,
              isAuthenticationRequired: false,
            },
          },
        ],
      },
      {
        identifier: 'chat_actions',
        actions: [
          {
            identifier: 'reply',
            buttonTitle: 'Responder',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: 'view_chat',
            buttonTitle: 'Ver Chat',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
        ],
      },
    ]

    await Notifications.setNotificationCategoryAsync('document_actions', categories[0])
    await Notifications.setNotificationCategoryAsync('alert_actions', categories[1])
    await Notifications.setNotificationCategoryAsync('chat_actions', categories[2])
  }

  async updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...newConfig }
    await this.saveConfig()
  }

  async getConfig(): Promise<NotificationConfig> {
    return this.config
  }

  // Immediate notifications
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any,
    category?: string
  ) {
    if (!this.config.enabled) return

    if (this.isInQuietHours()) {
      console.log('Notification suppressed due to quiet hours')
      return
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: this.config.sound_enabled ? 'default' : undefined,
        categoryIdentifier: category,
      },
      trigger: null, // Immediate
    })
  }

  // Scheduled notifications
  async scheduleNotification(schedule: NotificationSchedule) {
    if (!this.config.enabled) return

    await Notifications.scheduleNotificationAsync({
      content: {
        title: schedule.title,
        body: schedule.body,
        data: schedule.data,
        sound: this.config.sound_enabled ? 'default' : undefined,
        categoryIdentifier: schedule.category,
      },
      trigger: schedule.trigger,
    })
  }

  // Document expiry notifications
  async scheduleDocumentExpiryNotification(
    documentId: string,
    documentTitle: string,
    expiryDate: Date,
    daysBefore: number = 7
  ) {
    if (!this.config.document_expiry) return

    const notificationDate = new Date(expiryDate)
    notificationDate.setDate(notificationDate.getDate() - daysBefore)

    if (notificationDate > new Date()) {
      await this.scheduleNotification({
        id: `doc_expiry_${documentId}_${daysBefore}`,
        title: 'Documento Vencendo',
        body: `O documento "${documentTitle}" vence em ${daysBefore} dias`,
        data: {
          type: 'document_expiry',
          documentId,
          daysBefore,
        },
        trigger: {
          date: notificationDate,
        },
        category: 'document_actions',
      })
    }
  }

  // Document upload notifications
  async sendDocumentUploadNotification(documentTitle: string, familyMemberName: string) {
    if (!this.config.document_upload) return

    await this.sendImmediateNotification(
      'Documento Adicionado',
      `"${documentTitle}" foi adicionado para ${familyMemberName}`,
      {
        type: 'document_upload',
        documentTitle,
        familyMemberName,
      },
      'document_actions'
    )
  }

  // Chat message notifications
  async sendChatMessageNotification(senderName: string, message: string) {
    if (!this.config.chat_messages) return

    await this.sendImmediateNotification(
      `Nova mensagem de ${senderName}`,
      message.length > 50 ? `${message.substring(0, 50)}...` : message,
      {
        type: 'chat_message',
        senderName,
        message,
      },
      'chat_actions'
    )
  }

  // System alert notifications
  async sendSystemAlertNotification(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    if (!this.config.system_alerts) return

    await this.sendImmediateNotification(
      title,
      message,
      {
        type: 'system_alert',
        priority,
      },
      'alert_actions'
    )
  }

  // Recurring notifications
  async scheduleRecurringNotification(
    id: string,
    title: string,
    body: string,
    interval: 'daily' | 'weekly' | 'monthly',
    hour: number = 9,
    minute: number = 0
  ) {
    const trigger: Notifications.NotificationTriggerInput = {
      hour,
      minute,
      repeats: true,
    }

    if (interval === 'weekly') {
      trigger.weekday = 1 // Monday
    } else if (interval === 'monthly') {
      trigger.day = 1
    }

    await this.scheduleNotification({
      id,
      title,
      body,
      trigger,
    })
  }

  // Cancel notifications
  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  // Get scheduled notifications
  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync()
  }

  // Quiet hours check
  private isInQuietHours(): boolean {
    if (!this.config.quiet_hours.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { start, end } = this.config.quiet_hours
    
    if (start <= end) {
      // Same day (e.g., 08:00 to 22:00)
      return currentTime >= start && currentTime <= end
    } else {
      // Overnight (e.g., 22:00 to 08:00)
      return currentTime >= start || currentTime <= end
    }
  }

  // Badge management
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count)
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync()
  }

  // Notification history
  async getNotificationHistory(): Promise<Notifications.Notification[]> {
    return await Notifications.getPresentedNotificationsAsync()
  }

  // Test notification
  async sendTestNotification() {
    await this.sendImmediateNotification(
      'Teste de Notificação',
      'Esta é uma notificação de teste do Gabi Family Docs',
      { type: 'test' }
    )
  }

  // Bulk notifications
  async sendBulkNotifications(notifications: Array<{ title: string; body: string; data?: any }>) {
    for (const notification of notifications) {
      await this.sendImmediateNotification(
        notification.title,
        notification.body,
        notification.data
      )
    }
  }

  // Notification analytics
  async trackNotificationOpen(notificationId: string, action?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notification_analytics')
        .insert({
          user_id: user.id,
          notification_id: notificationId,
          action: action || 'open',
          timestamp: new Date().toISOString(),
        })

      if (error) {
        console.error('Error tracking notification:', error)
      }
    } catch (error) {
      console.error('Error tracking notification:', error)
    }
  }

  // Notification preferences by type
  async updateNotificationPreference(type: keyof NotificationConfig, enabled: boolean) {
    if (type === 'quiet_hours' || type === 'sound_enabled' || type === 'vibration_enabled') {
      return // These are not boolean preferences
    }

    this.config[type] = enabled
    await this.saveConfig()
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    total_sent: number
    total_opened: number
    open_rate: number
    most_active_hour: number
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { total_sent: 0, total_opened: 0, open_rate: 0, most_active_hour: 0 }

      const { data, error } = await supabase
        .from('notification_analytics')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      const totalSent = data?.length || 0
      const totalOpened = data?.filter(item => item.action === 'open').length || 0
      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0

      // Calculate most active hour
      const hourCounts = new Array(24).fill(0)
      data?.forEach(item => {
        const hour = new Date(item.timestamp).getHours()
        hourCounts[hour]++
      })
      const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

      return {
        total_sent: totalSent,
        total_opened: totalOpened,
        open_rate: openRate,
        most_active_hour: mostActiveHour,
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      return { total_sent: 0, total_opened: 0, open_rate: 0, most_active_hour: 0 }
    }
  }
}

export const notificationService = new NotificationService()
