# 🚀 Guia de Deploy em Produção - GabiFamilyDocs

Este guia fornece instruções completas para fazer o deploy do GabiFamilyDocs em um ambiente de produção.

## 📋 Pré-requisitos

### Servidor
- **Sistema Operacional**: Ubuntu 20.04+ ou CentOS 8+
- **RAM**: Mínimo 8GB (recomendado 16GB+)
- **CPU**: Mínimo 4 cores
- **Armazenamento**: Mínimo 100GB SSD
- **GPU**: Opcional (para aceleração de IA com Ollama)

### Software
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: Para clonar o repositório
- **OpenSSL**: Para gerar certificados

### Domínio
- **Domínio registrado** apontando para o servidor
- **Certificados SSL** (gerados automaticamente pelo Let's Encrypt)

## 🔧 Configuração Inicial

### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y docker.io docker-compose git openssl curl

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar
newgrp docker
```

### 2. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/gabifamilydocs.git
cd gabifamilydocs
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.production.example .env.production

# Editar configurações
nano .env.production
```

**Configurações obrigatórias:**

```bash
# Seu domínio real
DOMAIN_NAME=meu-dominio.com
ACME_EMAIL=admin@meu-dominio.com

# Senhas seguras (serão geradas automaticamente)
POSTGRES_PASSWORD=sua-senha-postgres
KEYCLOAK_ADMIN_PASSWORD=sua-senha-keycloak
PAPERLESS_ADMIN_PASSWORD=sua-senha-paperless
REDIS_PASSWORD=sua-senha-redis
BACKEND_SECRET_KEY=sua-chave-backend
PAPERLESS_SECRET_KEY=sua-chave-paperless
```

### 4. Gerar Senhas Seguras

```bash
# Tornar script executável
chmod +x deploy.sh

# Gerar senhas automaticamente
./deploy.sh secrets
```

## 🚀 Deploy

### 1. Deploy Inicial

```bash
# Iniciar todos os serviços
./deploy.sh start
```

### 2. Verificar Status

```bash
# Verificar se todos os serviços estão rodando
./deploy.sh status

# Ver logs em tempo real
./deploy.sh logs
```

### 3. Configurar Keycloak

Após o primeiro deploy, acesse o Keycloak:

1. **URL**: `https://seu-dominio.com/auth`
2. **Usuário**: `admin`
3. **Senha**: Configurada no `.env.production`

**Configurações necessárias:**

```bash
# Criar realm
Realm Name: gabifamilydocs

# Criar client
Client ID: gabifamilydocs-client
Client Protocol: openid-connect
Access Type: public
Valid Redirect URIs: https://seu-dominio.com/*
Web Origins: https://seu-dominio.com

# Criar roles
family_member
family_admin
platform_admin

# Criar usuário admin
Username: admin
Email: admin@seu-dominio.com
Roles: platform_admin
```

## 🔒 Segurança

### Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Backup Automático

```bash
# Criar script de backup automático
sudo crontab -e

# Adicionar linha para backup diário às 2h
0 2 * * * /caminho/para/gabifamilydocs/deploy.sh backup
```

### Monitoramento

```bash
# Verificar status dos serviços
./deploy.sh monitor

# Ver logs de erro
./deploy.sh logs | grep -i error
```

## 📊 Monitoramento e Manutenção

### Comandos Úteis

```bash
# Status dos serviços
./deploy.sh status

# Logs de um serviço específico
./deploy.sh logs backend
./deploy.sh logs frontend
./deploy.sh logs keycloak

# Backup manual
./deploy.sh backup

# Restaurar backup
./deploy.sh restore backups/backup_20240101_120000.sql

# Atualizar aplicação
./deploy.sh update

# Limpar recursos não utilizados
./deploy.sh cleanup
```

### Logs Importantes

```bash
# Logs do Traefik (reverse proxy)
docker-compose -f docker-compose.prod.yml logs traefik

# Logs do banco de dados
docker-compose -f docker-compose.prod.yml logs postgres

# Logs da aplicação
docker-compose -f docker-compose.prod.yml logs backend
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Certificados SSL não gerados

```bash
# Verificar logs do Traefik
./deploy.sh logs traefik

# Verificar se o domínio está correto
cat .env.production | grep DOMAIN_NAME
```

#### 2. Serviços não iniciam

```bash
# Verificar logs de todos os serviços
./deploy.sh logs

# Verificar se as portas estão livres
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

#### 3. Problemas de conectividade

```bash
# Verificar se os containers estão na mesma rede
docker network ls
docker network inspect gabifamilydocs_gabifamily_network
```

#### 4. Problemas de performance

```bash
# Verificar uso de recursos
./deploy.sh monitor

# Verificar logs de erro
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

### Recuperação de Desastres

#### Backup Completo

```bash
# Backup do banco
./deploy.sh backup

# Backup dos volumes
docker run --rm -v gabifamilydocs_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

#### Restauração

```bash
# Parar serviços
./deploy.sh stop

# Restaurar volumes (se necessário)
docker run --rm -v gabifamilydocs_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup_YYYYMMDD_HHMMSS.tar.gz -C /data

# Restaurar banco
./deploy.sh restore backups/backup_YYYYMMDD_HHMMSS.sql

# Iniciar serviços
./deploy.sh start
```

## 📈 Escalabilidade

### Para Alta Demanda

1. **Aumentar recursos do servidor**
2. **Configurar load balancer**
3. **Usar banco de dados externo (RDS)**
4. **Configurar CDN para assets estáticos**

### Monitoramento Avançado

```bash
# Instalar Prometheus + Grafana
# Configurar alertas
# Monitorar métricas de performance
```

## 🔄 Atualizações

### Atualização de Código

```bash
# Fazer backup
./deploy.sh backup

# Pull das mudanças
git pull origin main

# Atualizar aplicação
./deploy.sh update
```

### Atualização de Dependências

```bash
# Rebuild das imagens
docker-compose -f docker-compose.prod.yml build --no-cache

# Reiniciar serviços
./deploy.sh restart
```

## 📞 Suporte

### Logs para Debug

```bash
# Logs completos
./deploy.sh logs > debug.log

# Status dos serviços
./deploy.sh status > status.log

# Informações do sistema
docker system df > system.log
```

### Contatos

- **Issues**: GitHub Issues
- **Documentação**: Este arquivo
- **Comunidade**: Discord/Slack

---

**⚠️ Importante**: Sempre faça backup antes de qualquer operação crítica! 