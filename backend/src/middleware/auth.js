import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import database from '../config/database.js';

/**
 * Authentication and Authorization Middleware
 */

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Token verification failed');
    }

    // Verify user still exists and is active
    const result = await database.query(
      `SELECT u.id, u.email, u.name, u.status, r.name as role, r.permissions
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is not active');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || []
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    logger.logError(error, { context: 'authentication' });
    next(new UnauthorizedError('Authentication failed'));
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    // Use authenticate middleware if token exists
    return authenticate(req, res, next);
  } catch (error) {
    // Log but don't fail
    logger.warn('Optional auth failed', { error: error.message });
    next();
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      logger.logSecurity('unauthorized_role_access', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });

      return next(
        new ForbiddenError(
          `Access denied. Required role: ${roles.join(' or ')}`,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
};

/**
 * Require specific permission(s)
 */
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];

    const hasPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.logSecurity('unauthorized_permission_access', {
        userId: req.user.id,
        userPermissions,
        requiredPermissions: permissions,
        path: req.path
      });

      return next(
        new ForbiddenError(
          `Access denied. Required permission: ${permissions.join(' or ')}`,
          'INSUFFICIENT_PERMISSION'
        )
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Check if user is affiliate
 */
export const requireAffiliate = async (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  try {
    // Check if user has an active affiliate account
    const result = await database.query(
      `SELECT id, code, status, tier
       FROM affiliates
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return next(new ForbiddenError('Affiliate account required', 'NOT_AFFILIATE'));
    }

    const affiliate = result.rows[0];

    if (affiliate.status !== 'active') {
      return next(
        new ForbiddenError(
          `Affiliate account is ${affiliate.status}`,
          'AFFILIATE_NOT_ACTIVE'
        )
      );
    }

    // Attach affiliate to request
    req.affiliate = {
      id: affiliate.id,
      code: affiliate.code,
      status: affiliate.status,
      tier: affiliate.tier
    };

    next();
  } catch (error) {
    logger.logError(error, { context: 'require_affiliate' });
    next(new ForbiddenError('Failed to verify affiliate status'));
  }
};

/**
 * Check if user owns the resource
 */
export const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Admins bypass ownership check
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    try {
      const resourceId = req.params.id;

      let ownershipQuery;
      switch (resourceType) {
        case 'affiliate':
          ownershipQuery = {
            text: 'SELECT id FROM affiliates WHERE id = $1 AND user_id = $2',
            values: [resourceId, req.user.id]
          };
          break;

        case 'payout':
          ownershipQuery = {
            text: `SELECT p.id FROM payouts p
                   JOIN affiliates a ON p.affiliate_id = a.id
                   WHERE p.id = $1 AND a.user_id = $2`,
            values: [resourceId, req.user.id]
          };
          break;

        case 'subscription':
          ownershipQuery = {
            text: `SELECT s.id FROM subscriptions s
                   JOIN affiliates a ON s.affiliate_id = a.id
                   WHERE s.id = $1 AND a.user_id = $2`,
            values: [resourceId, req.user.id]
          };
          break;

        default:
          return next(new ForbiddenError('Invalid resource type'));
      }

      const result = await database.query(ownershipQuery.text, ownershipQuery.values);

      if (result.rows.length === 0) {
        logger.logSecurity('unauthorized_resource_access', {
          userId: req.user.id,
          resourceType,
          resourceId,
          path: req.path
        });

        return next(
          new ForbiddenError(
            'You do not have permission to access this resource',
            'NOT_OWNER'
          )
        );
      }

      next();
    } catch (error) {
      logger.logError(error, {
        context: 'require_ownership',
        resourceType
      });
      next(new ForbiddenError('Failed to verify resource ownership'));
    }
  };
};

/**
 * API key authentication (for webhooks and external services)
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedError('API key required');
    }

    // Verify API key
    const result = await database.query(
      `SELECT id, name, permissions, rate_limit
       FROM api_keys
       WHERE key_hash = $1 AND status = 'active' AND expires_at > NOW()`,
      [apiKey] // In production, hash the key before comparing
    );

    if (result.rows.length === 0) {
      logger.logSecurity('invalid_api_key', {
        ip: req.ip,
        path: req.path
      });

      throw new UnauthorizedError('Invalid or expired API key');
    }

    const apiKeyData = result.rows[0];

    // Attach API key info to request
    req.apiKey = {
      id: apiKeyData.id,
      name: apiKeyData.name,
      permissions: apiKeyData.permissions || []
    };

    // Update last used
    await database.query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [apiKeyData.id]
    );

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    logger.logError(error, { context: 'api_key_authentication' });
    next(new UnauthorizedError('API key authentication failed'));
  }
};

/**
 * Rate limit by user ID
 */
export const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    // Remove old requests outside window
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      logger.logSecurity('user_rate_limit_exceeded', {
        userId,
        count: validRequests.length,
        limit: maxRequests
      });

      return next(
        new RateLimitError(
          'Too many requests, please slow down',
          windowMs
        )
      );
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, times] of requests.entries()) {
        const valid = times.filter(time => now - time < windowMs);
        if (valid.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, valid);
        }
      }
    }

    next();
  };
};

export default {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAdmin,
  requireAffiliate,
  requireOwnership,
  authenticateApiKey,
  userRateLimit
};
