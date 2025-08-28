#!/bin/bash

# Database Restore Script for Personalized LMS
# This script restores the Supabase database from a backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"
DATABASE_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS] BACKUP_NAME"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -l, --list              List available backups"
    echo "  -f, --force             Skip confirmation prompts"
    echo "  --data-only             Restore data only (skip schema)"
    echo "  --schema-only           Restore schema only (skip data)"
    echo "  --no-storage            Skip storage restore"
    echo ""
    echo "Examples:"
    echo "  $0 lms_backup_20240101_120000"
    echo "  $0 --list"
    echo "  $0 --force --data-only lms_backup_20240101_120000"
    exit 1
}

# List available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        warn "Backup directory does not exist: $BACKUP_DIR"
        return
    fi
    
    local backups=($(find "$BACKUP_DIR" -name "*_metadata.json" -type f | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        warn "No backups found"
        return
    fi
    
    printf "%-30s %-20s %-15s %-10s\n" "BACKUP NAME" "DATE" "ENVIRONMENT" "SIZE"
    printf "%-30s %-20s %-15s %-10s\n" "$(printf '%*s' 30 | tr ' ' '-')" "$(printf '%*s' 20 | tr ' ' '-')" "$(printf '%*s' 15 | tr ' ' '-')" "$(printf '%*s' 10 | tr ' ' '-')"
    
    for metadata_file in "${backups[@]}"; do
        local backup_name=$(jq -r '.backup_name' "$metadata_file" 2>/dev/null || echo "unknown")
        local date=$(jq -r '.date' "$metadata_file" 2>/dev/null || echo "unknown")
        local environment=$(jq -r '.environment' "$metadata_file" 2>/dev/null || echo "unknown")
        
        local sql_file="$BACKUP_DIR/${backup_name}.sql.gz"
        local size="N/A"
        if [[ -f "$sql_file" ]]; then
            size=$(du -h "$sql_file" | cut -f1)
        fi
        
        printf "%-30s %-20s %-15s %-10s\n" "$backup_name" "$date" "$environment" "$size"
    done
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed. Please install it first."
    fi
    
    if ! command -v psql &> /dev/null; then
        error "psql is not installed. Please install PostgreSQL client tools."
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install jq for JSON processing."
    fi
    
    if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
        error "SUPABASE_PROJECT_ID environment variable is not set"
    fi
    
    if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
        error "SUPABASE_ACCESS_TOKEN environment variable is not set"
    fi
    
    log "Dependencies check passed"
}

# Validate backup files
validate_backup() {
    local backup_name=$1
    
    log "Validating backup: $backup_name"
    
    local metadata_file="$BACKUP_DIR/${backup_name}_metadata.json"
    local sql_file="$BACKUP_DIR/${backup_name}.sql.gz"
    local storage_file="$BACKUP_DIR/${backup_name}_storage.tar.gz"
    
    if [[ ! -f "$metadata_file" ]]; then
        error "Metadata file not found: $metadata_file"
    fi
    
    if [[ ! -f "$sql_file" ]]; then
        error "SQL backup file not found: $sql_file"
    fi
    
    # Validate metadata
    if ! jq empty "$metadata_file" 2>/dev/null; then
        error "Invalid metadata file: $metadata_file"
    fi
    
    # Test SQL file integrity
    if ! gzip -t "$sql_file" 2>/dev/null; then
        error "Corrupted SQL backup file: $sql_file"
    fi
    
    log "Backup validation passed"
    
    # Show backup info
    info "Backup Information:"
    echo "  Name: $(jq -r '.backup_name' "$metadata_file")"
    echo "  Date: $(jq -r '.date' "$metadata_file")"
    echo "  Environment: $(jq -r '.environment' "$metadata_file")"
    echo "  Type: $(jq -r '.backup_type' "$metadata_file")"
    echo ""
}

# Confirm restore operation
confirm_restore() {
    if [[ "$FORCE" == "true" ]]; then
        return
    fi
    
    warn "This operation will REPLACE all data in the target database!"
    warn "Current database: $SUPABASE_PROJECT_ID"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        log "Restore operation cancelled"
        exit 0
    fi
}

# Create database restore point
create_restore_point() {
    log "Creating restore point before restore operation..."
    
    local restore_point_name="pre_restore_$(date +"%Y%m%d_%H%M%S")"
    local restore_point_file="$BACKUP_DIR/${restore_point_name}.sql.gz"
    
    # Get database connection string
    if [[ -z "$DATABASE_URL" ]]; then
        DATABASE_URL=$(supabase projects api-keys --project-ref "$SUPABASE_PROJECT_ID" --output json | jq -r '.database_url')
    fi
    
    # Create quick backup
    pg_dump "$DATABASE_URL" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --no-owner \
        --no-privileges \
        | gzip > "$restore_point_file"
    
    log "Restore point created: $restore_point_file"
}

# Restore database
restore_database() {
    local backup_name=$1
    local sql_file="$BACKUP_DIR/${backup_name}.sql.gz"
    
    log "Starting database restore from: $sql_file"
    
    # Get database connection string
    if [[ -z "$DATABASE_URL" ]]; then
        DATABASE_URL=$(supabase projects api-keys --project-ref "$SUPABASE_PROJECT_ID" --output json | jq -r '.database_url')
    fi
    
    # Restore database
    if [[ "$SCHEMA_ONLY" == "true" ]]; then
        log "Restoring schema only..."
        zcat "$sql_file" | psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=on --quiet
    elif [[ "$DATA_ONLY" == "true" ]]; then
        log "Restoring data only..."
        zcat "$sql_file" | psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=on --quiet --data-only
    else
        log "Restoring full database..."
        zcat "$sql_file" | psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=on --quiet
    fi
    
    log "Database restore completed"
}

# Restore storage files
restore_storage() {
    local backup_name=$1
    local storage_file="$BACKUP_DIR/${backup_name}_storage.tar.gz"
    
    if [[ "$NO_STORAGE" == "true" ]]; then
        log "Skipping storage restore (--no-storage flag)"
        return
    fi
    
    if [[ ! -f "$storage_file" ]]; then
        warn "Storage backup file not found: $storage_file"
        return
    fi
    
    log "Starting storage restore from: $storage_file"
    
    # Extract storage files to temporary directory
    local temp_dir=$(mktemp -d)
    tar -xzf "$storage_file" -C "$temp_dir"
    
    # Upload files to Supabase storage
    local storage_dir="$temp_dir/${backup_name}_storage"
    if [[ -d "$storage_dir" ]]; then
        log "Uploading storage files..."
        supabase storage upload \
            --project-ref "$SUPABASE_PROJECT_ID" \
            --recursive \
            --upsert \
            media/ "$storage_dir/"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log "Storage restore completed"
}

# Verify restore
verify_restore() {
    log "Verifying restore operation..."
    
    # Basic connectivity test
    if [[ -z "$DATABASE_URL" ]]; then
        DATABASE_URL=$(supabase projects api-keys --project-ref "$SUPABASE_PROJECT_ID" --output json | jq -r '.database_url')
    fi
    
    # Check if main tables exist
    local table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    if [[ "$table_count" -gt 0 ]]; then
        log "Restore verification passed ($table_count tables found)"
    else
        error "Restore verification failed (no tables found)"
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
                \"text\": \"LMS Restore $status\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"fields\": [{
                        \"title\": \"Restore Status\",
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

# Parse command line arguments
FORCE=false
DATA_ONLY=false
SCHEMA_ONLY=false
NO_STORAGE=false
BACKUP_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --data-only)
            DATA_ONLY=true
            shift
            ;;
        --schema-only)
            SCHEMA_ONLY=true
            shift
            ;;
        --no-storage)
            NO_STORAGE=true
            shift
            ;;
        -*)
            error "Unknown option: $1"
            ;;
        *)
            BACKUP_NAME="$1"
            shift
            ;;
    esac
done

# Main execution
main() {
    if [[ -z "$BACKUP_NAME" ]]; then
        error "Backup name is required. Use --list to see available backups."
    fi
    
    log "Starting LMS database restore process..."
    
    check_dependencies
    validate_backup "$BACKUP_NAME"
    confirm_restore
    create_restore_point
    restore_database "$BACKUP_NAME"
    restore_storage "$BACKUP_NAME"
    verify_restore
    
    log "Restore process completed successfully!"
    send_notification "SUCCESS" "Database restore completed successfully: $BACKUP_NAME"
}

# Error handling
trap 'error "Restore process failed"' ERR
trap 'send_notification "FAILED" "Database restore process failed"' ERR

# Run main function
main "$@"