import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Joi schema
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[property];

    if (!dataToValidate) {
      return next(new ValidationError(`No ${property} data provided`));
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types if possible
    });

    if (error) {
      // Format validation errors
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      logger.warn('Validation failed', {
        requestId: req.id,
        property,
        errors,
        data: dataToValidate
      });

      return next(new ValidationError('Validation failed', errors));
    }

    // Replace request data with validated/sanitized data
    req[property] = value;

    next();
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate request headers
 */
export const validateHeaders = (schema) => validate(schema, 'headers');

/**
 * Validate multiple parts of request
 */
export const validateRequest = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate each part
    for (const [property, schema] of Object.entries(schemas)) {
      const dataToValidate = req[property];

      if (!dataToValidate && schema._flags?.presence === 'required') {
        errors.push({
          field: property,
          message: `${property} is required`,
          type: 'any.required'
        });
        continue;
      }

      if (dataToValidate) {
        const { error, value } = schema.validate(dataToValidate, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });

        if (error) {
          error.details.forEach(detail => {
            errors.push({
              field: `${property}.${detail.path.join('.')}`,
              message: detail.message,
              type: detail.type
            });
          });
        } else {
          // Replace with validated data
          req[property] = value;
        }
      }
    }

    if (errors.length > 0) {
      logger.warn('Request validation failed', {
        requestId: req.id,
        errors,
        url: req.originalUrl
      });

      return next(new ValidationError('Request validation failed', errors));
    }

    next();
  };
};

/**
 * Sanitize input (XSS protection)
 */
export const sanitize = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potential XSS vectors
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }

    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    if (value !== null && typeof value === 'object') {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  };

  // Sanitize body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  // Sanitize params
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * File upload validator
 */
export const validateFile = (options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    fieldName = 'file'
  } = options;

  return (req, res, next) => {
    const file = req.file || req.files?.[fieldName];

    if (!file) {
      if (required) {
        return next(new ValidationError('File is required', [{
          field: fieldName,
          message: 'File upload is required',
          type: 'any.required'
        }]));
      }
      return next();
    }

    // Check file size
    if (file.size > maxSize) {
      return next(new ValidationError('File too large', [{
        field: fieldName,
        message: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
        type: 'file.size'
      }]));
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return next(new ValidationError('Invalid file type', [{
        field: fieldName,
        message: `File type must be one of: ${allowedMimeTypes.join(', ')}`,
        type: 'file.mimetype'
      }]));
    }

    next();
  };
};

/**
 * Pagination validator
 */
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Validate ranges
  if (page < 1) {
    return next(new ValidationError('Invalid page number', [{
      field: 'page',
      message: 'Page must be >= 1',
      type: 'number.min'
    }]));
  }

  if (limit < 1 || limit > 100) {
    return next(new ValidationError('Invalid limit', [{
      field: 'limit',
      message: 'Limit must be between 1 and 100',
      type: 'number.range'
    }]));
  }

  // Attach validated pagination to request
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  next();
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  validateRequest,
  sanitize,
  validateFile,
  validatePagination
};
