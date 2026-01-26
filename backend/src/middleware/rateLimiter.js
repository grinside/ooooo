import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { RateLimitError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Create Redis client for rate limiting
 */
const createRedisClient = () => {
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || 6379)
    },
    password: process.env.REDIS_PASSWORD,
    database: 2 // Separate DB for rate limiting
  });

  client.on('error', (err) => {
    logger.error('Redis rate limiter error', { error: err.message });
  });

  client.connect().catch(err => {
    logger.error('Failed to connect Redis for rate limiting', { error: err.message });
  });

  return client;
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  const error = new RateLimitError(
    'Too many requests from this IP, please try again later',
    req.rateLimit.resetTime
  );

  logger.logSecurity('rate_limit_exceeded', {
    ip: req.ip,
    path: req.path,
    resetTime: req.rateLimit.resetTime
  });

  res.status(429).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      limit: req.rateLimit.limit,
      current: req.rateLimit.current
    }
  });
};

/**
 * Skip successful requests for certain endpoints
 */
const skipSuccessfulRequests = (req, res) => {
  // Don't count successful requests for read operations
  return res.statusCode < 400 && req.method === 'GET';
};

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:api:'
    })
  })
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: rateLimitHandler,
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:auth:'
    })
  })
});

/**
 * Rate limiter for OTP requests
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per hour
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use phone number as key if available
    return req.body.phone || req.ip;
  },
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:otp:'
    })
  })
});

/**
 * Rate limiter for registration
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: rateLimitHandler,
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:register:'
    })
  })
});

/**
 * Rate limiter for payment operations
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 payment requests per minute
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use user ID or IP
    return req.user?.id || req.ip;
  },
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:payment:'
    })
  })
});

/**
 * Rate limiter for payout requests
 */
export const payoutLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 payout requests per day
  message: 'Maximum payout requests reached for today',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `user:${req.user?.id || req.ip}`;
  },
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:payout:'
    })
  })
});

/**
 * Public API rate limiter (more restrictive)
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || 20),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:public:'
    })
  })
});

/**
 * Admin API rate limiter (more lenient)
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: 'Too many admin requests',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `admin:${req.user?.id || req.ip}`;
  },
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:admin:'
    })
  })
});

/**
 * Webhook rate limiter
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhooks per minute
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use webhook source IP or signature
    return req.get('x-webhook-signature') || req.ip;
  },
  ...(process.env.REDIS_HOST && {
    store: new RedisStore({
      client: createRedisClient(),
      prefix: 'rl:webhook:'
    })
  })
});

/**
 * Create custom rate limiter
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
  };

  if (process.env.REDIS_HOST) {
    defaultOptions.store = new RedisStore({
      client: createRedisClient(),
      prefix: options.prefix || 'rl:custom:'
    });
  }

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

export default {
  apiLimiter,
  authLimiter,
  otpLimiter,
  registerLimiter,
  paymentLimiter,
  payoutLimiter,
  publicLimiter,
  adminLimiter,
  webhookLimiter,
  createRateLimiter
};
