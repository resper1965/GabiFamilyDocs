import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSession } from '../../../src/contexts/SessionContext'
import { ollamaService } from '../../../src/services/ollama'
import { documentService } from '../../../src/services/documents'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: any
}

export default function ChatScreen() {
  const { user } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: 'Olá! Sou o assistente AI do Gabi Family Docs. Posso ajudar você a:\n\n• Encontrar documentos específicos\n• Gerar novos documentos\n• Responder perguntas sobre sua família\n• Gerenciar lembretes e alertas\n\nComo posso ajudar você hoje?',
        timestamp: new Date(),
      },
    ])
  }, [])

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Get family context
      const familyId = 'temp-family-id' // TODO: Get real family ID
      const documents = await documentService.getFamilyDocuments(familyId)
      
      // Prepare context for AI
      const context = {
        familyDocuments: documents,
        user: user?.email,
        timestamp: new Date().toISOString(),
      }

      // Send to Ollama
      const response = await ollamaService.chatWithFamilyData(inputText.trim(), context)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        context,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.type === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.type === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.type === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          item.type === 'user' ? styles.userTime : styles.assistantTime
        ]}>
          {item.timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  )

  const QuickAction = ({ title, icon, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#00ade8" />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  )

  const handleQuickAction = (action: string) => {
    const quickMessages = {
      'find_document': 'Encontre o RG da Sabrina',
      'generate_document': 'Gere uma procuração da Giovanna para a Louise',
      'family_info': 'Quais são os números de telefone da família?',
      'reminders': 'Mostre os lembretes para esta semana',
    }

    setInputText(quickMessages[action as keyof typeof quickMessages] || '')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.aiAvatar}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Assistente AI</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? 'Digitando...' : 'Online'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {messages.length === 1 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Ações Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Encontrar Documento"
              icon="search"
              onPress={() => handleQuickAction('find_document')}
            />
            <QuickAction
              title="Gerar Documento"
              icon="add-circle"
              onPress={() => handleQuickAction('generate_document')}
            />
            <QuickAction
              title="Info da Família"
              icon="people"
              onPress={() => handleQuickAction('family_info')}
            />
            <QuickAction
              title="Lembretes"
              icon="notifications"
              onPress={() => handleQuickAction('reminders')}
            />
          </View>
        </View>
      )}

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color="#00ade8" />
          <Text style={styles.typingText}>Assistente está digitando...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite sua mensagem..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00ade8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Montserrat-SemiBold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  menuButton: {
    padding: 8,
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#00ade8',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Montserrat-Regular',
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  assistantTime: {
    color: '#999',
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  quickActionText: {
    fontSize: 12,
    color: '#00ade8',
    marginLeft: 6,
    fontFamily: 'Montserrat-Medium',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Montserrat-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#fafafa',
    fontFamily: 'Montserrat-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00ade8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
})
