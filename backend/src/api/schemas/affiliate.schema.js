import Joi from 'joi';

/**
 * Affiliate registration schema
 */
export const registerAffiliate = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required'
    }),

  phone: Joi.string()
    .pattern(/^\+[1-9]\d{9,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be in international format (e.g., +221771234567)',
      'any.required': 'Phone number is required'
    }),

  email: Joi.string()
    .email()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Please provide a valid email address'
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

  sponsorCode: Joi.string()
    .pattern(/^[A-Z0-9]{6,12}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid sponsor code format'
    }),

  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'PIN must be exactly 4 digits',
      'any.required': 'PIN is required'
    }),

  bankAccount: Joi.object({
    accountNumber: Joi.string().optional(),
    accountName: Joi.string().optional(),
    bankName: Joi.string().optional(),
    provider: Joi.string().valid('orange_money', 'wave', 'mtn_momo', 'bank').optional()
  }).optional()
});

/**
 * Affiliate login schema
 */
export const loginAffiliate = Joi.object({
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{9,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be in international format',
      'any.required': 'Phone number is required'
    }),

  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'PIN must be 4 digits',
      'any.required': 'PIN is required'
    })
});

/**
 * OTP request schema
 */
export const requestOTP = Joi.object({
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{9,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be in international format',
      'any.required': 'Phone number is required'
    }),

  type: Joi.string()
    .valid('registration', 'login', 'verification')
    .default('verification')
});

/**
 * OTP verification schema
 */
export const verifyOTP = Joi.object({
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{9,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be in international format',
      'any.required': 'Phone number is required'
    }),

  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP code must be 6 digits',
      'any.required': 'OTP code is required'
    })
});

/**
 * Update affiliate profile schema
 */
export const updateAffiliate = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),

  email: Joi.string()
    .email()
    .optional()
    .allow(null, ''),

  bankAccount: Joi.object({
    accountNumber: Joi.string().required(),
    accountName: Joi.string().required(),
    bankName: Joi.string().optional(),
    provider: Joi.string().valid('orange_money', 'wave', 'mtn_momo', 'bank').required()
  }).optional(),

  notificationSettings: Joi.object({
    sms: Joi.boolean().optional(),
    email: Joi.boolean().optional(),
    push: Joi.boolean().optional()
  }).optional()
}).min(1);

/**
 * Update PIN schema
 */
export const updatePin = Joi.object({
  currentPin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Current PIN must be 4 digits',
      'any.required': 'Current PIN is required'
    }),

  newPin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'New PIN must be 4 digits',
      'any.required': 'New PIN is required'
    })
});

/**
 * Get affiliate by code schema (params)
 */
export const getByCode = Joi.object({
  code: Joi.string()
    .pattern(/^[A-Z0-9]{6,12}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid affiliate code format',
      'any.required': 'Affiliate code is required'
    })
});

/**
 * Date range query schema
 */
export const dateRangeQuery = Joi.object({
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format'
    }),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),

  period: Joi.string()
    .valid('today', 'yesterday', 'week', 'month', 'year')
    .optional()
});

/**
 * Pagination query schema
 */
export const paginationQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),

  sortBy: Joi.string()
    .valid('created_at', 'name', 'total_commission', 'network_size')
    .optional()
    .default('created_at'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
});

export default {
  registerAffiliate,
  loginAffiliate,
  requestOTP,
  verifyOTP,
  updateAffiliate,
  updatePin,
  getByCode,
  dateRangeQuery,
  paginationQuery
};
