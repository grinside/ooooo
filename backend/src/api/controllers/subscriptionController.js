import { asyncHandler } from '../../utils/errors.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  PaymentError
} from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import database from '../../config/database.js';
import paymentService from '../../services/paymentService.js';
import smsService from '../../services/smsService.js';
import queueService from '../../services/queueService.js';
import crypto from 'crypto';

/**
 * Subscription Controller
 * Handles subscription creation, payment, status checks, and lifecycle management
 */

/**
 * Create a new subscription
 * POST /api/v1/subscriptions
 */
export const createSubscription = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    offerId,
    affiliateCode,
    country,
    trackingSource,
    metadata
  } = req.body;

  logger.info('Creating subscription', {
    customerPhone: customerPhone.slice(0, 4) + '****',
    affiliateCode,
    offerId,
    country
  });

  // Start transaction
  const result = await database.transaction(async (client) => {
    // Verify affiliate exists and is active
    const affiliateResult = await client.query(
      `SELECT id, status, user_id, tier
       FROM affiliates
       WHERE code = $1`,
      [affiliateCode]
    );

    if (affiliateResult.rows.length === 0) {
      throw new NotFoundError('Invalid affiliate code', 'INVALID_AFFILIATE_CODE');
    }

    const affiliate = affiliateResult.rows[0];

    if (affiliate.status !== 'active') {
      throw new BadRequestError('Affiliate is not active', 'AFFILIATE_NOT_ACTIVE');
    }

    // Verify offer exists and is active
    const offerResult = await client.query(
      `SELECT id, name, price, currency, duration_days, status, country
       FROM subscription_offers
       WHERE id = $1 AND status = 'active'`,
      [offerId]
    );

    if (offerResult.rows.length === 0) {
      throw new NotFoundError('Invalid or inactive offer', 'INVALID_OFFER');
    }

    const offer = offerResult.rows[0];

    // Verify offer is available in the specified country
    if (offer.country !== country && offer.country !== 'ALL') {
      throw new BadRequestError(
        'Offer not available in this country',
        'OFFER_NOT_AVAILABLE'
      );
    }

    // Check for existing customer or create new one
    let customerId;
    const customerResult = await client.query(
      'SELECT id FROM customers WHERE phone = $1',
      [customerPhone]
    );

    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].id;

      // Update customer info
      await client.query(
        `UPDATE customers
         SET name = $1, email = COALESCE($2, email), updated_at = NOW()
         WHERE id = $3`,
        [customerName, customerEmail, customerId]
      );
    } else {
      // Create new customer
      const newCustomer = await client.query(
        `INSERT INTO customers (name, phone, email, country)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [customerName, customerPhone, customerEmail, country]
      );
      customerId = newCustomer.rows[0].id;
    }

    // Generate unique subscription reference
    const reference = `SUB-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Create subscription
    const subscription = await client.query(
      `INSERT INTO subscriptions (
        reference, customer_id, offer_id, affiliate_id,
        status, amount, currency, country, tracking_source, metadata
      )
      VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        reference,
        customerId,
        offerId,
        affiliate.id,
        offer.price,
        offer.currency,
        country,
        trackingSource || 'direct',
        JSON.stringify(metadata || {})
      ]
    );

    // Track affiliate click/lead
    await client.query(
      `INSERT INTO affiliate_clicks (
        affiliate_id, customer_id, subscription_id,
        ip_address, user_agent, country, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        affiliate.id,
        customerId,
        subscription.rows[0].id,
        req.ip,
        req.get('user-agent'),
        country,
        trackingSource || 'direct'
      ]
    );

    return {
      subscription: subscription.rows[0],
      customer: { id: customerId, name: customerName, phone: customerPhone, email: customerEmail },
      offer,
      affiliate: { id: affiliate.id, code: affiliateCode }
    };
  });

  logger.info('Subscription created successfully', {
    subscriptionId: result.subscription.id,
    reference: result.subscription.reference
  });

  res.status(201).json({
    success: true,
    data: {
      subscription: {
        id: result.subscription.id,
        reference: result.subscription.reference,
        status: result.subscription.status,
        amount: parseFloat(result.subscription.amount),
        currency: result.subscription.currency,
        createdAt: result.subscription.created_at
      },
      customer: result.customer,
      offer: {
        id: result.offer.id,
        name: result.offer.name,
        price: parseFloat(result.offer.price),
        currency: result.offer.currency,
        durationDays: result.offer.duration_days
      },
      nextStep: 'payment'
    }
  });
});

/**
 * Process payment for subscription
 * POST /api/v1/subscriptions/:id/pay
 */
export const paySubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentProvider, paymentPhone, returnUrl } = req.body;

  logger.info('Processing subscription payment', {
    subscriptionId: id,
    paymentProvider
  });

  // Get subscription details
  const subResult = await database.query(
    `SELECT s.*, c.phone as customer_phone, c.name as customer_name
     FROM subscriptions s
     JOIN customers c ON s.customer_id = c.id
     WHERE s.id = $1`,
    [id]
  );

  if (subResult.rows.length === 0) {
    throw new NotFoundError('Subscription not found');
  }

  const subscription = subResult.rows[0];

  if (subscription.status !== 'pending') {
    throw new BadRequestError(
      'Subscription is not in pending status',
      'INVALID_STATUS'
    );
  }

  // Process payment
  const paymentResult = await paymentService.processPayment({
    provider: paymentProvider,
    amount: parseFloat(subscription.amount),
    currency: subscription.currency,
    phone: paymentPhone || subscription.customer_phone,
    reference: subscription.reference,
    metadata: {
      subscriptionId: subscription.id,
      customerId: subscription.customer_id,
      customerName: subscription.customer_name,
      type: 'subscription',
      returnUrl
    }
  });

  // Update subscription with payment info
  await database.query(
    `UPDATE subscriptions
     SET payment_provider = $1,
         payment_transaction_id = $2,
         payment_metadata = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [
      paymentProvider,
      paymentResult.transactionId,
      JSON.stringify(paymentResult.metadata || {}),
      id
    ]
  );

  // Queue payment verification job
  await queueService.addPaymentVerification({
    subscriptionId: subscription.id,
    provider: paymentProvider,
    transactionId: paymentResult.transactionId,
    reference: subscription.reference
  });

  logger.logPayment('initiated', {
    subscriptionId: subscription.id,
    provider: paymentProvider,
    transactionId: paymentResult.transactionId,
    amount: subscription.amount
  });

  res.json({
    success: true,
    data: {
      payment: {
        provider: paymentProvider,
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        paymentUrl: paymentResult.paymentUrl,
        clientSecret: paymentResult.clientSecret
      },
      subscription: {
        id: subscription.id,
        reference: subscription.reference,
        status: subscription.status
      }
    }
  });
});

/**
 * Get subscription status
 * GET /api/v1/subscriptions/:reference/status
 */
export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const result = await database.query(
    `SELECT s.*, c.name as customer_name, c.phone as customer_phone,
            o.name as offer_name, o.duration_days
     FROM subscriptions s
     JOIN customers c ON s.customer_id = c.id
     JOIN subscription_offers o ON s.offer_id = o.id
     WHERE s.reference = $1`,
    [reference]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Subscription not found');
  }

  const subscription = result.rows[0];

  res.json({
    success: true,
    data: {
      subscription: {
        id: subscription.id,
        reference: subscription.reference,
        status: subscription.status,
        amount: parseFloat(subscription.amount),
        currency: subscription.currency,
        paymentProvider: subscription.payment_provider,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        createdAt: subscription.created_at
      },
      customer: {
        name: subscription.customer_name,
        phone: subscription.customer_phone
      },
      offer: {
        name: subscription.offer_name,
        durationDays: subscription.duration_days
      }
    }
  });
});

/**
 * Cancel subscription
 * POST /api/v1/subscriptions/:id/cancel
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user?.id;

  logger.info('Cancelling subscription', { subscriptionId: id, userId });

  const result = await database.transaction(async (client) => {
    // Get subscription
    const subResult = await client.query(
      'SELECT * FROM subscriptions WHERE id = $1',
      [id]
    );

    if (subResult.rows.length === 0) {
      throw new NotFoundError('Subscription not found');
    }

    const subscription = subResult.rows[0];

    if (['cancelled', 'expired'].includes(subscription.status)) {
      throw new BadRequestError('Subscription is already cancelled or expired');
    }

    // Update subscription status
    await client.query(
      `UPDATE subscriptions
       SET status = 'cancelled',
           cancellation_reason = $1,
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [reason, id]
    );

    // Log cancellation
    await client.query(
      `INSERT INTO subscription_logs (subscription_id, action, details, created_by)
       VALUES ($1, 'cancelled', $2, $3)`,
      [id, JSON.stringify({ reason }), userId]
    );

    return subscription;
  });

  // Queue notification
  await queueService.addSMSNotification({
    phone: result.customer_phone,
    message: `Your Max IT TV subscription has been cancelled. Reference: ${result.reference}`
  });

  logger.info('Subscription cancelled successfully', { subscriptionId: id });

  res.json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: {
      subscriptionId: id,
      status: 'cancelled'
    }
  });
});

/**
 * Renew subscription
 * POST /api/v1/subscriptions/:id/renew
 */
export const renewSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentProvider, paymentPhone } = req.body;

  logger.info('Renewing subscription', { subscriptionId: id });

  // Get subscription with offer details
  const result = await database.query(
    `SELECT s.*, o.price, o.currency, o.duration_days, c.phone
     FROM subscriptions s
     JOIN subscription_offers o ON s.offer_id = o.id
     JOIN customers c ON s.customer_id = c.id
     WHERE s.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Subscription not found');
  }

  const subscription = result.rows[0];

  if (!['active', 'expired'].includes(subscription.status)) {
    throw new BadRequestError('Subscription cannot be renewed');
  }

  // Generate new reference
  const reference = `SUB-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  // Process payment
  const paymentResult = await paymentService.processPayment({
    provider: paymentProvider,
    amount: parseFloat(subscription.price),
    currency: subscription.currency,
    phone: paymentPhone || subscription.phone,
    reference,
    metadata: {
      subscriptionId: subscription.id,
      type: 'renewal'
    }
  });

  // Update subscription
  await database.query(
    `UPDATE subscriptions
     SET payment_provider = $1,
         payment_transaction_id = $2,
         status = 'pending',
         updated_at = NOW()
     WHERE id = $3`,
    [paymentProvider, paymentResult.transactionId, id]
  );

  logger.info('Subscription renewal initiated', {
    subscriptionId: id,
    transactionId: paymentResult.transactionId
  });

  res.json({
    success: true,
    message: 'Subscription renewal initiated',
    data: {
      payment: {
        provider: paymentProvider,
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        paymentUrl: paymentResult.paymentUrl
      }
    }
  });
});

/**
 * List subscriptions (admin/affiliate)
 * GET /api/v1/subscriptions
 */
export const listSubscriptions = asyncHandler(async (req, res) => {
  const {
    status,
    affiliateId,
    customerId,
    offerId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  // Build query
  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  if (status) {
    whereConditions.push(`s.status = $${paramCount}`);
    params.push(status);
    paramCount++;
  }

  if (affiliateId) {
    whereConditions.push(`s.affiliate_id = $${paramCount}`);
    params.push(affiliateId);
    paramCount++;
  }

  if (customerId) {
    whereConditions.push(`s.customer_id = $${paramCount}`);
    params.push(customerId);
    paramCount++;
  }

  if (offerId) {
    whereConditions.push(`s.offer_id = $${paramCount}`);
    params.push(offerId);
    paramCount++;
  }

  if (startDate) {
    whereConditions.push(`s.created_at >= $${paramCount}`);
    params.push(startDate);
    paramCount++;
  }

  if (endDate) {
    whereConditions.push(`s.created_at <= $${paramCount}`);
    params.push(endDate);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // Get total count
  const countResult = await database.query(
    `SELECT COUNT(*) FROM subscriptions s ${whereClause}`,
    params
  );
  const totalCount = parseInt(countResult.rows[0].count);

  // Get subscriptions
  const validSortColumns = ['created_at', 'start_date', 'end_date', 'amount'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  params.push(limit, offset);

  const result = await database.query(
    `SELECT s.*,
            c.name as customer_name, c.phone as customer_phone,
            o.name as offer_name,
            a.code as affiliate_code
     FROM subscriptions s
     JOIN customers c ON s.customer_id = c.id
     JOIN subscription_offers o ON s.offer_id = o.id
     LEFT JOIN affiliates a ON s.affiliate_id = a.id
     ${whereClause}
     ORDER BY s.${sortColumn} ${order}
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  res.json({
    success: true,
    data: {
      subscriptions: result.rows.map(sub => ({
        id: sub.id,
        reference: sub.reference,
        status: sub.status,
        amount: parseFloat(sub.amount),
        currency: sub.currency,
        customerName: sub.customer_name,
        customerPhone: sub.customer_phone,
        offerName: sub.offer_name,
        affiliateCode: sub.affiliate_code,
        startDate: sub.start_date,
        endDate: sub.end_date,
        createdAt: sub.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    }
  });
});

export default {
  createSubscription,
  paySubscription,
  getSubscriptionStatus,
  cancelSubscription,
  renewSubscription,
  listSubscriptions
};
