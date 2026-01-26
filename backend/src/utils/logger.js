import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    )
  })
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logPath = process.env.LOG_FILE_PATH || '/var/log/maxittv';

  transports.push(
    new winston.transports.File({
      filename: `${logPath}/error.log`,
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    new winston.transports.File({
      filename: `${logPath}/combined.log`,
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 10485760,
      maxFiles: 20
    })
  );

  // Add Elasticsearch transport if configured
  if (process.env.ELASTICSEARCH_NODE) {
    transports.push(
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_NODE,
          maxRetries: 5,
          requestTimeout: 10000
        },
        index: process.env.ELASTICSEARCH_INDEX || 'maxittv-logs',
        dataStream: true,
        transformer: (logData) => {
          return {
            '@timestamp': new Date().toISOString(),
            severity: logData.level,
            message: logData.message,
            fields: logData.meta,
            environment: process.env.NODE_ENV
          };
        }
      })
    );
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: 'maxittv-affiliation-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false
});

// Add helper methods for structured logging
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.id
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    ...context
  });
};

logger.logPayment = (action, data) => {
  logger.info(`Payment ${action}`, {
    category: 'payment',
    action,
    ...data
  });
};

logger.logCommission = (action, data) => {
  logger.info(`Commission ${action}`, {
    category: 'commission',
    action,
    ...data
  });
};

logger.logAffiliate = (action, data) => {
  logger.info(`Affiliate ${action}`, {
    category: 'affiliate',
    action,
    ...data
  });
};

logger.logSecurity = (action, data) => {
  logger.warn(`Security ${action}`, {
    category: 'security',
    action,
    ...data
  });
};

// Log unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });

  // Exit process after logging
  process.exit(1);
});

export default logger;
