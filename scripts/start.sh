#!/bin/bash

# Script de inicialização para EasyPanel
# Inicia o backend e o nginx

set -e

# Função para log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Função para aguardar o banco de dados
wait_for_database() {
    log "Aguardando banco de dados..."
    
    # Extrair informações do DATABASE_URL
    if [[ $DATABASE_URL == postgresql://* ]]; then
        # Parse PostgreSQL URL
        DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')
        DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
        DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
        
        until pg_isready -h $DB_HOST -p $DB_PORT -d $DB_NAME; do
            log "Banco de dados não está pronto, aguardando..."
            sleep 2
        done
    fi
    
    log "Banco de dados está pronto!"
}

# Função para executar migrações
run_migrations() {
    log "Executando migrações do banco de dados..."
    
    cd /app/backend
    
    # Executar migrações Alembic
    if command -v alembic &> /dev/null; then
        alembic upgrade head
        log "Migrações concluídas"
    else
        log "Alembic não encontrado, pulando migrações"
    fi
}

# Função para iniciar o backend
start_backend() {
    log "Iniciando backend..."
    
    cd /app/backend
    
    # Iniciar o backend em background
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 &
    
    BACKEND_PID=$!
    log "Backend iniciado com PID: $BACKEND_PID"
}

# Função para iniciar o nginx
start_nginx() {
    log "Iniciando nginx..."
    
    # Iniciar nginx
    nginx -g "daemon off;" &
    
    NGINX_PID=$!
    log "Nginx iniciado com PID: $NGINX_PID"
}

# Função para aguardar o backend estar pronto
wait_for_backend() {
    log "Aguardando backend estar pronto..."
    
    until curl -f http://localhost:8000/health > /dev/null 2>&1; do
        log "Backend não está pronto, aguardando..."
        sleep 2
    done
    
    log "Backend está pronto!"
}

# Função para monitorar processos
monitor_processes() {
    log "Monitorando processos..."
    
    while true; do
        # Verificar se o backend ainda está rodando
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            log "Backend parou inesperadamente!"
            exit 1
        fi
        
        # Verificar se o nginx ainda está rodando
        if ! kill -0 $NGINX_PID 2>/dev/null; then
            log "Nginx parou inesperadamente!"
            exit 1
        fi
        
        sleep 10
    done
}

# Função para cleanup
cleanup() {
    log "Recebido sinal de parada, finalizando processos..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$NGINX_PID" ]; then
        nginx -s quit 2>/dev/null || true
    fi
    
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGTERM SIGINT

# Main
main() {
    log "Iniciando GabiFamilyDocs no EasyPanel..."
    
    # Aguardar banco de dados
    wait_for_database
    
    # Executar migrações
    run_migrations
    
    # Iniciar backend
    start_backend
    
    # Aguardar backend estar pronto
    wait_for_backend
    
    # Iniciar nginx
    start_nginx
    
    log "GabiFamilyDocs iniciado com sucesso!"
    log "Frontend disponível em: http://localhost:3000"
    log "Backend disponível em: http://localhost:8000"
    
    # Monitorar processos
    monitor_processes
}

# Executar main
main "$@" 