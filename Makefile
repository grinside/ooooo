.PHONY: help install start stop restart logs ps build clean backup restore migrate seed health dev prod

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(GREEN)Max IT TV Affiliation System - Available Commands$(NC)"
	@echo "=================================================="
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup & Installation

install: ## Install and set up the application
	@echo "$(GREEN)Setting up Max IT TV Affiliation System...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)⚠ .env file created. Please update with your configuration!$(NC)"; \
	else \
		echo "$(GREEN)✓ .env file already exists$(NC)"; \
	fi
	@echo "$(GREEN)✓ Setup complete!$(NC)"

##@ Docker Operations

build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build

start: ## Start all services
	@echo "$(GREEN)Starting all services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services started!$(NC)"
	@$(MAKE) ps

stop: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose stop
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

down: ## Stop and remove all containers
	@echo "$(YELLOW)Stopping and removing all containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Containers removed$(NC)"

ps: ## Show status of all services
	@docker-compose ps

logs: ## Show logs for all services (use SERVICE=name for specific service)
	@if [ -n "$(SERVICE)" ]; then \
		docker-compose logs -f $(SERVICE); \
	else \
		docker-compose logs -f; \
	fi

##@ Development

dev: ## Start services in development mode
	@echo "$(GREEN)Starting in development mode...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✓ Development environment started!$(NC)"
	@echo "$(BLUE)Available tools:$(NC)"
	@echo "  - API: http://localhost:3000"
	@echo "  - PgAdmin: http://localhost:5050"
	@echo "  - Redis Commander: http://localhost:8081"
	@echo "  - Grafana: http://localhost:3001"
	@echo "  - Prometheus: http://localhost:9090"

prod: ## Start services in production mode
	@echo "$(GREEN)Starting in production mode...$(NC)"
	@$(MAKE) start

shell-api: ## Open shell in API container
	docker-compose exec api sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d maxittv

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

##@ Database Operations

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	docker-compose exec api npm run migrate
	@echo "$(GREEN)✓ Migrations complete$(NC)"

seed: ## Seed database with initial data
	@echo "$(GREEN)Seeding database...$(NC)"
	docker-compose exec api npm run seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

migrate-seed: ## Run migrations and seed data
	@$(MAKE) migrate
	@$(MAKE) seed

backup: ## Create database backup
	@echo "$(GREEN)Creating database backup...$(NC)"
	@./scripts/backup.sh
	@echo "$(GREEN)✓ Backup complete$(NC)"

restore: ## Restore database from backup (use FILE=path/to/backup.sql.gz)
	@if [ -z "$(FILE)" ]; then \
		echo "$(YELLOW)Usage: make restore FILE=backups/backup_YYYYMMDD_HHMMSS.sql.gz$(NC)"; \
		echo "$(BLUE)Available backups:$(NC)"; \
		ls -lh backups/*.sql.gz 2>/dev/null || echo "No backups found"; \
	else \
		./scripts/restore.sh $(FILE); \
	fi

db-reset: ## Reset database (⚠️ WARNING: Destroys all data!)
	@echo "$(YELLOW)⚠ WARNING: This will destroy all data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS maxittv;"; \
		docker-compose exec postgres psql -U postgres -c "CREATE DATABASE maxittv;"; \
		$(MAKE) migrate-seed; \
		echo "$(GREEN)✓ Database reset complete$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

##@ Monitoring & Health

health: ## Check health of all services
	@./scripts/health-check.sh

metrics: ## Open Prometheus metrics
	@echo "$(BLUE)Opening Prometheus...$(NC)"
	@open http://localhost:9090 || xdg-open http://localhost:9090 || echo "Open http://localhost:9090 in your browser"

dashboards: ## Open Grafana dashboards
	@echo "$(BLUE)Opening Grafana...$(NC)"
	@open http://localhost:3001 || xdg-open http://localhost:3001 || echo "Open http://localhost:3001 in your browser"

##@ Maintenance

clean: ## Remove all containers, volumes, and images
	@echo "$(YELLOW)⚠ WARNING: This will remove all data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker-compose down -v --rmi all; \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

prune: ## Remove unused Docker resources
	@echo "$(YELLOW)Pruning unused Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✓ Prune complete$(NC)"

update: ## Pull latest changes and restart services
	@echo "$(GREEN)Updating application...$(NC)"
	git pull origin main
	@$(MAKE) build
	@$(MAKE) restart
	@$(MAKE) migrate
	@echo "$(GREEN)✓ Update complete$(NC)"

##@ Testing

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	docker-compose exec api npm test

test-watch: ## Run tests in watch mode
	docker-compose exec api npm run test:watch

test-coverage: ## Run tests with coverage
	docker-compose exec api npm run test:coverage

lint: ## Run linter
	docker-compose exec api npm run lint

format: ## Format code
	docker-compose exec api npm run format

##@ Information

info: ## Show system information
	@echo "$(GREEN)Max IT TV Affiliation System - System Information$(NC)"
	@echo "=================================================="
	@echo "$(BLUE)Docker Version:$(NC)"
	@docker --version
	@echo ""
	@echo "$(BLUE)Docker Compose Version:$(NC)"
	@docker-compose --version
	@echo ""
	@echo "$(BLUE)Running Services:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(BLUE)Disk Usage:$(NC)"
	@docker system df
	@echo ""
	@echo "$(BLUE)Endpoints:$(NC)"
	@echo "  - API: http://localhost/api/v1"
	@echo "  - Health: http://localhost/health"
	@echo "  - Prometheus: http://localhost:9090"
	@echo "  - Grafana: http://localhost:3001"

urls: ## Show all service URLs
	@echo "$(GREEN)Max IT TV Affiliation System - Service URLs$(NC)"
	@echo "=================================================="
	@echo "$(BLUE)Main Services:$(NC)"
	@echo "  - API: http://localhost/api/v1"
	@echo "  - Health Check: http://localhost/health"
	@echo ""
	@echo "$(BLUE)Monitoring:$(NC)"
	@echo "  - Prometheus: http://localhost:9090"
	@echo "  - Grafana: http://localhost:3001 (admin/admin)"
	@echo ""
	@echo "$(BLUE)Development Tools (dev mode only):$(NC)"
	@echo "  - PgAdmin: http://localhost:5050"
	@echo "  - Redis Commander: http://localhost:8081"
