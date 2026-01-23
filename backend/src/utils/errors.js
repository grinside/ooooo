/**
 * Base error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(message, 400, true, code);
    this.name = 'BadRequestError';
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, true, code);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, true, code);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, true, code);
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, 409, true, code);
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = [], code = 'VALIDATION_ERROR') {
    super(message, 422, true, code);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null, code = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, true, code);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(message, 500, false, code);
    this.name = 'InternalServerError';
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, true, code);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Payment specific errors
 */
export class PaymentError extends AppError {
  constructor(message, code = 'PAYMENT_ERROR', provider = null) {
    super(message, 402, true, code);
    this.name = 'PaymentError';
    this.provider = provider;
  }
}

/**
 * Commission calculation errors
 */
export class CommissionError extends AppError {
  constructor(message, code = 'COMMISSION_ERROR') {
    super(message, 500, true, code);
    this.name = 'CommissionError';
  }
}

/**
 * Fraud detection errors
 */
export class FraudDetectionError extends AppError {
  constructor(message, code = 'FRAUD_DETECTED', riskScore = null) {
    super(message, 403, true, code);
    this.name = 'FraudDetectionError';
    this.riskScore = riskScore;
  }
}

/**
 * Insufficient balance error
 */
export class InsufficientBalanceError extends AppError {
  constructor(message = 'Insufficient balance', available = null, required = null) {
    super(message, 402, true, 'INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
    this.available = available;
    this.required = required;
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, false, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends AppError {
  constructor(message, service, statusCode = 502, code = 'EXTERNAL_API_ERROR') {
    super(message, statusCode, true, code);
    this.name = 'ExternalAPIError';
    this.service = service;
  }
}

/**
 * Async error wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error response formatter
 */
export const formatErrorResponse = (error) => {
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: error.timestamp || new Date().toISOString()
    }
  };

  // Add validation errors if present
  if (error.errors && error.errors.length > 0) {
    response.error.details = error.errors;
  }

  // Add retry-after for rate limit errors
  if (error.retryAfter) {
    response.error.retryAfter = error.retryAfter;
  }

  // Add available/required for insufficient balance
  if (error.available !== undefined) {
    response.error.available = error.available;
    response.error.required = error.required;
  }

  // Don't expose stack traces in production
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
};

/**
 * Check if error is operational (expected)
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};
