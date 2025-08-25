import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useSession } from '../../../src/contexts/SessionContext'

interface ProfileOption {
  id: string
  title: string
  subtitle?: string
  icon: string
  color: string
  onPress: () => void
  showSwitch?: boolean
  switchValue?: boolean
  onSwitchChange?: (value: boolean) => void
}

export default function ProfileScreen() {
  const { user, signOut } = useSession()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)

  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
              router.replace('/(auth)/login')
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair da conta')
            }
          },
        },
      ]
    )
  }

  const profileOptions: ProfileOption[] = [
    {
      id: 'account',
      title: 'Conta',
      subtitle: 'Informações pessoais e configurações',
      icon: 'person',
      color: '#00ade8',
      onPress: () => router.push('/(app)/profile/account'),
    },
    {
      id: 'family',
      title: 'Família',
      subtitle: 'Gerenciar membros da família',
      icon: 'people',
      color: '#4CAF50',
      onPress: () => router.push('/(app)/profile/family'),
    },
    {
      id: 'notifications',
      title: 'Notificações',
      subtitle: 'Configurar alertas e lembretes',
      icon: 'notifications',
      color: '#FF9800',
      showSwitch: true,
      switchValue: notificationsEnabled,
      onSwitchChange: setNotificationsEnabled,
    },
    {
      id: 'security',
      title: 'Segurança',
      subtitle: 'Senha, autenticação e privacidade',
      icon: 'shield-checkmark',
      color: '#9C27B0',
      onPress: () => router.push('/(app)/profile/security'),
    },
    {
      id: 'biometric',
      title: 'Login Biométrico',
      subtitle: 'Usar impressão digital ou Face ID',
      icon: 'finger-print',
      color: '#607D8B',
      showSwitch: true,
      switchValue: biometricEnabled,
      onSwitchChange: setBiometricEnabled,
    },
    {
      id: 'appearance',
      title: 'Aparência',
      subtitle: 'Tema escuro e personalização',
      icon: 'color-palette',
      color: '#795548',
      showSwitch: true,
      switchValue: darkModeEnabled,
      onSwitchChange: setDarkModeEnabled,
    },
    {
      id: 'storage',
      title: 'Armazenamento',
      subtitle: 'Gerenciar espaço e backups',
      icon: 'cloud',
      color: '#2196F3',
      onPress: () => router.push('/(app)/profile/storage'),
    },
    {
      id: 'help',
      title: 'Ajuda e Suporte',
      subtitle: 'FAQ, tutoriais e contato',
      icon: 'help-circle',
      color: '#FF5722',
      onPress: () => router.push('/(app)/profile/help'),
    },
    {
      id: 'about',
      title: 'Sobre o App',
      subtitle: 'Versão, licenças e informações',
      icon: 'information-circle',
      color: '#607D8B',
      onPress: () => router.push('/(app)/profile/about'),
    },
  ]

  const renderProfileOption = ({ item }: { item: ProfileOption }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={item.onPress}
      disabled={item.showSwitch}
    >
      <View style={styles.optionContent}>
        <View style={[styles.optionIcon, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={20} color="#fff" />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        {item.showSwitch ? (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchChange}
            trackColor={{ false: '#e0e0e0', true: item.color }}
            thumbColor="#fff"
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Usuário'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userStatus}>Membro desde 2024</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Documentos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Alertas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1.2GB</Text>
          <Text style={styles.statLabel}>Armazenamento</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações</Text>
        {profileOptions.map((option) => (
          <View key={option.id}>
            {renderProfileOption({ item: option })}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#FF4444" />
          <Text style={styles.signOutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Gabi Family Docs v1.0.0
        </Text>
        <Text style={styles.footerSubtext}>
          Desenvolvido com ❤️ para sua família
        </Text>
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00ade8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Montserrat-Bold',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Montserrat-Regular',
  },
  userStatus: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ade8',
    marginBottom: 4,
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    paddingBottom: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  optionCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Montserrat-Medium',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  signOutText: {
    fontSize: 16,
    color: '#FF4444',
    marginLeft: 8,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Montserrat-Regular',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
})
