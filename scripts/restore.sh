#!/bin/bash

##############################################################################
# Database Restore Script
# Restores a PostgreSQL database from a backup file
##############################################################################

set -e

# Configuration
BACKUP_DIR="./backups"
DB_NAME="${DB_NAME:-maxittv}"
DB_USER="${DB_USER:-postgres}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Max IT TV Affiliation System - Database Restore${NC}"
echo "=================================================="

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "\n${YELLOW}WARNING: This will replace all data in the database!${NC}"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

echo -e "${YELLOW}Starting restore...${NC}"

# Stop services that use the database
echo "Stopping services..."
docker-compose stop api worker scheduler

# Drop and recreate database
echo "Dropping and recreating database..."
docker-compose exec -T postgres psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" postgres
docker-compose exec -T postgres psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" postgres

# Restore backup
echo "Restoring backup..."
if gunzip < "$BACKUP_FILE" | docker-compose exec -T postgres psql -U "$DB_USER" "$DB_NAME"; then
    echo -e "${GREEN}✓ Restore completed successfully${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    exit 1
fi

# Start services
echo "Starting services..."
docker-compose start api worker scheduler

echo -e "\n${GREEN}Done!${NC}"
echo "Database has been restored from: $BACKUP_FILE"
