# Quick Start Guide

Get the Max IT TV Affiliation System up and running in minutes!

## Prerequisites

- Docker and Docker Compose installed
- 4GB RAM minimum
- 20GB disk space

## 5-Minute Setup

### 1. Clone and Navigate

```bash
git clone https://github.com/maxittv/affiliation-system.git
cd affiliation-system
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

**Minimum required changes in `.env`:**
```env
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_characters
SESSION_SECRET=your_session_secret_minimum_32_characters
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Verify Installation

```bash
# Check API health
curl http://localhost/health

# Run health check script
./scripts/health-check.sh
```

### 5. Access Services

- **API**: http://localhost/api/v1
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### 6. Login

**Default Admin Account:**
- Email: `admin@maxittv.com`
- Password: `Admin@123`

**⚠️ IMPORTANT:** Change this password immediately!

## Development Setup

For development with hot-reload:

```bash
# Start with development configuration
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Additional dev tools will be available:
# - PgAdmin: http://localhost:5050
# - Redis Commander: http://localhost:8081
```

## Testing the API

```bash
# Register a new affiliate
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+221700000001",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "countryCode": "SN"
  }'

# Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@maxittv.com",
    "password": "Admin@123"
  }'
```

## Common Commands

```bash
# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart api

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Backup database
./scripts/backup.sh

# Restore database
./scripts/restore.sh backups/backup_YYYYMMDD_HHMMSS.sql.gz

# Run migrations
docker-compose exec api npm run migrate

# Run seeds
docker-compose exec api npm run seed

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d maxittv

# Access Redis CLI
docker-compose exec redis redis-cli

# Check system health
./scripts/health-check.sh
```

## Next Steps

1. **Configure Payment Providers**: Add your payment provider credentials in `.env`
2. **Configure SMS Providers**: Add your SMS provider credentials for notifications
3. **Set up SSL/TLS**: Configure SSL certificates for production
4. **Customize Offers**: Update subscription offers in the database
5. **Set up Monitoring**: Configure Grafana dashboards and alerts
6. **Review Security**: Change all default passwords and review security settings

## Troubleshooting

### Services won't start

```bash
# Check for port conflicts
docker-compose ps
netstat -tuln | grep -E ':(80|443|3000|5432|6379|9090|3001)'

# Check logs for errors
docker-compose logs
```

### Database connection errors

```bash
# Check database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify environment variables
docker-compose exec api env | grep DB_
```

### Cannot access API

```bash
# Check API is running
docker-compose ps api

# Check API logs
docker-compose logs api

# Test API directly
curl http://localhost/health
```

## Getting Help

- **Documentation**: See [README.md](README.md)
- **API Docs**: http://localhost/api/v1/docs (when running)
- **Support**: support@maxittv.com

## Production Deployment

For production deployment, see the [Deployment](#deployment) section in README.md.

**Important production steps:**
1. Use strong passwords for all services
2. Configure SSL/TLS certificates
3. Set up firewall rules
4. Configure backup strategy
5. Set up monitoring alerts
6. Review and update all security settings
7. Test disaster recovery procedures

---

**Happy coding!** 🚀
