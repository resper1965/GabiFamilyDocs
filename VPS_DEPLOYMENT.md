# 🚀 Deploy GabiFamilyDocs na VPS

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Git instalado
- 8GB RAM mínimo (para Ollama)
- 20GB espaço em disco
- Portas disponíveis: 3000, 8001, 8002, 8080, 11434

## 🔧 Passos para Deploy

### 1. Clone o Repositório
```bash
git clone <SEU_REPOSITORIO_URL>
cd GabiFamilyDocs
```

### 2. Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env (opcional - as configurações já estão no código)
cp .env.example .env
```

### 3. Iniciar Aplicação
```bash
# Iniciar apenas backend e frontend (serviços laterais já existem)
docker-compose -f docker-compose.app.yml up -d

# Verificar status
docker-compose -f docker-compose.app.yml ps
```

### 4. Verificar Logs
```bash
# Logs do backend
docker logs gabi-family-docs_backend

# Logs do frontend
docker logs gabi-family-docs_frontend
```

## 🌐 URLs de Acesso

- **Frontend**: http://SEU_IP_VPS:3000
- **Backend API**: http://SEU_IP_VPS:8002
- **Keycloak**: http://SEU_IP_VPS:8080
- **Paperless NG**: http://SEU_IP_VPS:8001
- **Ollama**: http://SEU_IP_VPS:11434

## 🔍 Troubleshooting

### Problemas de Conexão
```bash
# Testar conectividade entre containers
docker exec gabi-family-docs_backend python test_connection.py

# Verificar rede
docker network ls
docker network inspect gabifamilydocs_gabifamily_network
```

### Rebuild dos Containers
```bash
# Rebuild completo
docker-compose -f docker-compose.app.yml down
docker-compose -f docker-compose.app.yml up --build -d
```

### Limpeza
```bash
# Parar e remover containers
docker-compose -f docker-compose.app.yml down

# Remover imagens (cuidado!)
docker rmi gabifamilydocs-backend gabifamilydocs-frontend
```

## 📊 Monitoramento

### Verificar Status dos Serviços
```bash
# Status dos containers
docker ps

# Uso de recursos
docker stats

# Logs em tempo real
docker-compose -f docker-compose.app.yml logs -f
```

### Health Check
```bash
# Backend health
curl http://localhost:8002/health

# Frontend (deve retornar página HTML)
curl http://localhost:3000
```

## 🔐 Configurações de Segurança

### Firewall (UFW)
```bash
# Permitir portas necessárias
sudo ufw allow 3000
sudo ufw allow 8001
sudo ufw allow 8002
sudo ufw allow 8080
sudo ufw allow 11434
```

### Nginx Reverse Proxy (Opcional)
```bash
# Instalar nginx
sudo apt update
sudo apt install nginx

# Configurar proxy reverso para frontend
sudo nano /etc/nginx/sites-available/gabifamilydocs
```

## 📝 Logs e Debug

### Logs Detalhados
```bash
# Logs do backend com timestamps
docker logs gabi-family-docs_backend --timestamps

# Logs dos últimos 100 linhas
docker logs gabi-family-docs_backend --tail 100

# Logs de erro
docker logs gabi-family-docs_backend 2>&1 | grep ERROR
```

### Debug de Rede
```bash
# Testar conectividade interna
docker exec gabi-family-docs_backend ping host.docker.internal

# Verificar variáveis de ambiente
docker exec gabi-family-docs_backend env | grep -E "(DATABASE|KEYCLOAK|PAPERLESS|OLLAMA)"
```

## 🚨 Comandos de Emergência

### Restart Rápido
```bash
docker-compose -f docker-compose.app.yml restart
```

### Reset Completo
```bash
docker-compose -f docker-compose.app.yml down
docker system prune -f
docker-compose -f docker-compose.app.yml up --build -d
```

### Backup
```bash
# Backup dos volumes (se necessário)
docker run --rm -v gabifamilydocs_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

---

**📞 Suporte**: Em caso de problemas, verifique os logs e execute os comandos de troubleshooting acima. 