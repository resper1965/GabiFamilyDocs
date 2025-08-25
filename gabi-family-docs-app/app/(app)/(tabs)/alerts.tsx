import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSession } from '../../../src/contexts/SessionContext'
import { alertService } from '../../../src/services/alerts'

interface AlertItem {
  id: string
  alert_type: string
  message: string
  due_date: string | null
  is_read: boolean
  priority: string
  created_at: string
  document_title?: string
  family_member_name?: string
}

export default function AlertsScreen() {
  const { user } = useSession()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      // TODO: Implement with real family ID
      const familyId = 'temp-family-id'
      const alertsData = await alertService.getFamilyAlerts(familyId)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading alerts:', error)
      Alert.alert('Erro', 'Não foi possível carregar os alertas')
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAlerts()
    setRefreshing(false)
  }

  const markAsRead = async (alertId: string) => {
    try {
      await alertService.markAlertAsRead(alertId)
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      )
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível marcar o alerta como lido')
    }
  }

  const deleteAlert = async (alertId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este alerta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await alertService.deleteAlert(alertId)
              setAlerts(prev => prev.filter(alert => alert.id !== alertId))
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o alerta')
            }
          },
        },
      ]
    )
  }

  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'expiry':
        return 'time'
      case 'reminder':
        return 'notifications'
      case 'document':
        return 'document-text'
      case 'family':
        return 'people'
      default:
        return 'information-circle'
    }
  }

  const getAlertColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF4444'
      case 'medium':
        return '#FF9800'
      case 'low':
        return '#4CAF50'
      default:
        return '#666'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Média'
      case 'low':
        return 'Baixa'
      default:
        return priority
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `Vencido há ${Math.abs(diffDays)} dias`
    } else if (diffDays === 0) {
      return 'Vence hoje'
    } else if (diffDays === 1) {
      return 'Vence amanhã'
    } else {
      return `Vence em ${diffDays} dias`
    }
  }

  const renderAlert = ({ item }: { item: AlertItem }) => (
    <TouchableOpacity
      style={[
        styles.alertCard,
        !item.is_read && styles.unreadAlert,
        { borderLeftColor: getAlertColor(item.priority) }
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <Ionicons
            name={getAlertIcon(item.alert_type) as any}
            size={20}
            color={getAlertColor(item.priority)}
          />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertMessage}>{item.message}</Text>
          {item.document_title && (
            <Text style={styles.alertDocument}>Documento: {item.document_title}</Text>
          )}
          {item.family_member_name && (
            <Text style={styles.alertMember}>Membro: {item.family_member_name}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteAlert(item.id)}
        >
          <Ionicons name="trash" size={16} color="#FF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.alertFooter}>
        <View style={styles.alertMeta}>
          <Text style={styles.alertDate}>
            Criado em {formatDate(item.created_at)}
          </Text>
          {item.due_date && (
            <Text style={[
              styles.dueDate,
              { color: getAlertColor(item.priority) }
            ]}>
              {getDaysUntilDue(item.due_date)}
            </Text>
          )}
        </View>
        <View style={styles.alertPriority}>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getAlertColor(item.priority) }
          ]}>
            <Text style={styles.priorityText}>
              {getPriorityText(item.priority)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  const FilterButton = ({ title, value, icon }: any) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === value && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Ionicons
        name={icon}
        size={16}
        color={selectedFilter === value ? '#fff' : '#666'}
      />
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  )

  const filteredAlerts = alerts.filter(alert => {
    switch (selectedFilter) {
      case 'unread':
        return !alert.is_read
      case 'high':
        return alert.priority === 'high'
      case 'expiry':
        return alert.alert_type === 'expiry'
      default:
        return true
    }
  })

  const unreadCount = alerts.filter(alert => !alert.is_read).length

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.filters}>
        <FilterButton title="Todos" value="all" icon="list" />
        <FilterButton title="Não lidos" value="unread" icon="mail-unread" />
        <FilterButton title="Alta prioridade" value="high" icon="warning" />
        <FilterButton title="Vencimentos" value="expiry" icon="time" />
      </View>

      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum alerta encontrado</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'Você está em dia com todos os alertas!'
                : 'Nenhum alerta corresponde ao filtro selecionado'
              }
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Montserrat-Bold',
  },
  badge: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#00ade8',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'Montserrat-Medium',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadAlert: {
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Montserrat-Medium',
  },
  alertDocument: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Montserrat-Regular',
  },
  alertMember: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  deleteButton: {
    padding: 4,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertMeta: {
    flex: 1,
  },
  alertDate: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
  dueDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    fontFamily: 'Montserrat-Medium',
  },
  alertPriority: {
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Montserrat-SemiBold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
})
