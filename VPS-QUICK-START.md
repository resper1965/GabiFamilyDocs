# ⚡ Quick Start - VPS GabiFamilyDocs

Guia de início rápido para deploy na VPS em 15 minutos.

## 🚀 **Deploy Rápido (15 minutos)**

### **1. Preparar VPS (3 min)**

```bash
# Conectar na VPS
ssh usuario@seu-servidor.com

# Criar diretório
mkdir -p /opt/gabifamilydocs
cd /opt/gabifamilydocs

# Clonar repositório
git clone https://github.com/seu-usuario/gabifamilydocs.git .
```

### **2. Configurar Ambiente (5 min)**

```bash
# Copiar arquivo de exemplo
cp vps.env.example .env

# Editar variáveis
nano .env
```

**Configurar no .env:**
```bash
# Substituir pelos valores reais da sua VPS
DATABASE_URL=postgresql://postgres:SENHA_REAL@localhost:5432/gabifamilydocs
REDIS_URL=redis://:SENHA_REAL@localhost:6379
KEYCLOAK_URL=https://seu-dominio-real.com/auth
PAPERLESS_URL=https://seu-dominio-real.com/paperless
OLLAMA_URL=http://localhost:11434
DOMAIN_NAME=seu-dominio-real.com
SECRET_KEY=sua-chave-secreta-real-64-caracteres
```

### **3. Deploy Automático (7 min)**

```bash
# Dar permissão ao script
chmod +x vps-deploy.sh

# Executar deploy completo
./vps-deploy.sh deploy
```

## ✅ **Verificação Rápida**

### **1. Status dos Serviços**
```bash
# Verificar se tudo está rodando
./vps-deploy.sh status

# Ver logs
./vps-deploy.sh logs
```

### **2. Testar Aplicação**
```bash
# Health check
curl -f https://seu-dominio.com/health

# Acessar no navegador
https://seu-dominio.com
```

## 🔧 **Comandos Úteis**

### **Gerenciamento**
```bash
# Ver status
./vps-deploy.sh status

# Ver logs
./vps-deploy.sh logs

# Fazer backup
./vps-deploy.sh backup

# Atualizar
./vps-deploy.sh update

# Rollback
./vps-deploy.sh rollback
```

### **Troubleshooting**
```bash
# Verificar serviços existentes
docker ps

# Verificar conectividade
curl -f http://localhost:5432  # PostgreSQL
curl -f http://localhost:6379  # Redis
curl -f http://localhost:11434 # Ollama

# Ver logs detalhados
docker-compose logs -f gabifamilydocs
```

## 🛠️ **Problemas Comuns**

### **1. Aplicação Não Inicia**
```bash
# Verificar logs
./vps-deploy.sh logs

# Verificar variáveis de ambiente
cat .env

# Verificar conectividade com serviços
./vps-deploy.sh status
```

### **2. SSL Não Funciona**
```bash
# Configurar SSL manualmente
./vps-deploy.sh ssl

# Verificar certificados
ls -la ssl/
```

### **3. Banco Não Conecta**
```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Testar conexão
psql -h localhost -U postgres -d gabifamilydocs
```

## 📊 **Monitoramento**

### **Logs em Tempo Real**
```bash
# Logs da aplicação
docker-compose logs -f gabifamilydocs

# Logs do nginx
docker-compose logs -f nginx
```

### **Métricas**
```bash
# Uso de recursos
docker stats

# Espaço em disco
df -h

# Status dos containers
docker-compose ps
```

## 🔄 **Atualizações**

### **Deploy Automático**
```bash
# Atualizar código
git pull origin main

# Deploy automático
./vps-deploy.sh update
```

### **Deploy Manual**
```bash
# Build e deploy
./vps-deploy.sh build
./vps-deploy.sh deploy
```

## 📞 **Suporte**

### **Logs para Debug**
```bash
# Exportar logs
docker-compose logs > debug.log

# Verificar configuração
cat .env
cat docker-compose.yml
```

### **Recursos**
- **Documentação**: `VPS-DEPLOY.md`
- **Script**: `vps-deploy.sh`
- **Configuração**: `vps.env.example`

---

**🎉 Pronto! Seu GabiFamilyDocs está rodando na VPS!**

**URL**: `https://seu-dominio.com`
**Status**: ✅ Produção
**SSL**: ✅ Automático
**Integração**: ✅ Keycloak, Paperless, Ollama
**Script**: ✅ `./vps-deploy.sh` 