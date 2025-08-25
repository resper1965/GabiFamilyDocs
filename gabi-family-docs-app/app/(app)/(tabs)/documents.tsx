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
import { Link, router } from 'expo-router'
import { useSession } from '../../../src/contexts/SessionContext'
import { documentService } from '../../../src/services/documents'

interface Document {
  id: string
  title: string
  document_type: string
  created_at: string
  family_member_name: string
  categories?: string[]
}

export default function DocumentsScreen() {
  const { user } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      // TODO: Implement with real family ID
      const familyId = 'temp-family-id'
      const docs = await documentService.getFamilyDocuments(familyId)
      setDocuments(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
      Alert.alert('Erro', 'Não foi possível carregar os documentos')
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDocuments()
    setRefreshing(false)
  }

  const handleDeleteDocument = async (documentId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentService.deleteDocument(documentId)
              await loadDocuments()
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o documento')
            }
          },
        },
      ]
    )
  }

  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rg':
      case 'cpf':
        return 'card'
      case 'passaporte':
        return 'airplane'
      case 'certidao':
        return 'document-text'
      case 'contrato':
        return 'document'
      default:
        return 'document-text'
    }
  }

  const getDocumentColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rg':
      case 'cpf':
        return '#00ade8'
      case 'passaporte':
        return '#4CAF50'
      case 'certidao':
        return '#FF9800'
      case 'contrato':
        return '#9C27B0'
      default:
        return '#666'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => router.push(`/(app)/documents/${item.id}`)}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <Ionicons
            name={getDocumentIcon(item.document_type) as any}
            size={24}
            color={getDocumentColor(item.document_type)}
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>{item.title}</Text>
          <Text style={styles.documentType}>{item.document_type}</Text>
          <Text style={styles.documentMember}>{item.family_member_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDocument(item.id)}
        >
          <Ionicons name="trash" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.documentFooter}>
        <Text style={styles.documentDate}>
          Criado em {formatDate(item.created_at)}
        </Text>
        {item.categories && item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {item.categories.slice(0, 2).map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
            {item.categories.length > 2 && (
              <Text style={styles.moreCategories}>
                +{item.categories.length - 2}
              </Text>
            )}
          </View>
        )}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentos</Text>
        <Link href="/(app)/documents/upload" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.filters}>
        <FilterButton title="Todos" value="all" icon="documents" />
        <FilterButton title="RG/CPF" value="identity" icon="card" />
        <FilterButton title="Passaporte" value="passport" icon="airplane" />
        <FilterButton title="Certidões" value="certificates" icon="document-text" />
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum documento encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Adicione seu primeiro documento para começar
            </Text>
            <Link href="/(app)/documents/upload" asChild>
              <TouchableOpacity style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Adicionar Documento</Text>
              </TouchableOpacity>
            </Link>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00ade8',
    justifyContent: 'center',
    alignItems: 'center',
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
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Montserrat-SemiBold',
  },
  documentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Montserrat-Regular',
  },
  documentMember: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
  deleteButton: {
    padding: 8,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
  categoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#00ade8',
    fontFamily: 'Montserrat-Medium',
  },
  moreCategories: {
    fontSize: 10,
    color: '#999',
    marginLeft: 4,
    fontFamily: 'Montserrat-Regular',
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
    marginBottom: 24,
    fontFamily: 'Montserrat-Regular',
  },
  emptyButton: {
    backgroundColor: '#00ade8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
})
