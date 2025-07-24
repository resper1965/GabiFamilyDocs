# 🚀 Deploy na VPS - GabiFamilyDocs

Guia completo para fazer o deploy do GabiFamilyDocs na VPS onde já estão rodando Keycloak, Paperless e Ollama.

## 📋 **Pré-requisitos**

### **Serviços Já Rodando na VPS:**
- ✅ **Keycloak** - Autenticação
- ✅ **Paperless NG** - GED
- ✅ **Ollama** - IA Local
- ✅ **PostgreSQL** - Banco de dados
- ✅ **Redis** - Cache

### **Recursos da VPS:**
- **Sistema**: Ubuntu/CentOS
- **Docker**: Instalado
- **Docker Compose**: Instalado
- **Domínio**: Configurado e apontando para a VPS

## 🔧 **Preparação da VPS**

### **1. Conectar na VPS**
```bash
ssh usuario@seu-servidor.com
```

### **2. Criar Diretório do Projeto**
```bash
# Criar diretório
mkdir -p /opt/gabifamilydocs
cd /opt/gabifamilydocs

# Clonar repositório
git clone https://github.com/seu-usuario/gabifamilydocs.git .
```

### **3. Verificar Serviços Existentes**
```bash
# Verificar se os serviços estão rodando
docker ps

# Verificar redes Docker
docker network ls

# Verificar volumes
docker volume ls
```

## 📝 **Configuração das Variáveis de Ambiente**

### **1. Criar Arquivo .env**
```bash
# Criar arquivo de ambiente
nano .env
```

### **2. Configurar Variáveis**
```bash
# =============================================================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# =============================================================================
# Use as credenciais dos serviços já existentes
DATABASE_URL=postgresql://postgres:SENHA_POSTGRES@localhost:5432/gabifamilydocs
REDIS_URL=redis://:SENHA_REDIS@localhost:6379

# =============================================================================
# CONFIGURAÇÕES DO BACKEND
# =============================================================================
SECRET_KEY=sua-chave-secreta-super-longa-e-aleatoria-64-caracteres
ENVIRONMENT=production
LOG_LEVEL=INFO

# =============================================================================
# CONFIGURAÇÕES DO KEYCLOAK (JÁ RODANDO)
# =============================================================================
# Use a URL do Keycloak já configurado
KEYCLOAK_URL=https://gabi.esper.ws/auth
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=sua-senha-keycloak

# =============================================================================
# CONFIGURAÇÕES DO PAPERLESS NG (JÁ RODANDO)
# =============================================================================
# Use a URL do Paperless já configurado
PAPERLESS_URL=https://gabi.esper.ws/paperless
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=sua-senha-paperless
PAPERLESS_SECRET_KEY=sua-chave-paperless-super-longa-e-aleatoria

# =============================================================================
# CONFIGURAÇÕES DO FRONTEND
# =============================================================================
REACT_APP_API_URL=https://gabi.esper.ws/api
REACT_APP_KEYCLOAK_URL=https://gabi.esper.ws/auth

# =============================================================================
# CONFIGURAÇÕES DO OLLAMA (JÁ RODANDO)
# =============================================================================
# Use a URL do Ollama já configurado
OLLAMA_URL=http://localhost:11434

# =============================================================================
# CONFIGURAÇÕES DO DOMÍNIO
# =============================================================================
DOMAIN_NAME=gabi.esper.ws

# =============================================================================
# CONFIGURAÇÕES AVANÇADAS
# =============================================================================
DATABASE_TIMEOUT=30
CACHE_TTL=3600
MAX_FILE_SIZE=10485760
SESSION_TIMEOUT=3600
LOG_FORMAT=json
CORS_ORIGINS=https://gabi.esper.ws,https://www.gabi.esper.ws
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
```

## 🐳 **Configuração do Docker Compose**

### **1. Criar docker-compose.yml**
```bash
nano docker-compose.yml
```

### **2. Configuração Completa**
```yaml
version: '3.8'

services:
  # Aplicação Principal (Frontend + Backend)
  gabifamilydocs:
    build:
      context: .
      dockerfile: Dockerfile.easypanel
    container_name: gabifamilydocs
    environment:
      # Configurações do Backend
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      SECRET_KEY: ${SECRET_KEY}
      ENVIRONMENT: ${ENVIRONMENT}
      LOG_LEVEL: ${LOG_LEVEL}
      
      # Configurações do Keycloak
      KEYCLOAK_URL: ${KEYCLOAK_URL}
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
      
      # Configurações do Paperless NG
      PAPERLESS_URL: ${PAPERLESS_URL}
      PAPERLESS_ADMIN_USER: ${PAPERLESS_ADMIN_USER}
      PAPERLESS_ADMIN_PASSWORD: ${PAPERLESS_ADMIN_PASSWORD}
      PAPERLESS_SECRET_KEY: ${PAPERLESS_SECRET_KEY}
      
      # Configurações do Frontend
      REACT_APP_API_URL: ${REACT_APP_API_URL}
      REACT_APP_KEYCLOAK_URL: ${REACT_APP_KEYCLOAK_URL}
      
      # Configurações do Ollama
      OLLAMA_URL: ${OLLAMA_URL}
      
      # Configurações do Domínio
      DOMAIN_NAME: ${DOMAIN_NAME}
      
      # Configurações Avançadas
      DATABASE_TIMEOUT: ${DATABASE_TIMEOUT}
      CACHE_TTL: ${CACHE_TTL}
      MAX_FILE_SIZE: ${MAX_FILE_SIZE}
      SESSION_TIMEOUT: ${SESSION_TIMEOUT}
      LOG_FORMAT: ${LOG_FORMAT}
      CORS_ORIGINS: ${CORS_ORIGINS}
      RATE_LIMIT_REQUESTS: ${RATE_LIMIT_REQUESTS}
      RATE_LIMIT_WINDOW: ${RATE_LIMIT_WINDOW}
      HEALTH_CHECK_ENDPOINT: ${HEALTH_CHECK_ENDPOINT}
      METRICS_ENDPOINT: ${METRICS_ENDPOINT}
    ports:
      - "3000:3000"
    volumes:
      - app_data:/app/data
      - app_logs:/app/logs
    networks:
      - gabifamily_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx como Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: gabifamilydocs_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - app_logs:/var/log/nginx
    depends_on:
      - gabifamilydocs
    networks:
      - gabifamily_network
    restart: unless-stopped

volumes:
  app_data:
  app_logs:

networks:
  gabifamily_network:
    driver: bridge
```

## 🌐 **Configuração do Nginx**

### **1. Criar nginx.conf**
```bash
nano nginx.conf
```

### **2. Configuração do Nginx**
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Upstream para a aplicação
    upstream gabifamilydocs {
        server gabifamilydocs:3000;
    }

    # HTTP - Redirect para HTTPS
    server {
        listen 80;
        server_name gabi.esper.ws www.gabi.esper.ws;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS - Aplicação principal
    server {
        listen 443 ssl http2;
        server_name gabi.esper.ws www.gabi.esper.ws;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API routes - proxy para a aplicação
        location /api/ {
            proxy_pass http://gabifamilydocs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://gabifamilydocs;
            access_log off;
        }

        # Handle React Router - fallback para index.html
        location / {
            proxy_pass http://gabifamilydocs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 🔒 **Configuração SSL**

**✅ SSL é gerenciado automaticamente pelo EasyPanel**

O EasyPanel gera e renova automaticamente os certificados SSL para o domínio `gabi.esper.ws`.

## 🚀 **Deploy**

### **1. Build e Deploy**
```bash
# Fazer build da imagem
docker-compose build

# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### **2. Verificar Funcionamento**
```bash
# Health check
curl -f https://gabi.esper.ws/health

# Verificar se a aplicação está respondendo
curl -f https://gabi.esper.ws/api/health
```

## 🔧 **Configuração do Keycloak**

### **1. Acessar Keycloak**
- **URL**: `https://gabi.esper.ws/auth`
- **Usuário**: `admin`
- **Senha**: Configurada no `.env`

### **2. Configurar Realm**
1. **Criar Realm**: `gabifamilydocs`
2. **Configurar Client**:
   - **Client ID**: `gabifamilydocs-client`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `public`
   - **Valid Redirect URIs**: `https://gabi.esper.ws/*`
   - **Web Origins**: `https://gabi.esper.ws`

### **3. Configurar Roles**
- `family_member`
- `family_admin`
- `platform_admin`

### **4. Criar Usuário Admin**
- **Username**: `admin`
- **Email**: `admin@gabi.esper.ws`
- **Roles**: `platform_admin`

## 📊 **Monitoramento**

### **1. Logs**
```bash
# Logs da aplicação
docker-compose logs -f gabifamilydocs

# Logs do nginx
docker-compose logs -f nginx

# Logs de todos os serviços
docker-compose logs -f
```

### **2. Status dos Serviços**
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Espaço em disco
df -h
```

### **3. Backup**
```bash
# Backup do banco
docker exec -t gabifamilydocs_postgres pg_dump -U postgres gabifamilydocs > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup dos volumes
docker run --rm -v gabifamilydocs_app_data:/data -v $(pwd):/backup alpine tar czf /backup/app_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

## 🔄 **Atualizações**

### **1. Atualizar Código**
```bash
# Pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose build
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### **2. Rollback**
```bash
# Voltar para versão anterior
git checkout HEAD~1

# Rebuild e restart
docker-compose build
docker-compose up -d
```

## 🛠️ **Troubleshooting**

### **1. Problemas de Conectividade**
```bash
# Verificar se os serviços estão rodando
docker-compose ps

# Verificar logs
docker-compose logs gabifamilydocs

# Verificar conectividade com serviços externos
curl -f http://localhost:5432  # PostgreSQL
curl -f http://localhost:6379  # Redis
curl -f http://localhost:11434 # Ollama
```

### **2. Problemas de SSL**
```bash
# SSL é gerenciado pelo EasyPanel
# Verificar no painel do EasyPanel se o SSL está ativo

# Se houver problemas, verificar no EasyPanel:
# - Domínio configurado corretamente
# - SSL habilitado
# - Certificado válido
```

### **3. Problemas de Performance**
```bash
# Verificar uso de recursos
docker stats

# Verificar logs de erro
docker-compose logs nginx | grep error
```

## 📞 **Comandos Úteis**

### **Gerenciamento**
```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Reiniciar serviços
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f

# Executar comando no container
docker-compose exec gabifamilydocs bash
```

### **Manutenção**
```bash
# Limpar imagens não utilizadas
docker image prune -f

# Limpar volumes não utilizados
docker volume prune -f

# Limpar tudo
docker system prune -f
```

---

**🎉 Pronto! Seu GabiFamilyDocs está rodando na VPS integrado com os serviços existentes!**

**URL**: `https://gabi.esper.ws`
**Status**: ✅ Produção
**SSL**: ✅ Automático
**Integração**: ✅ Keycloak, Paperless, Ollama
**Monitoramento**: ✅ Ativo 