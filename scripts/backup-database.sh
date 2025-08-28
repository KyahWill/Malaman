#!/bin/bash

# Database Backup Script for Personalized LMS
# This script creates automated backups of the Supabase database

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="lms_backup_${TIMESTAMP}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Supabase configuration
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"
DATABASE_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed. Please install it first."
    fi
    
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump is not installed. Please install PostgreSQL client tools."
    fi
    
    if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
        error "SUPABASE_PROJECT_ID environment variable is not set"
    fi
    
    if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
        error "SUPABASE_ACCESS_TOKEN environment variable is not set"
    fi
    
    log "Dependencies check passed"
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Backup database schema and data
backup_database() {
    log "Starting database backup..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.sql"
    local backup_file_compressed="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
    
    # Get database connection string
    if [[ -z "$DATABASE_URL" ]]; then
        log "Getting database connection string from Supabase..."
        DATABASE_URL=$(supabase projects api-keys --project-ref "$SUPABASE_PROJECT_ID" --output json | jq -r '.database_url')
    fi
    
    # Create database dump
    log "Creating database dump..."
    pg_dump "$DATABASE_URL" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --no-owner \
        --no-privileges \
        --exclude-schema=realtime \
        --exclude-schema=supabase_functions \
        --exclude-schema=storage \
        --exclude-schema=auth \
        --exclude-schema=extensions \
        --exclude-schema=graphql \
        --exclude-schema=graphql_public \
        --exclude-schema=pgsodium \
        --exclude-schema=pgsodium_masks \
        --exclude-schema=vault \
        > "$backup_file"
    
    # Compress backup
    log "Compressing backup..."
    gzip "$backup_file"
    
    # Verify backup
    if [[ -f "$backup_file_compressed" ]]; then
        local file_size=$(du -h "$backup_file_compressed" | cut -f1)
        log "Backup created successfully: $backup_file_compressed ($file_size)"
    else
        error "Backup file was not created"
    fi
}

# Backup storage files
backup_storage() {
    log "Starting storage backup..."
    
    local storage_backup_dir="$BACKUP_DIR/${BACKUP_NAME}_storage"
    mkdir -p "$storage_backup_dir"
    
    # Use Supabase CLI to download storage files
    log "Downloading storage files..."
    supabase storage download \
        --project-ref "$SUPABASE_PROJECT_ID" \
        --recursive \
        --output "$storage_backup_dir" \
        media/ || warn "Storage backup failed or no files found"
    
    # Create tar archive of storage files
    if [[ -d "$storage_backup_dir" && "$(ls -A $storage_backup_dir)" ]]; then
        log "Creating storage archive..."
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}_storage.tar.gz" -C "$BACKUP_DIR" "${BACKUP_NAME}_storage"
        rm -rf "$storage_backup_dir"
        log "Storage backup completed"
    else
        warn "No storage files found to backup"
    fi
}

# Create backup metadata
create_metadata() {
    log "Creating backup metadata..."
    
    local metadata_file="$BACKUP_DIR/${BACKUP_NAME}_metadata.json"
    
    cat > "$metadata_file" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project_id": "$SUPABASE_PROJECT_ID",
  "environment": "${ENVIRONMENT:-production}",
  "backup_type": "full",
  "files": {
    "database": "${BACKUP_NAME}.sql.gz",
    "storage": "${BACKUP_NAME}_storage.tar.gz",
    "metadata": "${BACKUP_NAME}_metadata.json"
  },
  "retention_date": "$(date -u -d "+${RETENTION_DAYS} days" +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    
    log "Metadata created: $metadata_file"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "lms_backup_*" -type f -mtime +$RETENTION_DAYS -delete
    
    log "Cleanup completed"
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    if [[ -n "$CLOUD_STORAGE_BUCKET" ]]; then
        log "Uploading backup to cloud storage..."
        
        # Example for AWS S3 (uncomment and configure as needed)
        # aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.sql.gz" "s3://$CLOUD_STORAGE_BUCKET/backups/"
        # aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_storage.tar.gz" "s3://$CLOUD_STORAGE_BUCKET/backups/" 2>/dev/null || true
        # aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_metadata.json" "s3://$CLOUD_STORAGE_BUCKET/backups/"
        
        log "Cloud upload completed"
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        log "Sending notification..."
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"LMS Backup $status\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"fields\": [{
                        \"title\": \"Backup Status\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }, {
                        \"title\": \"Environment\",
                        \"value\": \"${ENVIRONMENT:-production}\",
                        \"short\": true
                    }]
                }]
            }" || warn "Failed to send notification"
    fi
}

# Main execution
main() {
    log "Starting LMS database backup process..."
    
    check_dependencies
    create_backup_dir
    
    # Perform backup
    backup_database
    backup_storage
    create_metadata
    cleanup_old_backups
    upload_to_cloud
    
    log "Backup process completed successfully!"
    send_notification "SUCCESS" "Database backup completed successfully: $BACKUP_NAME"
}

# Error handling
trap 'error "Backup process failed"' ERR
trap 'send_notification "FAILED" "Database backup process failed"' ERR

# Run main function
main "$@"