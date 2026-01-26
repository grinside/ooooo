import Joi from 'joi';

/**
 * Admin login schema
 */
export const adminLogin = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    })
});

/**
 * Verify affiliate schema (admin)
 */
export const verifyAffiliate = Joi.object({
  verified: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Verified status is required'
    }),

  notes: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
});

/**
 * Suspend affiliate schema (admin)
 */
export const suspendAffiliate = Joi.object({
  suspended: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Suspended status is required'
    }),

  reason: Joi.string()
    .when('suspended', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .max(500)
    .messages({
      'any.required': 'Reason is required for suspension',
      'string.max': 'Reason must not exceed 500 characters'
    })
});

/**
 * Create offer schema (admin)
 */
export const createOffer = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Offer name must be at least 2 characters',
      'string.max': 'Offer name must not exceed 100 characters',
      'any.required': 'Offer name is required'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .allow(null, ''),

  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
    }),

  currency: Joi.string()
    .valid('XOF', 'XAF', 'GNF', 'MGA', 'CDF', 'MAD', 'TND', 'RWF', 'DJF')
    .required()
    .messages({
      'any.only': 'Invalid currency',
      'any.required': 'Currency is required'
    }),

  duration: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.positive': 'Duration must be positive',
      'any.required': 'Duration in days is required'
    }),

  features: Joi.array()
    .items(Joi.string())
    .optional(),

  isActive: Joi.boolean()
    .default(true),

  countries: Joi.array()
    .items(Joi.string().length(2).uppercase())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one country is required',
      'any.required': 'Countries are required'
    }),

  maxDevices: Joi.number()
    .integer()
    .positive()
    .optional(),

  isPopular: Joi.boolean()
    .default(false)
});

/**
 * Update offer schema (admin)
 */
export const updateOffer = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),

  description: Joi.string()
    .max(1000)
    .optional()
    .allow(null, ''),

  price: Joi.number()
    .positive()
    .optional(),

  duration: Joi.number()
    .integer()
    .positive()
    .optional(),

  features: Joi.array()
    .items(Joi.string())
    .optional(),

  isActive: Joi.boolean()
    .optional(),

  countries: Joi.array()
    .items(Joi.string().length(2).uppercase())
    .min(1)
    .optional(),

  maxDevices: Joi.number()
    .integer()
    .positive()
    .optional(),

  isPopular: Joi.boolean()
    .optional()
}).min(1);

/**
 * Update commission rates schema (admin)
 */
export const updateCommissionRates = Joi.object({
  directRate: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Rate must be between 0 and 100',
      'number.max': 'Rate must be between 0 and 100'
    }),

  networkL1Rate: Joi.number()
    .min(0)
    .max(100)
    .optional(),

  networkL2Rate: Joi.number()
    .min(0)
    .max(100)
    .optional(),

  bonusThreshold: Joi.number()
    .integer()
    .positive()
    .optional(),

  bonusAmount: Joi.number()
    .positive()
    .optional()
}).min(1);

/**
 * Query affiliates schema (admin)
 */
export const queryAffiliates = Joi.object({
  status: Joi.string()
    .valid('active', 'suspended', 'inactive')
    .optional(),

  verified: Joi.boolean()
    .optional(),

  country: Joi.string()
    .length(2)
    .uppercase()
    .optional(),

  minCommission: Joi.number()
    .min(0)
    .optional(),

  search: Joi.string()
    .max(100)
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
    .valid('created_at', 'name', 'total_commission', 'network_size', 'total_sales')
    .optional()
    .default('created_at'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
});

/**
 * Report query schema (admin)
 */
export const reportQuery = Joi.object({
  type: Joi.string()
    .valid('sales', 'commissions', 'payouts', 'affiliates', 'subscriptions')
    .required()
    .messages({
      'any.required': 'Report type is required'
    }),

  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'any.required': 'Start date is required'
    }),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'any.required': 'End date is required',
      'date.min': 'End date must be after start date'
    }),

  country: Joi.string()
    .length(2)
    .uppercase()
    .optional(),

  groupBy: Joi.string()
    .valid('day', 'week', 'month', 'country', 'offer')
    .optional()
    .default('day'),

  format: Joi.string()
    .valid('json', 'csv', 'pdf')
    .optional()
    .default('json')
});

/**
 * ID param schema
 */
export const idParam = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required'
    })
});

export default {
  adminLogin,
  verifyAffiliate,
  suspendAffiliate,
  createOffer,
  updateOffer,
  updateCommissionRates,
  queryAffiliates,
  reportQuery,
  idParam
};
