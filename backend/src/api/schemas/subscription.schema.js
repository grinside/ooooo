import Joi from 'joi';

/**
 * Create subscription schema
 */
export const createSubscription = Joi.object({
  customerName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Customer name must be at least 2 characters',
      'string.max': 'Customer name must not exceed 100 characters',
      'any.required': 'Customer name is required'
    }),

  customerPhone: Joi.string()
    .pattern(/^\+[1-9]\d{9,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be in international format (e.g., +221771234567)',
      'any.required': 'Customer phone number is required'
    }),

  customerEmail: Joi.string()
    .email()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  offerId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Offer ID must be a number',
      'number.positive': 'Offer ID must be positive',
      'any.required': 'Offer ID is required'
    }),

  affiliateCode: Joi.string()
    .pattern(/^[A-Z0-9]{6,12}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid affiliate code format',
      'any.required': 'Affiliate code is required'
    }),

  country: Joi.string()
    .length(2)
    .uppercase()
    .valid('SN', 'CI', 'ML', 'BF', 'CM', 'GN', 'MG', 'CD', 'MA', 'TN', 'NE', 'BJ', 'TG', 'GA', 'CG', 'RW', 'DJ')
    .required()
    .messages({
      'string.length': 'Country code must be 2 characters',
      'any.only': 'Invalid country code',
      'any.required': 'Country is required'
    }),

  trackingSource: Joi.string()
    .valid('qr_scan', 'link', 'direct')
    .optional()
    .default('direct'),

  metadata: Joi.object().optional()
});

/**
 * Pay subscription schema
 */
export const paySubscription = Joi.object({
  paymentProvider: Joi.string()
    .valid('orange_money', 'wave', 'mtn_momo', 'stripe')
    .required()
    .messages({
      'any.only': 'Invalid payment provider',
      'any.required': 'Payment provider is required'
    }),

  paymentPhone: Joi.string()
    .pattern(/^\+[1-9]\d{9,14}$/)
    .when('paymentProvider', {
      is: Joi.string().valid('orange_money', 'wave', 'mtn_momo'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.pattern.base': 'Payment phone must be in international format',
      'any.required': 'Payment phone is required for mobile money'
    }),

  returnUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Return URL must be a valid URL'
    })
});

/**
 * Get subscription status schema (params)
 */
export const getSubscriptionStatus = Joi.object({
  reference: Joi.string()
    .pattern(/^SUB-[A-Z0-9]{12}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid subscription reference format',
      'any.required': 'Subscription reference is required'
    })
});

/**
 * Cancel subscription schema
 */
export const cancelSubscription = Joi.object({
  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason must not exceed 500 characters'
    })
});

/**
 * Renew subscription schema
 */
export const renewSubscription = Joi.object({
  paymentProvider: Joi.string()
    .valid('orange_money', 'wave', 'mtn_momo', 'stripe')
    .required()
    .messages({
      'any.only': 'Invalid payment provider',
      'any.required': 'Payment provider is required'
    }),

  paymentPhone: Joi.string()
    .pattern(/^\+[1-9]\d{9,14}$/)
    .when('paymentProvider', {
      is: Joi.string().valid('orange_money', 'wave', 'mtn_momo'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
});

/**
 * Query subscriptions schema
 */
export const querySubscriptions = Joi.object({
  status: Joi.string()
    .valid('pending', 'active', 'expired', 'cancelled', 'suspended')
    .optional(),

  affiliateId: Joi.number()
    .integer()
    .positive()
    .optional(),

  customerId: Joi.number()
    .integer()
    .positive()
    .optional(),

  offerId: Joi.number()
    .integer()
    .positive()
    .optional(),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional(),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  sortBy: Joi.string()
    .valid('created_at', 'start_date', 'end_date', 'amount')
    .optional()
    .default('created_at'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
});

/**
 * Subscription ID param schema
 */
export const subscriptionIdParam = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Subscription ID must be a number',
      'number.positive': 'Subscription ID must be positive',
      'any.required': 'Subscription ID is required'
    })
});

export default {
  createSubscription,
  paySubscription,
  getSubscriptionStatus,
  cancelSubscription,
  renewSubscription,
  querySubscriptions,
  subscriptionIdParam
};
