import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DocumentIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  // Mock data - em produção, estes dados viriam da API
  const stats = {
    totalMembers: 4,
    totalDocuments: 12,
    expiringDocuments: 2,
    aiRequestsThisMonth: 8,
  };

  const expiringDocuments = [
    {
      id: 1,
      title: 'Passaporte - Louise Silva',
      expirationDate: '2024-03-15',
      type: 'passport',
      memberName: 'Louise Silva'
    },
    {
      id: 2,
      title: 'Carteira de Motorista - João Silva',
      expirationDate: '2024-04-22',
      type: 'driver_license',
      memberName: 'João Silva'
    },
  ];

  const recentActivity = [
    'Documento "Passaporte - Louise Silva" foi adicionado',
    'Consulta via IA: "quando vence o passaporte da Louise?"',
    'Novo membro "Maria Silva" foi cadastrado',
    'Documento gerado via IA: "Autorização de Viagem"',
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bem-vindo, {user?.firstName || user?.username}!
      </Typography>

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Membros
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {stats.totalMembers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de membros da família
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DocumentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Documentos
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {stats.totalDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de documentos cadastrados
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Vencimentos
                </Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {stats.expiringDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documentos vencendo em breve
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  IA este mês
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {stats.aiRequestsThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consultas e gerações via IA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Documentos vencendo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Documentos Vencendo
            </Typography>
            
            {expiringDocuments.length > 0 ? (
              <List>
                {expiringDocuments.map((doc) => (
                  <ListItem key={doc.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={doc.title}
                      secondary={`Vence em: ${new Date(doc.expirationDate).toLocaleDateString('pt-BR')}`}
                    />
                    <Chip
                      label={doc.type === 'passport' ? 'Passaporte' : 'CNH'}
                      color="warning"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success">
                Nenhum documento vencendo nos próximos 30 dias!
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Atividade recente */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Atividade Recente
            </Typography>
            
            <List>
              {recentActivity.map((activity, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={activity}
                    secondary={`${index + 1} ${index === 0 ? 'hora' : 'horas'} atrás`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Alertas baseados em roles */}
      <Box sx={{ mt: 3 }}>
        {hasRole('family_admin') && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Admin da Família:</strong> Você pode gerenciar membros, documentos e convites para sua família.
          </Alert>
        )}
        
        {hasRole('platform_admin') && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Admin da Plataforma:</strong> Você tem acesso administrativo completo ao sistema.
          </Alert>
        )}
        
        {!hasRole('family_admin') && !hasRole('platform_admin') && (
          <Alert severity="info">
            <strong>Membro da Família:</strong> Você pode visualizar e gerenciar seus próprios documentos, além de usar o chat com IA.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;