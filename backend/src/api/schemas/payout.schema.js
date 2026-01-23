import Joi from 'joi';

/**
 * Request payout schema
 */
export const requestPayout = Joi.object({
  amount: Joi.number()
    .positive()
    .min(5000)
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'number.min': 'Minimum payout amount is 5000',
      'any.required': 'Amount is required'
    }),

  paymentMethod: Joi.string()
    .valid('orange_money', 'wave', 'mtn_momo', 'bank_transfer')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required'
    }),

  accountNumber: Joi.string()
    .required()
    .messages({
      'any.required': 'Account number is required'
    }),

  accountName: Joi.string()
    .required()
    .messages({
      'any.required': 'Account name is required'
    }),

  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'PIN must be 4 digits',
      'any.required': 'PIN is required for security'
    }),

  notes: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
});

/**
 * Query payouts schema
 */
export const queryPayouts = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'completed', 'failed', 'cancelled')
    .optional(),

  affiliateId: Joi.number()
    .integer()
    .positive()
    .optional(),

  paymentMethod: Joi.string()
    .valid('orange_money', 'wave', 'mtn_momo', 'bank_transfer')
    .optional(),

  minAmount: Joi.number()
    .positive()
    .optional(),

  maxAmount: Joi.number()
    .positive()
    .min(Joi.ref('minAmount'))
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
    .valid('created_at', 'amount', 'status')
    .optional()
    .default('created_at'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
});

/**
 * Process payout schema (admin)
 */
export const processPayout = Joi.object({
  payoutId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Payout ID is required'
    }),

  action: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': 'Action must be approve or reject',
      'any.required': 'Action is required'
    }),

  reason: Joi.string()
    .when('action', {
      is: 'reject',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .max(500)
    .messages({
      'any.required': 'Reason is required for rejection',
      'string.max': 'Reason must not exceed 500 characters'
    }),

  transactionId: Joi.string()
    .when('action', {
      is: 'approve',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    })
});

/**
 * Batch process payouts schema (admin)
 */
export const batchProcessPayouts = Joi.object({
  payoutIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one payout ID is required',
      'array.max': 'Maximum 100 payouts can be processed at once',
      'any.required': 'Payout IDs are required'
    }),

  action: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': 'Action must be approve or reject',
      'any.required': 'Action is required'
    })
});

/**
 * Payout ID param schema
 */
export const payoutIdParam = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Payout ID must be a number',
      'number.positive': 'Payout ID must be positive',
      'any.required': 'Payout ID is required'
    })
});

export default {
  requestPayout,
  queryPayouts,
  processPayout,
  batchProcessPayouts,
  payoutIdParam
};
