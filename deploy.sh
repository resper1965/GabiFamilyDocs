#!/bin/bash

# Script de Deploy para Produção - GabiFamilyDocs
# Uso: ./deploy.sh [start|stop|restart|update|logs|backup]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

# Verificar se o arquivo .env existe
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        error "Arquivo $ENV_FILE não encontrado. Copie env.production.example para $ENV_FILE e configure as variáveis."
    fi
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado."
    fi
}

# Verificar se o domínio está configurado
check_domain() {
    source "$ENV_FILE"
    if [ "$DOMAIN_NAME" = "seu-dominio.com" ]; then
        error "Configure o DOMAIN_NAME no arquivo $ENV_FILE"
    fi
}

# Gerar senhas seguras
generate_secrets() {
    log "Gerando senhas seguras..."
    
    # Gerar senha PostgreSQL
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    
    # Gerar senha Keycloak
    KEYCLOAK_PASSWORD=$(openssl rand -base64 32)
    
    # Gerar senha Paperless
    PAPERLESS_PASSWORD=$(openssl rand -base64 32)
    
    # Gerar senha Redis
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Gerar chaves secretas
    BACKEND_SECRET_KEY=$(openssl rand -base64 64)
    PAPERLESS_SECRET_KEY=$(openssl rand -base64 64)
    
    # Atualizar arquivo .env
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" "$ENV_FILE"
    sed -i "s/KEYCLOAK_ADMIN_PASSWORD=.*/KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_PASSWORD/" "$ENV_FILE"
    sed -i "s/PAPERLESS_ADMIN_PASSWORD=.*/PAPERLESS_ADMIN_PASSWORD=$PAPERLESS_PASSWORD/" "$ENV_FILE"
    sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" "$ENV_FILE"
    sed -i "s/BACKEND_SECRET_KEY=.*/BACKEND_SECRET_KEY=$BACKEND_SECRET_KEY/" "$ENV_FILE"
    sed -i "s/PAPERLESS_SECRET_KEY=.*/PAPERLESS_SECRET_KEY=$PAPERLESS_SECRET_KEY/" "$ENV_FILE"
    
    log "Senhas geradas e salvas no arquivo $ENV_FILE"
}

# Backup do banco de dados
backup_database() {
    log "Fazendo backup do banco de dados..."
    
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    source "$ENV_FILE"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    
    log "Backup salvo em $BACKUP_DIR/backup_$TIMESTAMP.sql"
}

# Restaurar backup
restore_database() {
    if [ -z "$1" ]; then
        error "Especifique o arquivo de backup: ./deploy.sh restore <arquivo_backup>"
    fi
    
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        error "Arquivo de backup não encontrado: $BACKUP_FILE"
    fi
    
    log "Restaurando backup: $BACKUP_FILE"
    
    source "$ENV_FILE"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB" < "$BACKUP_FILE"
    
    log "Backup restaurado com sucesso"
}

# Iniciar serviços
start() {
    log "Iniciando GabiFamilyDocs em produção..."
    
    check_env
    check_docker
    check_domain
    
    # Criar diretórios necessários
    mkdir -p "$LOG_DIR"
    
    # Iniciar serviços
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log "Serviços iniciados. Aguardando inicialização..."
    sleep 30
    
    # Verificar status
    docker-compose -f "$COMPOSE_FILE" ps
    
    log "GabiFamilyDocs está rodando em https://$DOMAIN_NAME"
}

# Parar serviços
stop() {
    log "Parando GabiFamilyDocs..."
    
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    log "Serviços parados"
}

# Reiniciar serviços
restart() {
    log "Reiniciando GabiFamilyDocs..."
    
    stop
    start
}

# Atualizar aplicação
update() {
    log "Atualizando GabiFamilyDocs..."
    
    # Fazer backup antes da atualização
    backup_database
    
    # Parar serviços
    stop
    
    # Pull das imagens mais recentes
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Rebuild das imagens locais
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    # Iniciar serviços
    start
    
    log "Atualização concluída"
}

# Mostrar logs
logs() {
    if [ -z "$1" ]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
    else
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$1"
    fi
}

# Status dos serviços
status() {
    log "Status dos serviços:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo ""
    log "Logs recentes:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=20
}

# Limpeza
cleanup() {
    log "Limpando recursos não utilizados..."
    
    docker system prune -f
    docker volume prune -f
    
    log "Limpeza concluída"
}

# Monitoramento
monitor() {
    log "Monitoramento dos serviços:"
    
    echo "=== Status dos Containers ==="
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo ""
    echo "=== Uso de Recursos ==="
    docker stats --no-stream
    
    echo ""
    echo "=== Logs de Erro Recentes ==="
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50 | grep -i error || echo "Nenhum erro encontrado"
}

# Ajuda
help() {
    echo "Script de Deploy para Produção - GabiFamilyDocs"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start     - Iniciar todos os serviços"
    echo "  stop      - Parar todos os serviços"
    echo "  restart   - Reiniciar todos os serviços"
    echo "  update    - Atualizar aplicação (backup + rebuild + restart)"
    echo "  logs      - Mostrar logs (todos ou serviço específico)"
    echo "  status    - Mostrar status dos serviços"
    echo "  backup    - Fazer backup do banco de dados"
    echo "  restore   - Restaurar backup do banco de dados"
    echo "  monitor   - Monitoramento dos serviços"
    echo "  cleanup   - Limpar recursos Docker não utilizados"
    echo "  secrets   - Gerar senhas seguras"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 restore backups/backup_20240101_120000.sql"
}

# Main
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    update)
        update
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    monitor)
        monitor
        ;;
    cleanup)
        cleanup
        ;;
    secrets)
        generate_secrets
        ;;
    help|*)
        help
        ;;
esac 