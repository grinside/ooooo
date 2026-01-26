import { randomUUID } from 'crypto';

/**
 * Request ID middleware
 * Generates or extracts a unique request ID for tracking and logging
 */
export const requestId = (req, res, next) => {
  // Use existing request ID from header if present, otherwise generate new one
  const requestId = req.get('X-Request-ID') ||
                    req.get('X-Correlation-ID') ||
                    randomUUID();

  // Attach to request object
  req.id = requestId;

  // Set response header
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * Request timing middleware
 * Tracks request duration for performance monitoring
 */
export const requestTimer = (req, res, next) => {
  req.startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to calculate duration
  res.end = function(...args) {
    req.duration = Date.now() - req.startTime;

    // Set response header with duration
    res.setHeader('X-Response-Time', `${req.duration}ms`);

    // Call original end
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Request logger middleware
 * Logs all incoming requests with metadata
 */
export const requestLogger = (logger) => {
  return (req, res, next) => {
    // Log request
    logger.info('Incoming request', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    });

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      // Log response
      logger.logRequest(req, res, req.duration || 0);

      // Call original send
      originalSend.apply(res, arguments);
    };

    next();
  };
};

export default requestId;
