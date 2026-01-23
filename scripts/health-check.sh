#!/bin/bash

##############################################################################
# System Health Check Script
# Checks the health of all services
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Max IT TV Affiliation System - Health Check${NC}"
echo "=============================================="

# Check if docker-compose is running
if ! docker-compose ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker Compose is not running${NC}"
    exit 1
fi

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local name=$3

    echo -ne "${YELLOW}Checking ${name}...${NC} "

    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

# Function to check docker service
check_docker_service() {
    local service=$1
    local name=$2

    echo -ne "${YELLOW}Checking ${name}...${NC} "

    local status=$(docker-compose ps -q "$service" 2>/dev/null)
    if [ -z "$status" ]; then
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi

    local health=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose ps -q "$service") 2>/dev/null)
    if [ "$health" = "healthy" ] || [ "$health" = "" ]; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy (${health})${NC}"
        return 1
    fi
}

echo ""

# Check services
FAILED=0

check_service "api" "http://localhost/health" "API Service" || FAILED=$((FAILED+1))
check_docker_service "worker" "Worker Service" || FAILED=$((FAILED+1))
check_docker_service "scheduler" "Scheduler Service" || FAILED=$((FAILED+1))
check_docker_service "postgres" "PostgreSQL Database" || FAILED=$((FAILED+1))
check_docker_service "redis" "Redis Cache" || FAILED=$((FAILED+1))
check_docker_service "nginx" "Nginx Proxy" || FAILED=$((FAILED+1))
check_service "prometheus" "http://localhost:9090/-/healthy" "Prometheus" || FAILED=$((FAILED+1))
check_service "grafana" "http://localhost:3001/api/health" "Grafana" || FAILED=$((FAILED+1))

echo ""
echo "=============================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy${NC}"
    exit 0
else
    echo -e "${RED}✗ ${FAILED} service(s) are unhealthy${NC}"
    exit 1
fi
