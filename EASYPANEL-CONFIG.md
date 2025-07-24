# 🎯 Configuração Campo a Campo - EasyPanel GabiFamilyDocs

Este guia detalha exatamente como configurar cada campo no EasyPanel para o deploy do GabiFamilyDocs.

## 📋 **Configuração do App Service**

### **1. Source (Fonte)**

#### **Tipo de Origem**: `GitHub Repository`

**Configurações:**
- **Repository URL**: `https://github.com/seu-usuario/gabifamilydocs.git`
- **Branch**: `main`
- **Build Strategy**: `Dockerfile` (detectado automaticamente)

**O que acontece:**
- ✅ EasyPanel detecta o `Dockerfile.easypanel`
- ✅ Build automático da imagem
- ✅ Pull automático de mudanças

---

### **2. Environment (Ambiente)**

#### **Environment Variables**

```bash
# =============================================================================
# CONFIGURAÇÕES DO BANCO DE DADOS (EasyPanel PostgreSQL Service)
# =============================================================================
DATABASE_URL=postgresql://postgres:$(POSTGRES_PASSWORD)@$(SERVICE_NAME)-db:5432/gabifamilydocs
REDIS_URL=redis://:$(REDIS_PASSWORD)@$(SERVICE_NAME)-redis:6379

# =============================================================================
# CONFIGURAÇÕES DO BACKEND
# =============================================================================
SECRET_KEY=sua-chave-secreta-super-longa-e-aleatoria-64-caracteres
ENVIRONMENT=production
LOG_LEVEL=INFO

# =============================================================================
# CONFIGURAÇÕES DO KEYCLOAK
# =============================================================================
KEYCLOAK_URL=https://$(PRIMARY_DOMAIN)/auth
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=sua-senha-keycloak-super-segura

# =============================================================================
# CONFIGURAÇÕES DO PAPERLESS NG
# =============================================================================
PAPERLESS_URL=https://$(PRIMARY_DOMAIN)/paperless
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=sua-senha-paperless-super-segura
PAPERLESS_SECRET_KEY=sua-chave-paperless-super-longa-e-aleatoria

# =============================================================================
# CONFIGURAÇÕES DO FRONTEND
# =============================================================================
REACT_APP_API_URL=https://$(PRIMARY_DOMAIN)/api
REACT_APP_KEYCLOAK_URL=https://$(PRIMARY_DOMAIN)/auth

# =============================================================================
# CONFIGURAÇÕES DO OLLAMA (IA Local)
# =============================================================================
OLLAMA_URL=http://$(SERVICE_NAME)-ollama:11434

# =============================================================================
# CONFIGURAÇÕES DO DOMÍNIO
# =============================================================================
DOMAIN_NAME=$(PRIMARY_DOMAIN)

# =============================================================================
# CONFIGURAÇÕES AVANÇADAS
# =============================================================================
DATABASE_TIMEOUT=30
CACHE_TTL=3600
MAX_FILE_SIZE=10485760
SESSION_TIMEOUT=3600
LOG_FORMAT=json
CORS_ORIGINS=https://$(PRIMARY_DOMAIN),https://www.$(PRIMARY_DOMAIN)
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
```

**Variáveis Mágicas Utilizadas:**
- `$(PROJECT_NAME)` → nome do projeto no EasyPanel
- `$(SERVICE_NAME)` → nome do serviço (ex: `gabifamilydocs`)
- `$(PRIMARY_DOMAIN)` → domínio principal configurado

---

### **3. Domains & Proxy (Domínios e Proxy)**

#### **Domains**
- **Primary Domain**: `⭐ seu-dominio.com` (marcar como principal)
- **Additional Domains**: 
  - `www.seu-dominio.com`
  - `app.seu-dominio.com` (opcional)

#### **Proxy Port**: `3000`
- ✅ SSL automático via Let's Encrypt
- ✅ Renovação transparente
- ✅ HTTPS forçado

---

### **4. Mounts (Montagens)**

#### **Volume Mounts**
```yaml
# Para persistência de dados
- name: app-data
  mountPath: /app/data

# Para logs
- name: app-logs
  mountPath: /app/logs
```

#### **File Mounts**
```yaml
# Configuração personalizada do nginx
- content: |
    # Configuração customizada do nginx
    # Pode ser sobrescrita aqui
  mountPath: /etc/nginx/conf.d/custom.conf
```

---

### **5. Ports (Portas)**

#### **Published Ports**
```yaml
# Porta principal da aplicação
- published: 3000
  target: 3000

# Porta para health checks
- published: 8080
  target: 8080
```

---

### **6. Deploy Settings (Configurações de Deploy)**

#### **Replicas**: `1` (ou `2` para alta disponibilidade)

#### **Command**: (deixar vazio - usa Dockerfile)

#### **Arguments**: (deixar vazio - usa Dockerfile)

---

### **7. Deploy Webhook**

#### **Webhook URL**: `https://easypanel.seu-servidor.com/api/webhooks/gabifamilydocs`
- ✅ Gerado automaticamente pelo EasyPanel
- ✅ Pode ser usado para deploy manual via curl/HTTP

---

### **8. Auto Deploy**

#### **Status**: `✅ ON`
- ✅ Injetado automaticamente no GitHub
- ✅ Deploy automático a cada push
- ✅ Zero-downtime deployments

---

## 🔧 **Configuração dos Serviços**

### **PostgreSQL Service**

#### **Source**: `Database Service`
- **Type**: `PostgreSQL`
- **Version**: `15`
- **Database**: `gabifamilydocs`
- **Username**: `postgres`
- **Password**: `sua-senha-postgres-super-segura`

#### **Environment Variables**:
```bash
POSTGRES_DB=gabifamilydocs
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua-senha-postgres-super-segura
```

#### **Mounts**:
```yaml
- name: postgres-data
  mountPath: /var/lib/postgresql/data
```

---

### **Redis Service**

#### **Source**: `Database Service`
- **Type**: `Redis`
- **Version**: `7`
- **Password**: `sua-senha-redis-super-segura`

#### **Environment Variables**:
```bash
REDIS_PASSWORD=sua-senha-redis-super-segura
```

#### **Mounts**:
```yaml
- name: redis-data
  mountPath: /data
```

---

### **Keycloak Service (Opcional)**

#### **Source**: `Docker Image`
- **Image**: `quay.io/keycloak/keycloak:latest`

#### **Environment Variables**:
```bash
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=sua-senha-keycloak-super-segura
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://$(SERVICE_NAME)-db:5432/keycloak
KC_DB_USERNAME=postgres
KC_DB_PASSWORD=$(POSTGRES_PASSWORD)
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
```

#### **Ports**:
```yaml
- published: 8080
  target: 8080
```

#### **Command**: `start`

---

### **Paperless NG Service (Opcional)**

#### **Source**: `Docker Image`
- **Image**: `ghcr.io/paperless-ngx/paperless-ngx:latest`

#### **Environment Variables**:
```bash
PAPERLESS_REDIS=redis://:$(REDIS_PASSWORD)@$(SERVICE_NAME)-redis:6379
PAPERLESS_DBHOST=$(SERVICE_NAME)-db
PAPERLESS_DBNAME=paperless
PAPERLESS_DBUSER=postgres
PAPERLESS_DBPASS=$(POSTGRES_PASSWORD)
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=sua-senha-paperless-super-segura
PAPERLESS_URL=https://$(PRIMARY_DOMAIN)/paperless
PAPERLESS_SECRET_KEY=sua-chave-paperless-super-longa-e-aleatoria
PAPERLESS_ALLOWED_HOSTS=$(PRIMARY_DOMAIN)
PAPERLESS_CSRF_TRUSTED_ORIGINS=https://$(PRIMARY_DOMAIN)
```

#### **Mounts**:
```yaml
- name: paperless-data
  mountPath: /usr/src/paperless/data
- name: paperless-media
  mountPath: /usr/src/paperless/media
- name: paperless-export
  mountPath: /usr/src/paperless/export
- name: paperless-consume
  mountPath: /usr/src/paperless/consume
```

#### **Ports**:
```yaml
- published: 8001
  target: 8000
```

---

### **Ollama Service (Opcional)**

#### **Source**: `Docker Image`
- **Image**: `ollama/ollama:latest`

#### **Mounts**:
```yaml
- name: ollama-data
  mountPath: /root/.ollama
```

#### **Ports**:
```yaml
- published: 11434
  target: 11434
```

#### **GPU Support**: (se disponível)
- **NVIDIA Runtime**: `enabled`

---

## 📊 **Monitoramento e Logs**

### **Logs**
- **Stream**: Unificado de stdout/stderr
- **Retention**: Configurável no EasyPanel
- **Export**: Disponível via interface

### **Console**
- **Launcher**: Terminal in-browser
- **Environment**: Pré-configurado com variáveis
- **Access**: Via interface web do EasyPanel

---

## 🔄 **Fluxo de Deploy**

### **1. Deploy Inicial**
1. **Configurar Source** → GitHub repository
2. **Configurar Environment** → Variáveis de ambiente
3. **Configurar Domains** → Domínio principal
4. **Configurar Services** → PostgreSQL, Redis, etc.
5. **Deploy** → Build e deploy automático

### **2. Deploy Automático**
1. **Push para GitHub** → Trigger automático
2. **Build** → EasyPanel detecta mudanças
3. **Deploy** → Zero-downtime deployment
4. **Health Check** → Verificação automática

### **3. Rollback**
1. **Deployments** → Lista de versões
2. **Rollback** → Voltar para versão anterior
3. **Verification** → Confirmar funcionamento

---

## 🛠️ **Troubleshooting**

### **Build Issues**
```bash
# Verificar logs de build
# Console → Launcher → Verificar Dockerfile
# Environment → Verificar variáveis
```

### **Runtime Issues**
```bash
# Console → Launcher → Verificar logs
# Health Check → Verificar endpoints
# Services → Verificar conectividade
```

### **SSL Issues**
```bash
# Domains → Verificar configuração
# DNS → Verificar propagação
# Let's Encrypt → Aguardar renovação
```

---

## 📈 **Escalabilidade**

### **Horizontal Scaling**
- **Replicas**: Aumentar número de containers
- **Load Balancing**: Automático pelo EasyPanel
- **Health Checks**: Monitoramento automático

### **Vertical Scaling**
- **Resources**: Aumentar CPU/RAM do servidor
- **Storage**: Aumentar volumes
- **Network**: Otimizar configurações

---

**🎉 Com essa configuração campo a campo, seu GabiFamilyDocs estará rodando perfeitamente no EasyPanel!** 