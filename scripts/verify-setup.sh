#!/bin/bash

##############################################################################
# Setup Verification Script
# Verifies that all required files and configurations are in place
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Max IT TV Affiliation System - Setup Verification${NC}"
echo "===================================================="

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    local file=$1
    local required=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗${NC} $file (REQUIRED)"
            ERRORS=$((ERRORS+1))
        else
            echo -e "${YELLOW}⚠${NC} $file (optional)"
            WARNINGS=$((WARNINGS+1))
        fi
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1

    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir/"
        return 0
    else
        echo -e "${RED}✗${NC} $dir/ (missing)"
        ERRORS=$((ERRORS+1))
        return 1
    fi
}

echo -e "\n${BLUE}Checking Core Files...${NC}"
check_file "docker-compose.yml" "required"
check_file ".env" "required"
check_file "README.md" "required"
check_file "QUICKSTART.md" "required"
check_file "Makefile" "required"

echo -e "\n${BLUE}Checking Backend Files...${NC}"
check_file "backend/Dockerfile" "required"
check_file "backend/package.json" "required"
check_file "backend/src/index.js" "required"
check_file "backend/src/worker.js" "required"
check_file "backend/src/scheduler.js" "required"
check_file "backend/src/config/index.js" "required"

echo -e "\n${BLUE}Checking Database Files...${NC}"
check_dir "backend/migrations"
check_dir "backend/seeds"
check_file "backend/migrations/001_initial_schema.sql" "required"
check_file "backend/seeds/001_initial_data.sql" "required"

echo -e "\n${BLUE}Checking Docker Configuration...${NC}"
check_dir "docker/nginx"
check_dir "docker/prometheus"
check_dir "docker/grafana"
check_file "docker/nginx/nginx.conf" "required"
check_file "docker/nginx/conf.d/locations.conf" "required"
check_file "docker/prometheus/prometheus.yml" "required"
check_file "docker/grafana/provisioning/datasources/prometheus.yml" "required"
check_file "docker/grafana/provisioning/dashboards/default.yml" "required"
check_file "docker/grafana/dashboards/main_dashboard.json" "required"

echo -e "\n${BLUE}Checking Scripts...${NC}"
check_dir "scripts"
check_file "scripts/backup.sh" "required"
check_file "scripts/restore.sh" "required"
check_file "scripts/health-check.sh" "required"

echo -e "\n${BLUE}Checking Required Directories...${NC}"
check_dir "backend/uploads"
check_dir "backend/logs"
check_dir "backups"

echo -e "\n${BLUE}Checking Environment Configuration...${NC}"
if [ -f ".env" ]; then
    # Check for required environment variables
    required_vars=("DB_PASSWORD" "JWT_SECRET" "SESSION_SECRET")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env && ! grep -q "^${var}=$" .env && ! grep -q "^${var}=change" .env; then
            echo -e "${GREEN}✓${NC} $var is set"
        else
            echo -e "${RED}✗${NC} $var is not configured"
            ERRORS=$((ERRORS+1))
        fi
    done
else
    echo -e "${RED}✗${NC} .env file not found"
    ERRORS=$((ERRORS+1))
fi

echo -e "\n${BLUE}Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed ($(docker --version))"
else
    echo -e "${RED}✗${NC} Docker is not installed"
    ERRORS=$((ERRORS+1))
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is installed ($(docker-compose --version))"
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
    ERRORS=$((ERRORS+1))
fi

echo -e "\n${BLUE}Checking Script Permissions...${NC}"
if [ -x "scripts/backup.sh" ]; then
    echo -e "${GREEN}✓${NC} backup.sh is executable"
else
    echo -e "${YELLOW}⚠${NC} backup.sh is not executable (run: chmod +x scripts/*.sh)"
    WARNINGS=$((WARNINGS+1))
fi

if [ -x "scripts/health-check.sh" ]; then
    echo -e "${GREEN}✓${NC} health-check.sh is executable"
else
    echo -e "${YELLOW}⚠${NC} health-check.sh is not executable (run: chmod +x scripts/*.sh)"
    WARNINGS=$((WARNINGS+1))
fi

echo ""
echo "===================================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Setup is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review and update .env configuration"
    echo "  2. Run: make start (or docker-compose up -d)"
    echo "  3. Run: make health (to verify all services are running)"
    echo "  4. Access the API at: http://localhost/api/v1"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup complete with ${WARNINGS} warning(s)${NC}"
    echo "You can proceed, but some optional features may not work."
    exit 0
else
    echo -e "${RED}✗ Setup incomplete! Found ${ERRORS} error(s) and ${WARNINGS} warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before starting the application."
    exit 1
fi
