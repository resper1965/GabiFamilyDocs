import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card elevation={3} sx={{ width: '100%', mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                component="h1"
                variant="h3"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                GabiFamilyDocs
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Sistema de Gestão de Documentos Familiares
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="body1" paragraph>
                Organize os documentos da sua família de forma inteligente, com suporte a IA para consultas e geração de documentos.
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                • Gestão completa de documentos por membro da família
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Alertas de vencimento automáticos
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Chat com IA para consultas inteligentes
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Geração automática de documentos
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={login}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Entrar com Keycloak
            </Button>

            <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
              Faça login usando suas credenciais do Keycloak
            </Typography>
          </CardContent>
        </Card>

        <Paper elevation={1} sx={{ mt: 4, p: 3, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Funcionalidades Principais
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="primary">
                📄 Gestão de Documentos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Organize documentos por membro da família, com campos para tipo, número, país emissor, validade e muito mais.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="primary">
                👤 Cadastro de Membros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mantenha dados completos de cada membro: nome, nascimento, endereço, nacionalidade e email.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="primary">
                💬 Chat com IA
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Faça consultas naturais como "quando vence o passaporte da Louise?" usando IA local via Ollama.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="primary">
                🔐 Segurança e RBAC
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Autenticação via Keycloak com controle de acesso baseado em papéis (Admin da Plataforma, Admin da Família, Membro).
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
