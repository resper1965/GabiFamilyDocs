# 🚀 Deploy no EasyPanel - GabiFamilyDocs

Este guia fornece instruções específicas para fazer o deploy do GabiFamilyDocs usando o **EasyPanel**, aproveitando todos os recursos nativos da plataforma.

## 🎯 **Por que EasyPanel?**

O EasyPanel oferece recursos perfeitos para o GabiFamilyDocs:

- ✅ **SSL automático** com Let's Encrypt
- ✅ **Banco PostgreSQL** gerenciado
- ✅ **Redis** para cache
- ✅ **Deploy automático** via Git
- ✅ **Terminal integrado** para debug
- ✅ **Logs centralizados**
- ✅ **Backups automáticos**
- ✅ **Zero-downtime** deployments

## 📋 **Pré-requisitos**

### EasyPanel
- **EasyPanel instalado** e configurado
- **Domínio** apontando para o servidor
- **Repositório Git** com o código

### Recursos do Servidor
- **RAM**: Mínimo 4GB (recomendado 8GB+)
- **CPU**: Mínimo 2 cores
- **Armazenamento**: Mínimo 50GB
- **GPU**: Opcional (para Ollama)

## 🔧 **Configuração no EasyPanel**

### 1. **Criar Projeto**

1. Acesse o EasyPanel
2. Clique em **"New Project"**
3. Escolha **"Git Repository"**
4. Configure:
   - **Repository**: `https://github.com/seu-usuario/gabifamilydocs.git`
   - **Branch**: `main`
   - **Build Command**: (deixar vazio - usa Dockerfile)
   - **Start Command**: (deixar vazio - usa Dockerfile)

### 2. **Configurar Banco de Dados**

1. No projeto, vá em **"Services"**
2. Clique em **"Add Service"**
3. Escolha **"PostgreSQL"**
4. Configure:
   - **Name**: `gabifamilydocs-db`
   - **Version**: `15`
   - **Database**: `gabifamilydocs`
   - **Username**: `postgres`
   - **Password**: (gerar senha segura)

### 3. **Configurar Redis**

1. **"Add Service"** → **"Redis"**
2. Configure:
   - **Name**: `gabifamilydocs-redis`
   - **Version**: `7`
   - **Password**: (gerar senha segura)

### 4. **Configurar Variáveis de Ambiente**

No projeto, vá em **"Environment Variables"** e adicione:

```bash
# Configurações do Backend
DATABASE_URL=postgresql://postgres:SENHA_DO_BANCO@SERVICE_NAME:5432/gabifamilydocs
REDIS_URL=redis://:SENHA_REDIS@SERVICE_NAME:6379
SECRET_KEY=sua-chave-secreta-super-longa-e-aleatoria
ENVIRONMENT=production
LOG_LEVEL=INFO

# Configurações do Keycloak
KEYCLOAK_URL=https://seu-dominio.com/auth
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=sua-senha-keycloak

# Configurações do Paperless NG
PAPERLESS_URL=https://seu-dominio.com/paperless
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=sua-senha-paperless
PAPERLESS_SECRET_KEY=sua-chave-paperless

# Configurações do Frontend
REACT_APP_API_URL=https://seu-dominio.com/api
REACT_APP_KEYCLOAK_URL=https://seu-dominio.com/auth

# Configurações do Ollama
OLLAMA_URL=http://ollama:11434

# Configurações do Domínio
DOMAIN_NAME=seu-dominio.com
```

### 5. **Configurar SSL**

1. Vá em **"Settings"** → **"Domain"**
2. Adicione seu domínio
3. Ative **"SSL Certificate"**
4. Escolha **"Let's Encrypt"**

### 6. **Configurar Portas**

No projeto, configure as portas:

- **Port 3000**: Aplicação principal
- **Port 8080**: Keycloak (se necessário)
- **Port 8001**: Paperless NG (se necessário)
- **Port 11434**: Ollama (se necessário)

## 🚀 **Deploy**

### 1. **Primeiro Deploy**

1. Clique em **"Deploy"**
2. O EasyPanel irá:
   - Fazer pull do código
   - Build da imagem Docker
   - Iniciar os serviços
   - Configurar SSL

### 2. **Verificar Deploy**

1. **Logs**: Vá em **"Logs"** para ver o progresso
2. **Terminal**: Use **"Terminal"** para debug se necessário
3. **Health Check**: Verifique se a aplicação está respondendo

### 3. **Configurar Keycloak**

Após o deploy, configure o Keycloak:

1. Acesse: `https://seu-dominio.com/auth`
2. Login: `admin` / `sua-senha-keycloak`
3. Criar realm: `gabifamilydocs`
4. Criar client: `gabifamilydocs-client`
5. Configurar roles e usuários

## 🔧 **Configurações Avançadas**

### **Dockerfile Personalizado**

O EasyPanel usará o `Dockerfile.easypanel` que:

- ✅ Combina frontend e backend
- ✅ Usa nginx como reverse proxy
- ✅ Otimizado para produção
- ✅ Health checks integrados

### **Serviços Adicionais**

#### **Keycloak (Opcional)**
Se quiser Keycloak separado:

1. **"Add Service"** → **"Custom"**
2. **Image**: `quay.io/keycloak/keycloak:latest`
3. **Port**: `8080`
4. **Environment**: (configurar variáveis do Keycloak)

#### **Paperless NG (Opcional)**
Para GED completo:

1. **"Add Service"** → **"Custom"**
2. **Image**: `ghcr.io/paperless-ngx/paperless-ngx:latest`
3. **Port**: `8001`
4. **Volumes**: (configurar volumes para documentos)

#### **Ollama (Opcional)**
Para IA local:

1. **"Add Service"** → **"Custom"**
2. **Image**: `ollama/ollama:latest`
3. **Port**: `11434`
4. **GPU**: (se disponível)

## 📊 **Monitoramento**

### **Logs no EasyPanel**

- **Application Logs**: Logs da aplicação principal
- **Service Logs**: Logs dos serviços (DB, Redis, etc.)
- **Build Logs**: Logs do processo de build

### **Métricas**

- **CPU Usage**: Monitoramento de CPU
- **Memory Usage**: Uso de memória
- **Disk Usage**: Uso de disco
- **Network**: Tráfego de rede

### **Health Checks**

O EasyPanel monitora automaticamente:
- ✅ Disponibilidade da aplicação
- ✅ Resposta do health check
- ✅ Status dos serviços

## 🔄 **Atualizações**

### **Deploy Automático**

1. **Push para Git**: Faça push para o repositório
2. **Deploy Automático**: EasyPanel detecta mudanças
3. **Zero Downtime**: Deploy sem interrupção

### **Deploy Manual**

1. Vá em **"Deploy"**
2. Clique em **"Redeploy"**
3. Aguarde o processo

### **Rollback**

1. Vá em **"Deployments"**
2. Escolha versão anterior
3. Clique em **"Rollback"**

## 🔒 **Segurança**

### **SSL Automático**

- ✅ Certificados Let's Encrypt
- ✅ Renovação automática
- ✅ HTTPS forçado

### **Firewall**

- ✅ Portas configuradas automaticamente
- ✅ Acesso restrito aos serviços

### **Backups**

- ✅ Backup automático do banco
- ✅ Configuração de retenção
- ✅ Restauração fácil

## 🛠️ **Troubleshooting**

### **Problemas Comuns**

#### **1. Build Falha**
```bash
# Verificar logs de build
# Verificar Dockerfile
# Verificar dependências
```

#### **2. Aplicação Não Inicia**
```bash
# Verificar logs da aplicação
# Verificar variáveis de ambiente
# Verificar conectividade com serviços
```

#### **3. SSL Não Funciona**
```bash
# Verificar configuração do domínio
# Verificar DNS
# Aguardar propagação do Let's Encrypt
```

### **Debug via Terminal**

1. Vá em **"Terminal"**
2. Execute comandos de debug:
```bash
# Verificar processos
ps aux

# Verificar logs
tail -f /var/log/nginx/error.log

# Verificar conectividade
curl -f http://localhost:8000/health
```

## 📈 **Escalabilidade**

### **Recursos do EasyPanel**

- ✅ **Auto-scaling**: Baseado em demanda
- ✅ **Load Balancing**: Distribuição de carga
- ✅ **Resource Limits**: Controle de recursos
- ✅ **Monitoring**: Métricas em tempo real

### **Para Alta Demanda**

1. **Aumentar recursos** do servidor
2. **Configurar auto-scaling**
3. **Usar CDN** para assets estáticos
4. **Otimizar banco de dados**

## 📞 **Suporte**

### **Recursos do EasyPanel**

- **Documentação**: [easypanel.io/docs](https://easypanel.io/docs)
- **Comunidade**: Discord/Slack
- **Issues**: GitHub

### **Logs para Debug**

```bash
# Exportar logs
# Baixar logs da aplicação
# Compartilhar logs com suporte
```

---

**🎉 Parabéns!** Seu GabiFamilyDocs está rodando no EasyPanel com todas as melhores práticas de produção! 