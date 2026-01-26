import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

/**
 * Application Configuration
 * Centralized configuration for the entire application
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    apiVersion: process.env.API_VERSION || 'v1',
    baseUrl: process.env.API_URL || 'http://localhost:3000',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
    trustProxy: process.env.TRUST_PROXY === 'true'
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'maxittv',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10')
    },
    ssl: process.env.DB_SSL === 'true',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000')
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'maxittv:',
    ttl: parseInt(process.env.REDIS_TTL || '3600'), // 1 hour
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false
  },

  // Queue (Bull/Redis)
  queue: {
    host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT || '6379'),
    password: process.env.QUEUE_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.QUEUE_REDIS_DB || '1')
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'maxittv-affiliation',
    audience: process.env.JWT_AUDIENCE || 'maxittv-api'
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:3000'],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },

  // Payment Providers
  payment: {
    orangeMoney: {
      apiKey: process.env.ORANGE_MONEY_API_KEY,
      apiSecret: process.env.ORANGE_MONEY_API_SECRET,
      merchantId: process.env.ORANGE_MONEY_MERCHANT_ID,
      baseUrl: process.env.ORANGE_MONEY_BASE_URL || 'https://api.orange.com/orange-money-webpay/dev/v1',
      enabled: !!process.env.ORANGE_MONEY_API_KEY
    },
    wave: {
      apiKey: process.env.WAVE_API_KEY,
      secretKey: process.env.WAVE_SECRET_KEY,
      baseUrl: process.env.WAVE_BASE_URL || 'https://api.wave.com/v1',
      enabled: !!process.env.WAVE_API_KEY
    },
    mtnMomo: {
      apiKey: process.env.MTN_MOMO_API_KEY,
      apiSecret: process.env.MTN_MOMO_API_SECRET,
      userId: process.env.MTN_MOMO_USER_ID,
      baseUrl: process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
      enabled: !!process.env.MTN_MOMO_API_KEY
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      enabled: !!process.env.STRIPE_SECRET_KEY
    }
  },

  // SMS Providers
  sms: {
    orange: {
      apiKey: process.env.ORANGE_SMS_API_KEY,
      apiSecret: process.env.ORANGE_SMS_API_SECRET,
      senderId: process.env.ORANGE_SMS_SENDER_ID || 'MaxITTV',
      baseUrl: process.env.ORANGE_SMS_BASE_URL || 'https://api.orange.com/smsmessaging/v1',
      enabled: !!process.env.ORANGE_SMS_API_KEY
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      enabled: !!process.env.TWILIO_ACCOUNT_SID
    }
  },

  // Commission Settings
  commission: {
    directRate: parseFloat(process.env.COMMISSION_DIRECT_RATE || '0.10'), // 10%
    level2Rate: parseFloat(process.env.COMMISSION_LEVEL2_RATE || '0.05'), // 5%
    level3Rate: parseFloat(process.env.COMMISSION_LEVEL3_RATE || '0.03'), // 3%
    minimumPayout: parseFloat(process.env.MINIMUM_PAYOUT || '10000'), // 10,000 XOF
    payoutDay: parseInt(process.env.PAYOUT_DAY || '1'), // 1st of month
    processingFee: parseFloat(process.env.COMMISSION_PROCESSING_FEE || '0.02') // 2%
  },

  // Subscription Settings
  subscription: {
    trialDays: parseInt(process.env.SUBSCRIPTION_TRIAL_DAYS || '7'),
    reminderDaysBefore: parseInt(process.env.SUBSCRIPTION_REMINDER_DAYS || '3'),
    gracePeriodDays: parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS || '2'),
    autoRenew: process.env.SUBSCRIPTION_AUTO_RENEW === 'true'
  },

  // Affiliate Settings
  affiliate: {
    codeLength: parseInt(process.env.AFFILIATE_CODE_LENGTH || '8'),
    minWithdrawal: parseFloat(process.env.AFFILIATE_MIN_WITHDRAWAL || '10000'), // 10,000 XOF
    maxNetworkDepth: parseInt(process.env.AFFILIATE_MAX_NETWORK_DEPTH || '3'),
    verificationRequired: process.env.AFFILIATE_VERIFICATION_REQUIRED !== 'false'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || '/var/log/maxittv',
    elasticsearch: {
      node: process.env.ELASTICSEARCH_NODE,
      index: process.env.ELASTICSEARCH_INDEX || 'maxittv-logs',
      enabled: !!process.env.ELASTICSEARCH_NODE
    }
  },

  // External Services
  external: {
    maxITTV: {
      apiUrl: process.env.MAXITTV_API_URL,
      apiKey: process.env.MAXITTV_API_KEY,
      enabled: !!process.env.MAXITTV_API_URL
    }
  },

  // File Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'), // 5MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
    destination: process.env.UPLOAD_DESTINATION || './uploads'
  },

  // Cache
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600') // 10 minutes
  },

  // Monitoring
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000') // 1 minute
  },

  // Features Flags
  features: {
    qrCodes: process.env.FEATURE_QR_CODES !== 'false',
    multiLevelCommission: process.env.FEATURE_MULTI_LEVEL_COMMISSION !== 'false',
    autoPayouts: process.env.FEATURE_AUTO_PAYOUTS === 'true',
    smsNotifications: process.env.FEATURE_SMS_NOTIFICATIONS !== 'false',
    emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true'
  }
};

/**
 * Validate required configuration
 */
export const validateConfig = () => {
  const required = [
    'JWT_SECRET',
    'DB_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && config.isProduction) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about missing payment providers in production
  if (config.isProduction) {
    const hasPaymentProvider =
      config.payment.orangeMoney.enabled ||
      config.payment.wave.enabled ||
      config.payment.mtnMomo.enabled ||
      config.payment.stripe.enabled;

    if (!hasPaymentProvider) {
      console.warn('WARNING: No payment provider configured!');
    }

    const hasSMSProvider =
      config.sms.orange.enabled ||
      config.sms.twilio.enabled;

    if (!hasSMSProvider) {
      console.warn('WARNING: No SMS provider configured!');
    }
  }
};

export default config;
