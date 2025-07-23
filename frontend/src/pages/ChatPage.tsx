import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  contextUsed?: boolean;
}

interface GenerateDocumentData {
  memberId: number;
  documentType: string;
  additionalInfo: string;
  title: string;
}

const ChatPage: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: 'Olá! Eu sou sua assistente de IA para documentos familiares. Posso ajudar você a consultar informações sobre documentos ou gerar novos documentos. Como posso ajudar?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateDocumentData, setGenerateDocumentData] = useState<GenerateDocumentData>({
    memberId: 0,
    documentType: 'declaration',
    additionalInfo: '',
    title: '',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - em produção viria da API
  const familyMembers = [
    { id: 1, name: 'João Silva', role: 'Pai' },
    { id: 2, name: 'Maria Silva', role: 'Mãe' },
    { id: 3, name: 'Louise Silva', role: 'Filha' },
    { id: 4, name: 'Pedro Silva', role: 'Filho' },
  ];

  const documentTypes = [
    { value: 'authorization', label: 'Autorização de Viagem' },
    { value: 'declaration', label: 'Declaração' },
    { value: 'certificate', label: 'Certificado/Atestado' },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Mock response - em produção seria uma chamada real à API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay
      
      let response = '';
      let contextUsed = false;

      if (inputMessage.toLowerCase().includes('passaporte') && inputMessage.toLowerCase().includes('louise')) {
        response = 'O passaporte da Louise Silva (Passaporte Brasileiro nº BR123456) vence em 15 de março de 2024. Recomendo renovar com antecedência!';
        contextUsed = true;
      } else if (inputMessage.toLowerCase().includes('documento') && inputMessage.toLowerCase().includes('venc')) {
        response = 'Há 2 documentos vencendo em breve: o Passaporte da Louise Silva (15/03/2024) e a Carteira de Motorista do João Silva (22/04/2024).';
        contextUsed = true;
      } else if (inputMessage.toLowerCase().includes('gerar') || inputMessage.toLowerCase().includes('criar')) {
        response = 'Posso ajudar você a gerar documentos! Use o botão "Gerar Documento" para criar autorizações, declarações ou certificados baseados nos dados dos membros da família.';
      } else {
        response = 'Entendi sua pergunta. Posso ajudar com consultas sobre documentos da família, verificar vencimentos, ou gerar novos documentos. Tente perguntas como "quando vence o passaporte da Louise?" ou "quais documentos estão vencendo?".';
      }

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        timestamp: new Date(),
        contextUsed,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!generateDocumentData.memberId || !generateDocumentData.title.trim()) return;

    setIsLoading(true);
    
    try {
      // Mock API call - em produção seria uma chamada real
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simular delay da IA
      
      const member = familyMembers.find(m => m.id === generateDocumentData.memberId);
      const docType = documentTypes.find(d => d.value === generateDocumentData.documentType);
      
      const successMessage: ChatMessage = {
        id: Date.now(),
        text: `✅ Documento "${generateDocumentData.title}" gerado com sucesso para ${member?.name}! O ${docType?.label} foi criado usando IA e enviado para o Paperless NG. Você pode acessá-lo através do link: http://localhost:8001/documents/123/`,
        isUser: false,
        timestamp: new Date(),
        contextUsed: true,
      };

      setMessages(prev => [...prev, successMessage]);
      setGenerateDialogOpen(false);
      
      // Reset form
      setGenerateDocumentData({
        memberId: 0,
        documentType: 'declaration',
        additionalInfo: '',
        title: '',
      });
      
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      const errorMessage: ChatMessage = {
        id: Date.now(),
        text: 'Erro ao gerar documento. Tente novamente.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Chat com IA
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setGenerateDialogOpen(true)}
          disabled={isLoading}
        >
          Gerar Documento
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        💡 <strong>Dicas:</strong> Pergunte sobre vencimentos ("quando vence o passaporte da Louise?"), 
        consulte documentos por membro, ou use o botão "Gerar Documento" para criar novos documentos via IA.
      </Alert>

      {/* Área de mensagens */}
      <Paper 
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          mb: 2, 
          overflow: 'auto',
          maxHeight: 'calc(100vh - 400px)'
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.isUser ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Card
              sx={{
                maxWidth: '70%',
                bgcolor: message.isUser ? 'primary.main' : 'grey.100',
                color: message.isUser ? 'white' : 'inherit',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {message.isUser ? (
                    <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
                  ) : (
                    <AIIcon sx={{ mr: 1, fontSize: 18 }} />
                  )}
                  <Typography variant="caption">
                    {message.isUser ? user?.firstName || 'Você' : 'IA Assistant'}
                  </Typography>
                  {message.contextUsed && (
                    <Chip 
                      label="Com contexto" 
                      size="small" 
                      sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                      color="success"
                    />
                  )}
                </Box>
                <Typography variant="body2">
                  {message.text}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                  {message.timestamp.toLocaleTimeString('pt-BR')}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Card sx={{ bgcolor: 'grey.100' }}>
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2">IA está pensando...</Typography>
              </CardContent>
            </Card>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Paper>

      {/* Área de input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Contexto</InputLabel>
          <Select
            value={selectedMember || ''}
            label="Contexto"
            onChange={(e) => setSelectedMember(e.target.value as number || null)}
          >
            <MenuItem value="">Geral</MenuItem>
            {familyMembers.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                {member.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua pergunta sobre documentos..."
          disabled={isLoading}
          variant="outlined"
          size="small"
        />
        
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          size="large"
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Dialog para gerar documento */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DocumentIcon sx={{ mr: 1 }} />
            Gerar Documento via IA
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Membro da Família</InputLabel>
              <Select
                value={generateDocumentData.memberId}
                label="Membro da Família"
                onChange={(e) => setGenerateDocumentData(prev => ({ ...prev, memberId: e.target.value as number }))}
              >
                {familyMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={generateDocumentData.documentType}
                label="Tipo de Documento"
                onChange={(e) => setGenerateDocumentData(prev => ({ ...prev, documentType: e.target.value }))}
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Título do Documento"
              value={generateDocumentData.title}
              onChange={(e) => setGenerateDocumentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Autorização de Viagem para Europa"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Informações Adicionais"
              value={generateDocumentData.additionalInfo}
              onChange={(e) => setGenerateDocumentData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              placeholder="Descreva detalhes específicos para o documento..."
            />

            <Alert severity="info">
              A IA gerará o documento baseado nos dados do membro selecionado e nas informações fornecidas. 
              O documento será automaticamente enviado para o Paperless NG.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerateDocument}
            variant="contained"
            disabled={!generateDocumentData.memberId || !generateDocumentData.title.trim() || isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <DocumentIcon />}
          >
            {isLoading ? 'Gerando...' : 'Gerar Documento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatPage;