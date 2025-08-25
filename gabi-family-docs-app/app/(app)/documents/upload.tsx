import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { useSession } from '../../src/contexts/SessionContext'
import { documentService } from '../../src/services/documents'
import { storageService } from '../../src/services/storage'

interface UploadForm {
  title: string
  description: string
  documentType: string
  familyMember: string
  categories: string[]
  tags: string[]
}

const documentTypes = [
  { value: 'rg', label: 'RG', icon: 'card' },
  { value: 'cpf', label: 'CPF', icon: 'card' },
  { value: 'passaporte', label: 'Passaporte', icon: 'airplane' },
  { value: 'certidao_nascimento', label: 'Certidão de Nascimento', icon: 'document-text' },
  { value: 'certidao_casamento', label: 'Certidão de Casamento', icon: 'document-text' },
  { value: 'contrato', label: 'Contrato', icon: 'document' },
  { value: 'outro', label: 'Outro', icon: 'document-text' },
]

const familyMembers = [
  { value: 'gabriela', label: 'Gabriela' },
  { value: 'louise', label: 'Louise' },
  { value: 'giovanna', label: 'Giovanna' },
  { value: 'sabrina', label: 'Sabrina' },
]

export default function UploadScreen() {
  const { user } = useSession()
  const [form, setForm] = useState<UploadForm>({
    title: '',
    description: '',
    documentType: '',
    familyMember: '',
    categories: [],
    tags: [],
  })
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0])
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o documento')
    }
  }

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar a câmera')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0])
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Erro', 'Selecione um documento para upload')
      return
    }

    if (!form.title || !form.documentType || !form.familyMember) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios')
      return
    }

    setIsLoading(true)
    setUploadProgress(0)

    try {
      // Upload file to storage
      const filePath = `documents/${user?.id}/${Date.now()}_${selectedFile.name}`
      const uploadResult = await storageService.uploadFile(
        'documents',
        filePath,
        selectedFile.uri,
        (progress) => setUploadProgress(progress)
      )

      if (!uploadResult) {
        throw new Error('Falha no upload do arquivo')
      }

      // Create document record
      const documentData = {
        title: form.title,
        description: form.description,
        document_type: form.documentType,
        family_member: form.familyMember,
        file_path: filePath,
        categories: form.categories,
        tags: form.tags,
        metadata: {
          originalName: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.mimeType,
        },
      }

      await documentService.createDocument(documentData)

      Alert.alert(
        'Sucesso',
        'Documento enviado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      )
    } catch (error) {
      console.error('Upload error:', error)
      Alert.alert('Erro', 'Não foi possível enviar o documento')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const updateForm = (field: keyof UploadForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const addCategory = (category: string) => {
    if (category && !form.categories.includes(category)) {
      updateForm('categories', [...form.categories, category])
    }
  }

  const removeCategory = (category: string) => {
    updateForm('categories', form.categories.filter(c => c !== category))
  }

  const addTag = (tag: string) => {
    if (tag && !form.tags.includes(tag)) {
      updateForm('tags', [...form.tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    updateForm('tags', form.tags.filter(t => t !== tag))
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Adicionar Documento</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* File Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documento</Text>
            {selectedFile ? (
              <View style={styles.selectedFile}>
                <Ionicons name="document" size={24} color="#00ade8" />
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  style={styles.removeFile}
                >
                  <Ionicons name="close" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fileOptions}>
                <TouchableOpacity style={styles.fileOption} onPress={pickDocument}>
                  <Ionicons name="folder" size={32} color="#00ade8" />
                  <Text style={styles.fileOptionText}>Escolher arquivo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fileOption} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color="#00ade8" />
                  <Text style={styles.fileOptionText}>Tirar foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(text) => updateForm('title', text)}
                placeholder="Digite o título do documento"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(text) => updateForm('description', text)}
                placeholder="Digite uma descrição (opcional)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Documento *</Text>
              <View style={styles.optionsGrid}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.optionButton,
                      form.documentType === type.value && styles.optionButtonActive,
                    ]}
                    onPress={() => updateForm('documentType', type.value)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={form.documentType === type.value ? '#fff' : '#666'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        form.documentType === type.value && styles.optionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Membro da Família *</Text>
              <View style={styles.optionsGrid}>
                {familyMembers.map((member) => (
                  <TouchableOpacity
                    key={member.value}
                    style={[
                      styles.optionButton,
                      form.familyMember === member.value && styles.optionButtonActive,
                    ]}
                    onPress={() => updateForm('familyMember', member.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        form.familyMember === member.value && styles.optionTextActive,
                      ]}
                    >
                      {member.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Categories and Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorização</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categorias</Text>
              <View style={styles.tagsContainer}>
                {form.categories.map((category, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{category}</Text>
                    <TouchableOpacity onPress={() => removeCategory(category)}>
                      <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Adicionar categoria"
                onSubmitEditing={(e) => {
                  addCategory(e.nativeEvent.text)
                  e.currentTarget.clear()
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsContainer}>
                {form.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Adicionar tag"
                onSubmitEditing={(e) => {
                  addTag(e.nativeEvent.text)
                  e.currentTarget.clear()
                }}
              />
            </View>
          </View>

          {/* Upload Progress */}
          {isLoading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Enviando documento...</Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressPercent}>{uploadProgress}%</Text>
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            style={[styles.uploadButton, isLoading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isLoading}
          >
            <Text style={styles.uploadButtonText}>
              {isLoading ? 'Enviando...' : 'Enviar Documento'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Montserrat-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  fileOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fileOption: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
  },
  fileOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ade8',
  },
  fileName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Montserrat-Regular',
  },
  removeFile: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Montserrat-Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    fontFamily: 'Montserrat-Regular',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonActive: {
    backgroundColor: '#00ade8',
    borderColor: '#00ade8',
  },
  optionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'Montserrat-Medium',
  },
  optionTextActive: {
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#00ade8',
    marginRight: 4,
    fontFamily: 'Montserrat-Medium',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Montserrat-Regular',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ade8',
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  uploadButton: {
    backgroundColor: '#00ade8',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
})
