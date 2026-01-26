#!/bin/bash

##############################################################################
# Database Backup Script
# Creates a backup of the PostgreSQL database
##############################################################################

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-maxittv}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Max IT TV Affiliation System - Database Backup${NC}"
echo "=================================================="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

echo -e "\n${YELLOW}Starting backup...${NC}"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Create backup
if docker-compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Clean up old backups
echo -e "\n${YELLOW}Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
echo "Remaining backups: $(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)"

# List recent backups
echo -e "\n${GREEN}Recent backups:${NC}"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"

echo -e "\n${GREEN}Done!${NC}"
