import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useSession } from '../../../src/contexts/SessionContext'
import { documentService } from '../../../src/services/documents'
import { alertService } from '../../../src/services/alerts'

interface DashboardStats {
  totalDocuments: number
  recentDocuments: number
  unreadAlerts: number
  upcomingReminders: number
}

export default function DashboardScreen() {
  const { user } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    recentDocuments: 0,
    unreadAlerts: 0,
    upcomingReminders: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // TODO: Implement with real family ID
      const familyId = 'temp-family-id'
      
      // Load documents count
      const documents = await documentService.getFamilyDocuments(familyId)
      
      // Load alerts count
      const alerts = await alertService.getFamilyAlerts(familyId)
      
      // Load reminders
      const reminders = await alertService.getUpcomingReminders(7)

      setStats({
        totalDocuments: documents.length,
        recentDocuments: documents.filter(doc => {
          const docDate = new Date(doc.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return docDate > weekAgo
        }).length,
        unreadAlerts: alerts.length,
        upcomingReminders: reminders.length,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="#fff" />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const QuickAction = ({ title, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.email?.split('@')[0] || 'Usuário'}!</Text>
        <Text style={styles.subtitle}>Bem-vindo ao Gabi Family Docs</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Documentos"
            value={stats.totalDocuments}
            icon="document"
            color="#00ade8"
            onPress={() => {}}
          />
          <StatCard
            title="Recentes"
            value={stats.recentDocuments}
            icon="time"
            color="#4CAF50"
            onPress={() => {}}
          />
          <StatCard
            title="Alertas"
            value={stats.unreadAlerts}
            icon="notifications"
            color="#FF9800"
            onPress={() => {}}
          />
          <StatCard
            title="Lembretes"
            value={stats.upcomingReminders}
            icon="calendar"
            color="#9C27B0"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          <Link href="/(app)/documents" asChild>
            <QuickAction
              title="Adicionar Documento"
              icon="add-circle"
              color="#00ade8"
            />
          </Link>
          <Link href="/(app)/chat" asChild>
            <QuickAction
              title="Chat AI"
              icon="chatbubble"
              color="#4CAF50"
            />
          </Link>
          <Link href="/(app)/(tabs)/alerts" asChild>
            <QuickAction
              title="Ver Alertas"
              icon="notifications"
              color="#FF9800"
            />
          </Link>
          <Link href="/(app)/profile" asChild>
            <QuickAction
              title="Perfil"
              icon="person"
              color="#9C27B0"
            />
          </Link>
        </View>
      </View>

      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Documentos Recentes</Text>
        <View style={styles.recentPlaceholder}>
          <Ionicons name="document-text" size={48} color="#ccc" />
          <Text style={styles.recentPlaceholderText}>
            Nenhum documento recente
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#00ade8',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Montserrat-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    fontFamily: 'Montserrat-Regular',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
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
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Montserrat-Bold',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  quickActionsContainer: {
    padding: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Montserrat-Medium',
  },
  recentContainer: {
    padding: 20,
  },
  recentPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentPlaceholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontFamily: 'Montserrat-Regular',
  },
})
