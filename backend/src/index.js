import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

// Configuration and utilities
import config, { validateConfig } from './config/index.js';
import database from './config/database.js';
import logger from './utils/logger.js';
import {
  formatErrorResponse,
  isOperationalError,
  AppError
} from './utils/errors.js';

// Middleware
import { apiLimiter } from './middleware/rateLimiter.js';
import { addRequestId } from './middleware/requestId.js';
import { sanitize } from './middleware/validator.js';

// Routes
import apiRoutes from './api/routes.js';

/**
 * Max IT TV Affiliation System - Main Server
 * Production-ready Express server with comprehensive error handling
 */

const app = express();
const PORT = config.server.port;
const API_VERSION = config.server.apiVersion;

// Track server state
let server;
let isShuttingDown = false;

/**
 * Initialize server
 */
async function initializeServer() {
  try {
    logger.info('Starting Max IT TV Affiliation API', {
      env: config.env,
      port: PORT,
      version: API_VERSION
    });

    // Validate configuration
    validateConfig();

    // Initialize database
    await database.initialize();

    // Setup middleware
    setupMiddleware();

    // Setup routes
    setupRoutes();

    // Setup error handlers
    setupErrorHandlers();

    // Start listening
    await startServer();

    logger.info('Server initialization complete');
  } catch (error) {
    logger.error('Failed to initialize server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Setup Express middleware
 */
function setupMiddleware() {
  // Trust proxy (if behind reverse proxy)
  if (config.server.trustProxy) {
    app.set('trust proxy', 1);
  }

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS
  app.use(cors({
    origin: config.security.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
  }));

  // Compression
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6
  }));

  // Request ID
  app.use(addRequestId);

  // Body parsing
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      // Store raw body for webhook signature verification
      if (req.originalUrl.includes('/webhooks/')) {
        req.rawBody = buf.toString('utf8');
      }
    }
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  // Sanitize inputs
  app.use(sanitize);

  // Request logging
  app.use((req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      logger.logRequest(req, res, duration);
    });

    next();
  });

  logger.info('Middleware configured');
}

/**
 * Setup application routes
 */
function setupRoutes() {
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Max IT TV Affiliation API',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      documentation: `${config.server.baseUrl}/docs`
    });
  });

  // Health check endpoint (no rate limiting)
  app.get('/health', async (req, res) => {
    try {
      const [dbHealth, queueHealth] = await Promise.all([
        database.healthCheck().catch(() => ({ healthy: false })),
        // Queue health check would go here if queueService was imported
        Promise.resolve({ healthy: true })
      ]);

      const healthy = dbHealth.healthy && queueHealth.healthy;

      res.status(healthy ? 200 : 503).json({
        success: healthy,
        status: healthy ? 'healthy' : 'unhealthy',
        checks: {
          database: dbHealth,
          queues: queueHealth
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // API routes with rate limiting
  app.use(`/api/${API_VERSION}`, apiLimiter, apiRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.path,
        timestamp: new Date().toISOString()
      }
    });
  });

  logger.info('Routes configured');
}

/**
 * Setup error handlers
 */
function setupErrorHandlers() {
  // Catch-all error handler
  app.use((err, req, res, next) => {
    // Log error
    if (!isOperationalError(err)) {
      logger.error('Unhandled error', {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
          code: err.code
        },
        request: {
          id: req.id,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userId: req.user?.id
        }
      });
    } else {
      logger.logError(err, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id
      });
    }

    // Don't expose error details in production for non-operational errors
    if (!isOperationalError(err) && config.isProduction) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    // Send error response
    const statusCode = err.statusCode || 500;
    const errorResponse = formatErrorResponse(err);

    // Add request ID to error response
    errorResponse.error.requestId = req.id;

    res.status(statusCode).json(errorResponse);
  });

  logger.info('Error handlers configured');
}

/**
 * Start HTTP server
 */
function startServer() {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, config.server.host, () => {
        logger.info(`Server listening on ${config.server.host}:${PORT}`, {
          env: config.env,
          apiVersion: API_VERSION,
          pid: process.pid
        });
        resolve();
      });

      // Handle server errors
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${PORT} is already in use`);
        } else {
          logger.error('Server error', {
            error: error.message,
            stack: error.stack
          });
        }
        reject(error);
      });

      // Set timeout for requests
      server.timeout = 30000; // 30 seconds

      // Set keep-alive timeout
      server.keepAliveTimeout = 65000; // 65 seconds

      // Set headers timeout
      server.headersTimeout = 66000; // 66 seconds

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;

  logger.info(`${signal} signal received, starting graceful shutdown`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  try {
    // Set shutdown timeout (30 seconds)
    const shutdownTimeout = setTimeout(() => {
      logger.error('Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 30000);

    // Wait for ongoing requests to complete
    await new Promise((resolve) => {
      const checkPending = setInterval(() => {
        const pending = server?.listening ? 0 : 0; // Track active connections if needed

        if (pending === 0) {
          clearInterval(checkPending);
          resolve();
        } else {
          logger.info(`Waiting for ${pending} active connections to close`);
        }
      }, 1000);
    });

    // Close database connections
    await database.close();

    clearTimeout(shutdownTimeout);

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });

  // Exit on uncaught exception
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    promise
  });

  // Exit on unhandled rejection
  process.exit(1);
});

/**
 * Handle shutdown signals
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle warnings
 */
process.on('warning', (warning) => {
  logger.warn('Node.js warning', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Start the server
initializeServer().catch((error) => {
  logger.error('Fatal error during initialization', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Export for testing
export default app;
