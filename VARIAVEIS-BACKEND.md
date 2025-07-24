# 🔧 Variáveis de Ambiente - Backend GabiFamilyDocs

## 📋 **Variáveis Obrigatórias para Configurar**

### **1. Banco de Dados**
```bash
# Substitua pelas credenciais reais do seu PostgreSQL
DATABASE_URL=postgresql://postgres:SENHA_POSTGRES@localhost:5432/gabifamilydocs
REDIS_URL=redis://:SENHA_REDIS@localhost:6379
```

### **2. Backend**
```bash
# Gerar uma chave secreta forte (64 caracteres)
SECRET_KEY=sua-chave-secreta-super-longa-e-aleatoria-64-caracteres
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### **3. Keycloak (Já Rodando na VPS)**
```bash
# URL do Keycloak já configurado
KEYCLOAK_URL=https://gabi.esper.ws/auth
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=sua-senha-keycloak-real
```

### **4. Paperless NG (Já Rodando na VPS)**
```bash
# URL do Paperless já configurado
PAPERLESS_URL=https://gabi.esper.ws/paperless
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=sua-senha-paperless-real
PAPERLESS_SECRET_KEY=sua-chave-paperless-super-longa-e-aleatoria
```

### **5. Frontend**
```bash
# URLs para o frontend
REACT_APP_API_URL=https://gabi.esper.ws/api
REACT_APP_KEYCLOAK_URL=https://gabi.esper.ws/auth
```

### **6. Ollama (Já Rodando na VPS)**
```bash
# URL do Ollama já configurado
OLLAMA_URL=http://localhost:11434
```

### **7. Domínio**
```bash
# Domínio principal
DOMAIN_NAME=gabi.esper.ws
```

### **8. Configurações Avançadas**
```bash
# Configurações de performance e segurança
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

## 🔐 **Como Gerar Chaves Secretas**

### **SECRET_KEY (64 caracteres)**
```bash
# Gerar chave secreta
openssl rand -base64 48
```

### **PAPERLESS_SECRET_KEY (50 caracteres)**
```bash
# Gerar chave do Paperless
openssl rand -base64 37
```

## 📝 **Exemplo de Arquivo .env Completo**

```bash
# =============================================================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# =============================================================================
DATABASE_URL=postgresql://postgres:SENHA_POSTGRES@localhost:5432/gabifamilydocs
REDIS_URL=redis://:SENHA_REDIS@localhost:6379

# =============================================================================
# CONFIGURAÇÕES DO BACKEND
# =============================================================================
SECRET_KEY=sua-chave-secreta-super-longa-e-aleatoria-64-caracteres
ENVIRONMENT=production
LOG_LEVEL=INFO

# =============================================================================
# CONFIGURAÇÕES DO KEYCLOAK
# =============================================================================
KEYCLOAK_URL=https://gabi.esper.ws/auth
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=sua-senha-keycloak-real

# =============================================================================
# CONFIGURAÇÕES DO PAPERLESS NG
# =============================================================================
PAPERLESS_URL=https://gabi.esper.ws/paperless
PAPERLESS_ADMIN_USER=admin
PAPERLESS_ADMIN_PASSWORD=sua-senha-paperless-real
PAPERLESS_SECRET_KEY=sua-chave-paperless-super-longa-e-aleatoria

# =============================================================================
# CONFIGURAÇÕES DO FRONTEND
# =============================================================================
REACT_APP_API_URL=https://gabi.esper.ws/api
REACT_APP_KEYCLOAK_URL=https://gabi.esper.ws/auth

# =============================================================================
# CONFIGURAÇÕES DO OLLAMA
# =============================================================================
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

## ⚠️ **Importante**

1. **NUNCA commite senhas** no repositório
2. **Substitua todas as senhas** pelos valores reais da sua VPS
3. **Use chaves secretas fortes** geradas com `openssl rand`
4. **Mantenha o arquivo .env seguro** e não o compartilhe
5. **Verifique as URLs** dos serviços já rodando na VPS

## 🔍 **Verificação**

Após configurar, verifique se:

- ✅ Todas as variáveis estão preenchidas
- ✅ As URLs apontam para os serviços corretos
- ✅ As senhas são as reais da VPS
- ✅ As chaves secretas são fortes e únicas
- ✅ O domínio está correto (`gabi.esper.ws`) 