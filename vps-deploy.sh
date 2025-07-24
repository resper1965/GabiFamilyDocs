#!/bin/bash

# Script de Deploy para VPS - GabiFamilyDocs
# Integração com serviços existentes (Keycloak, Paperless, Ollama)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Função para sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para erro
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para aviso
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado"
        exit 1
    fi
    
    # Verificar se Docker Compose está instalado
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado"
        exit 1
    fi
    
    # Verificar se Git está instalado
    if ! command -v git &> /dev/null; then
        error "Git não está instalado"
        exit 1
    fi
    
    # Verificar se arquivo .env existe
    if [ ! -f ".env" ]; then
        error "Arquivo .env não encontrado"
        log "Copie vps.env.example para .env e configure as variáveis"
        exit 1
    fi
    
    success "Pré-requisitos verificados"
}

# Função para verificar serviços existentes
check_existing_services() {
    log "Verificando serviços existentes na VPS..."
    
    # Verificar PostgreSQL
    if ! docker ps | grep -q postgres; then
        warning "PostgreSQL não encontrado rodando"
    else
        success "PostgreSQL encontrado"
    fi
    
    # Verificar Redis
    if ! docker ps | grep -q redis; then
        warning "Redis não encontrado rodando"
    else
        success "Redis encontrado"
    fi
    
    # Verificar Keycloak
    if ! docker ps | grep -q keycloak; then
        warning "Keycloak não encontrado rodando"
    else
        success "Keycloak encontrado"
    fi
    
    # Verificar Paperless
    if ! docker ps | grep -q paperless; then
        warning "Paperless não encontrado rodando"
    else
        success "Paperless encontrado"
    fi
    
    # Verificar Ollama
    if ! docker ps | grep -q ollama; then
        warning "Ollama não encontrado rodando"
    else
        success "Ollama encontrado"
    fi
}

# Função para criar banco de dados
create_database() {
    log "Criando banco de dados gabifamilydocs..."
    
    # Extrair informações do DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
    DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
    DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
    DB_PASS=$(echo $DATABASE_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
    
    # Tentar criar o banco
    if command -v psql &> /dev/null; then
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
        success "Banco de dados verificado/criado"
    else
        warning "psql não encontrado, pulando criação do banco"
    fi
}

# Função para build da aplicação
build_application() {
    log "Fazendo build da aplicação..."
    
    # Fazer build
    docker-compose build --no-cache
    
    success "Build concluído"
}

# Função para deploy
deploy() {
    log "Iniciando deploy..."
    
    # Parar serviços existentes
    docker-compose down 2>/dev/null || true
    
    # Iniciar serviços
    docker-compose up -d
    
    # Aguardar aplicação estar pronta
    log "Aguardando aplicação estar pronta..."
    sleep 30
    
    # Verificar health check
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        success "Aplicação está respondendo"
    else
        error "Aplicação não está respondendo"
        docker-compose logs gabifamilydocs
        exit 1
    fi
    
    success "Deploy concluído"
}

# Função para configurar SSL
setup_ssl() {
    log "Configurando SSL..."
    
    # Verificar se certbot está instalado
    if ! command -v certbot &> /dev/null; then
        warning "Certbot não encontrado, pulando configuração SSL"
        return
    fi
    
    # Verificar se domínio está configurado
    if [ -z "$DOMAIN_NAME" ]; then
        warning "DOMAIN_NAME não configurado, pulando SSL"
        return
    fi
    
    # Criar diretório SSL
    mkdir -p ssl
    
    # Gerar certificado se não existir
    if [ ! -f "ssl/cert.pem" ]; then
        log "Gerando certificado SSL para $DOMAIN_NAME..."
        sudo certbot certonly --standalone -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
        
        # Copiar certificados
        sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem ssl/cert.pem
        sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem ssl/key.pem
        sudo chown -R $USER:$USER ssl/
    fi
    
    success "SSL configurado"
}

# Função para verificar status
status() {
    log "Verificando status dos serviços..."
    
    docker-compose ps
    
    # Verificar health checks
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        success "Aplicação: OK"
    else
        error "Aplicação: ERRO"
    fi
    
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        success "Nginx: OK"
    else
        error "Nginx: ERRO"
    fi
}

# Função para logs
show_logs() {
    log "Mostrando logs..."
    docker-compose logs -f
}

# Função para backup
backup() {
    log "Fazendo backup..."
    
    # Criar diretório de backup
    mkdir -p backups
    
    # Backup do banco
    if command -v pg_dump &> /dev/null; then
        DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')
        DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
        DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
        DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
        DB_PASS=$(echo $DATABASE_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
        
        PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > backups/db_$(date +%Y%m%d_%H%M%S).sql
        success "Backup do banco criado"
    fi
    
    # Backup dos volumes
    docker run --rm -v gabifamilydocs_app_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/app_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
    success "Backup dos dados criado"
}

# Função para restore
restore() {
    if [ -z "$1" ]; then
        error "Especifique o arquivo de backup"
        exit 1
    fi
    
    log "Restaurando backup: $1"
    
    # Restaurar banco
    if [[ $1 == *"db_"* ]]; then
        DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')
        DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
        DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
        DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
        DB_PASS=$(echo $DATABASE_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
        
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME < $1
        success "Banco restaurado"
    fi
    
    # Restaurar dados
    if [[ $1 == *"app_data_"* ]]; then
        docker run --rm -v gabifamilydocs_app_data:/data -v $(pwd):/backup alpine tar xzf /backup/$1 -C /data
        success "Dados restaurados"
    fi
}

# Função para update
update() {
    log "Atualizando aplicação..."
    
    # Backup antes do update
    backup
    
    # Pull das mudanças
    git pull origin main
    
    # Rebuild e restart
    build_application
    deploy
    
    success "Update concluído"
}

# Função para rollback
rollback() {
    log "Fazendo rollback..."
    
    # Voltar para versão anterior
    git checkout HEAD~1
    
    # Rebuild e restart
    build_application
    deploy
    
    success "Rollback concluído"
}

# Função para limpeza
cleanup() {
    log "Limpando recursos não utilizados..."
    
    # Limpar imagens não utilizadas
    docker image prune -f
    
    # Limpar volumes não utilizados
    docker volume prune -f
    
    # Limpar tudo
    docker system prune -f
    
    success "Limpeza concluída"
}

# Função para ajuda
show_help() {
    echo "Script de Deploy para VPS - GabiFamilyDocs"
    echo ""
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos:"
    echo "  deploy     - Fazer deploy da aplicação"
    echo "  build      - Fazer build da aplicação"
    echo "  status     - Verificar status dos serviços"
    echo "  logs       - Mostrar logs"
    echo "  backup     - Fazer backup"
    echo "  restore    - Restaurar backup (especificar arquivo)"
    echo "  update     - Atualizar aplicação"
    echo "  rollback   - Fazer rollback"
    echo "  ssl        - Configurar SSL"
    echo "  cleanup    - Limpar recursos não utilizados"
    echo "  help       - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 deploy"
    echo "  $0 backup"
    echo "  $0 restore backups/db_20231201_120000.sql"
}

# Main
case "${1:-deploy}" in
    deploy)
        check_prerequisites
        check_existing_services
        create_database
        build_application
        setup_ssl
        deploy
        status
        ;;
    build)
        check_prerequisites
        build_application
        ;;
    status)
        status
        ;;
    logs)
        show_logs
        ;;
    backup)
        backup
        ;;
    restore)
        restore $2
        ;;
    update)
        update
        ;;
    rollback)
        rollback
        ;;
    ssl)
        setup_ssl
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Comando inválido: $1"
        show_help
        exit 1
        ;;
esac 