# Max IT TV Affiliation System

A comprehensive multi-level affiliation platform for Max IT TV, featuring payment processing, commission management, subscription tracking, and real-time analytics.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [License](#license)

## Features

### Core Features
- **Multi-Level Affiliate Network**: 3-level commission structure with automatic calculation
- **Payment Processing**: Integration with Orange Money, Wave, MTN MoMo, and Stripe
- **Subscription Management**: Automated subscription lifecycle with trials and renewals
- **Commission System**: Real-time commission calculation and tracking
- **Payout Management**: Automated payout processing with multiple payment methods
- **SMS Notifications**: Automated notifications via Orange SMS and Twilio
- **Real-Time Analytics**: Comprehensive dashboard with metrics and insights

### Technical Features
- **RESTful API**: Well-documented API with OpenAPI/Swagger specs
- **Background Jobs**: Queue-based processing with Bull and Redis
- **Scheduled Tasks**: Automated cron jobs for recurring operations
- **Caching**: Redis-based caching for optimal performance
- **Monitoring**: Prometheus metrics and Grafana dashboards
- **Logging**: Centralized logging with Elasticsearch (optional)
- **Security**: JWT authentication, rate limiting, and security headers

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Load Balancer / Nginx                       │
│                    (Reverse Proxy, SSL, Static Files)                │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┬──────────────────┐
        │                            │                  │
┌───────▼────────┐          ┌────────▼──────┐  ┌───────▼────────┐
│   API Service  │          │ Worker Service │  │ Scheduler Svc  │
│  (Express.js)  │          │  (Bull Queue)  │  │  (node-cron)   │
└───────┬────────┘          └────────┬───────┘  └───────┬────────┘
        │                            │                   │
        └────────────┬───────────────┴───────────────────┘
                     │
        ┌────────────┴────────────┬──────────────┐
        │                         │              │
┌───────▼────────┐      ┌─────────▼──────┐  ┌──▼────────────┐
│   PostgreSQL   │      │     Redis       │  │  Elasticsearch│
│   (Database)   │      │  (Cache/Queue)  │  │    (Logs)     │
└────────────────┘      └─────────────────┘  └───────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Monitoring Stack                              │
│  ┌─────────────┐       ┌──────────────┐       ┌─────────────┐      │
│  │ Prometheus  │──────▶│   Grafana    │       │   Alerts    │      │
│  │  (Metrics)  │       │ (Dashboards) │       │ (Optional)  │      │
│  └─────────────┘       └──────────────┘       └─────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

External Services:
  • Orange Money API (Payment)
  • Wave API (Payment)
  • MTN MoMo API (Payment)
  • Stripe API (Payment)
  • Orange SMS API (Notifications)
  • Twilio API (Notifications)
```

## Prerequisites

### Required Software
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker**: v24.x or higher
- **Docker Compose**: v2.x or higher
- **Git**: v2.x or higher

### Optional (for local development without Docker)
- **PostgreSQL**: v16.x
- **Redis**: v7.x

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 20GB minimum
- **CPU**: 2 cores minimum, 4 cores recommended

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/maxittv/affiliation-system.git
cd affiliation-system
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Environment
NODE_ENV=production

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=maxittv
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# JWT & Security
JWT_SECRET=your_very_secure_jwt_secret_here
SESSION_SECRET=your_session_secret_here
BCRYPT_ROUNDS=12

# Application URLs
API_URL=https://api.yourdomain.com
APP_URL=https://yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Payment Providers
ORANGE_MONEY_API_KEY=your_orange_money_api_key
ORANGE_MONEY_API_SECRET=your_orange_money_api_secret
ORANGE_MONEY_MERCHANT_ID=your_merchant_id

WAVE_API_KEY=your_wave_api_key
WAVE_SECRET_KEY=your_wave_secret_key

MTN_MOMO_API_KEY=your_mtn_api_key
MTN_MOMO_API_SECRET=your_mtn_api_secret
MTN_MOMO_USER_ID=your_mtn_user_id

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# SMS Providers
ORANGE_SMS_API_KEY=your_orange_sms_api_key
ORANGE_SMS_API_SECRET=your_orange_sms_api_secret
ORANGE_SMS_SENDER_ID=MaxITTV

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Commission Settings
COMMISSION_DIRECT_RATE=0.10
COMMISSION_LEVEL2_RATE=0.05
COMMISSION_LEVEL3_RATE=0.03
MINIMUM_PAYOUT=10000
PAYOUT_DAY=1

# Grafana (optional)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=change_this_password

# Monitoring
MONITORING_ENABLED=true

# Logging (optional)
ELASTICSEARCH_NODE=http://elasticsearch:9200
LOG_LEVEL=info
```

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

### 4. Verify Installation

```bash
# Check API health
curl http://localhost/health

# Check Prometheus
curl http://localhost:9090/-/healthy

# Access Grafana
open http://localhost:3001
```

## Configuration

### Database Migration

The database schema is automatically applied on first startup. To manually run migrations:

```bash
# Run migrations
docker-compose exec api npm run migrate

# Run seeds
docker-compose exec api npm run seed
```

### Default Admin Account

**Email**: admin@maxittv.com
**Password**: Admin@123

**⚠️ IMPORTANT**: Change this password immediately in production!

### Payment Provider Configuration

Each payment provider requires specific configuration:

#### Orange Money
1. Register at [Orange Developer Portal](https://developer.orange.com)
2. Create a new application
3. Get API credentials (API Key, Secret, Merchant ID)
4. Update `.env` with credentials

#### Wave
1. Register at [Wave Developer Portal](https://developer.wave.com)
2. Create API credentials
3. Update `.env` with credentials

#### MTN MoMo
1. Register at [MTN MoMo Developer Portal](https://momodeveloper.mtn.com)
2. Subscribe to Collections product
3. Create API user and credentials
4. Update `.env` with credentials

#### Stripe
1. Register at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys from the Developers section
3. Set up webhooks
4. Update `.env` with credentials

### SMS Provider Configuration

#### Orange SMS
1. Use the same developer account as Orange Money
2. Subscribe to SMS API
3. Get credentials and sender ID
4. Update `.env`

#### Twilio
1. Register at [Twilio Console](https://console.twilio.com)
2. Get Account SID and Auth Token
3. Get a phone number
4. Update `.env`

## Running the Application

### Production Mode

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart api

# View logs
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f scheduler
```

### Development Mode

```bash
# Start with development configuration
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Watch logs for all services
docker-compose logs -f
```

### With Elasticsearch (Optional)

```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Or start all services including Elasticsearch
docker-compose --profile full up -d
```

### Scaling Services

```bash
# Scale worker service
docker-compose up -d --scale worker=3

# Scale API service (requires load balancer configuration)
docker-compose up -d --scale api=2
```

## API Documentation

### Base URL
```
Production: https://api.yourdomain.com/api/v1
Development: http://localhost/api/v1
```

### Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new affiliate
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/verify-email` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

#### Affiliates
- `GET /affiliates/me` - Get current affiliate profile
- `PUT /affiliates/me` - Update profile
- `GET /affiliates/stats` - Get statistics
- `GET /affiliates/network` - Get network hierarchy
- `POST /affiliates/qr-code` - Generate QR code

#### Subscriptions
- `POST /subscriptions` - Create subscription
- `GET /subscriptions` - List subscriptions
- `GET /subscriptions/:id` - Get subscription details
- `PUT /subscriptions/:id/cancel` - Cancel subscription

#### Commissions
- `GET /commissions` - List commissions
- `GET /commissions/summary` - Get commission summary

#### Payouts
- `POST /payouts/request` - Request payout
- `GET /payouts` - List payouts
- `GET /payouts/:id` - Get payout details

#### Admin
- `GET /admin/affiliates` - List all affiliates
- `PUT /admin/affiliates/:id/status` - Update affiliate status
- `GET /admin/dashboard` - Get admin dashboard
- `POST /admin/offers` - Create offer
- `GET /admin/reports` - Generate reports

### Webhooks

Configure webhooks for payment providers:

- **Orange Money**: `https://api.yourdomain.com/api/v1/webhooks/orange-money`
- **Wave**: `https://api.yourdomain.com/api/v1/webhooks/wave`
- **MTN MoMo**: `https://api.yourdomain.com/api/v1/webhooks/mtn-momo`
- **Stripe**: `https://api.yourdomain.com/api/v1/webhooks/stripe`

## Development

### Local Development Setup

```bash
# Install backend dependencies
cd backend
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/
│   │   │   ├── routes.js
│   │   │   └── schemas/
│   │   ├── config/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── index.js (API server)
│   │   ├── worker.js (Background worker)
│   │   └── scheduler.js (Cron scheduler)
│   ├── migrations/
│   ├── seeds/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── docker/
│   ├── grafana/
│   ├── nginx/
│   └── prometheus/
├── docker-compose.yml
└── README.md
```

### Database Migrations

```bash
# Create a new migration
npm run migrate:create -- migration_name

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback

# Reset database (⚠️ WARNING: Destroys all data)
npm run migrate:reset
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=affiliates
```

## Deployment

### Production Checklist

- [ ] Update all default passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Test payment provider webhooks
- [ ] Test SMS delivery
- [ ] Review rate limiting settings
- [ ] Configure CORS origins
- [ ] Set up domain DNS
- [ ] Test disaster recovery procedure

### SSL/TLS Configuration

1. Obtain SSL certificates (Let's Encrypt recommended):

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d api.yourdomain.com
```

2. Update `docker-compose.yml` to mount certificates:

```yaml
nginx:
  volumes:
    - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/ssl:ro
```

3. Uncomment HTTPS server block in `docker/nginx/nginx.conf`

### Backup Strategy

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres maxittv > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T postgres psql -U postgres maxittv < backup_20240101_120000.sql

# Backup volumes
docker run --rm -v maxittv-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data.tar.gz /data
```

### Updates and Maintenance

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec api npm run migrate

# Check service health
docker-compose ps
```

## Monitoring

### Grafana Dashboards

Access Grafana at `http://localhost:3001`

**Default Credentials**:
- Username: `admin`
- Password: `admin` (change immediately!)

**Pre-configured Dashboards**:
- **Main Dashboard**: Overall system health and metrics
- **API Performance**: Request rates, response times, error rates
- **Database Metrics**: Connection pool, query performance
- **Queue Metrics**: Job processing rates and failures
- **Business Metrics**: Affiliates, subscriptions, commissions

### Prometheus Metrics

Access Prometheus at `http://localhost:9090`

**Key Metrics**:
- `http_request_duration_ms` - HTTP request duration histogram
- `http_request_duration_ms_count` - Total HTTP requests
- `nodejs_heap_size_used_bytes` - Node.js memory usage
- `pg_pool_*` - Database connection pool metrics
- `queue_*` - Queue processing metrics
- `payment_*` - Payment processing metrics
- `commission_*` - Commission calculation metrics

### Logs

```bash
# View API logs
docker-compose logs -f api

# View worker logs
docker-compose logs -f worker

# View all logs
docker-compose logs -f

# Search logs
docker-compose logs api | grep ERROR

# Export logs
docker-compose logs --no-color > logs.txt
```

### Alerts

Configure alerts in `docker/prometheus/alerts/` directory.

**Pre-configured Alerts**:
- High error rate (>5%)
- High response time (>2s)
- Service down
- High memory usage (>90%)
- Database connection pool exhaustion
- High payment failure rate
- Queue processing lag

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify credentials in .env file
grep DB_ .env

# Test connection
docker-compose exec postgres psql -U postgres -d maxittv
```

#### 2. Redis Connection Failed

```bash
# Check if Redis is running
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test connection
docker-compose exec redis redis-cli ping
```

#### 3. API Not Responding

```bash
# Check API health
curl http://localhost/health

# Check API logs
docker-compose logs api

# Restart API service
docker-compose restart api
```

#### 4. Payment Webhook Not Working

```bash
# Check webhook logs
docker-compose logs api | grep webhook

# Verify webhook URL is accessible
curl -X POST http://localhost/api/v1/webhooks/test

# Check payment provider webhook configuration
# Ensure webhook URL is publicly accessible (use ngrok for testing)
```

#### 5. Queue Jobs Not Processing

```bash
# Check worker logs
docker-compose logs worker

# Check Redis connection
docker-compose exec redis redis-cli INFO

# Check queue status
docker-compose exec api node -e "require('./src/services/queueService').getQueueStats()"

# Restart worker
docker-compose restart worker
```

### Performance Optimization

#### Database
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM subscriptions WHERE status = 'active';

-- Update statistics
ANALYZE;
```

#### Redis
```bash
# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Monitor commands
docker-compose exec redis redis-cli MONITOR

# Check slow log
docker-compose exec redis redis-cli SLOWLOG GET 10
```

## Security

### Security Best Practices

1. **Change Default Passwords**: Update all default passwords immediately
2. **Use Strong JWT Secrets**: Generate cryptographically secure secrets
3. **Enable HTTPS**: Always use SSL/TLS in production
4. **Configure CORS**: Restrict CORS to specific domains
5. **Rate Limiting**: Implement appropriate rate limits
6. **Input Validation**: All inputs are validated using Joi schemas
7. **SQL Injection Prevention**: Use parameterized queries
8. **XSS Prevention**: Sanitize all user inputs
9. **CSRF Protection**: Implement CSRF tokens for state-changing operations
10. **Security Headers**: All security headers are configured in Nginx

### Security Headers

The following security headers are automatically set:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security` (when HTTPS is enabled)

### Reporting Security Issues

If you discover a security vulnerability, please email security@maxittv.com instead of using the public issue tracker.

## License

Copyright © 2024 Max IT TV. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.

---

## Support

For support, email support@maxittv.com or contact us through our website.

## Contributing

This is a private project. Contributions are managed internally.

## Acknowledgments

- Node.js and Express.js communities
- PostgreSQL team
- Redis team
- All open-source contributors

---

**Built with ❤️ by Max IT TV Team**
