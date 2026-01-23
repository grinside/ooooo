import { asyncHandler } from '../../utils/errors.js';
import { BadRequestError, UnauthorizedError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import database from '../../config/database.js';
import paymentService from '../../services/paymentService.js';
import smsService from '../../services/smsService.js';
import queueService from '../../services/queueService.js';
import crypto from 'crypto';
import config from '../../config/index.js';

/**
 * Webhook Controller
 * Handles payment webhook callbacks from Orange Money, Wave, MTN, and Stripe
 */

/**
 * Verify webhook signature
 */
const verifySignature = (payload, signature, secret) => {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
};

/**
 * Orange Money webhook handler
 * POST /api/v1/webhooks/orange-money
 */
export const orangeMoneyWebhook = asyncHandler(async (req, res) => {
  const payload = req.body;

  logger.info('Orange Money webhook received', {
    orderId: payload.order_id,
    status: payload.status
  });

  try {
    // Verify signature if available
    const signature = req.headers['x-orange-signature'];
    if (signature && config.payment.orangeMoney.apiSecret) {
      const isValid = verifySignature(
        payload,
        signature,
        config.payment.orangeMoney.apiSecret
      );

      if (!isValid) {
        throw new UnauthorizedError('Invalid webhook signature');
      }
    }

    // Get subscription by reference
    const reference = payload.order_id || payload.reference;
    const subResult = await database.query(
      `SELECT s.*, c.phone as customer_phone, c.name as customer_name
       FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.reference = $1`,
      [reference]
    );

    if (subResult.rows.length === 0) {
      logger.warn('Subscription not found for Orange Money webhook', { reference });
      return res.status(200).json({ success: false, message: 'Subscription not found' });
    }

    const subscription = subResult.rows[0];

    // Map Orange Money status to our status
    let subscriptionStatus;
    let shouldProcessCommission = false;

    switch (payload.status?.toUpperCase()) {
      case 'SUCCESS':
      case 'SUCCESSFUL':
        subscriptionStatus = 'active';
        shouldProcessCommission = true;
        break;
      case 'FAILED':
      case 'EXPIRED':
        subscriptionStatus = 'failed';
        break;
      case 'PENDING':
        subscriptionStatus = 'pending';
        break;
      case 'CANCELLED':
        subscriptionStatus = 'cancelled';
        break;
      default:
        subscriptionStatus = 'pending';
    }

    // Update subscription in transaction
    await database.transaction(async (client) => {
      // Calculate dates for active subscription
      let startDate = null;
      let endDate = null;

      if (subscriptionStatus === 'active') {
        startDate = new Date();
        const offerResult = await client.query(
          'SELECT duration_days FROM subscription_offers WHERE id = $1',
          [subscription.offer_id]
        );
        const durationDays = offerResult.rows[0]?.duration_days || 30;
        endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      // Update subscription
      await client.query(
        `UPDATE subscriptions
         SET status = $1,
             start_date = $2,
             end_date = $3,
             payment_completed_at = $4,
             payment_metadata = payment_metadata || $5::jsonb,
             updated_at = NOW()
         WHERE id = $6`,
        [
          subscriptionStatus,
          startDate,
          endDate,
          subscriptionStatus === 'active' ? new Date() : null,
          JSON.stringify({
            webhookPayload: payload,
            webhookReceivedAt: new Date().toISOString()
          }),
          subscription.id
        ]
      );

      // Log payment event
      await client.query(
        `INSERT INTO payment_logs (
          subscription_id, provider, status, transaction_id,
          amount, currency, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          subscription.id,
          'orange_money',
          subscriptionStatus,
          payload.txnid || payload.pay_token,
          payload.amount || subscription.amount,
          payload.currency || subscription.currency,
          JSON.stringify(payload)
        ]
      );

      // Process commission if payment successful
      if (shouldProcessCommission) {
        await queueService.addCommissionCalculation({
          subscriptionId: subscription.id,
          affiliateId: subscription.affiliate_id,
          amount: parseFloat(subscription.amount),
          currency: subscription.currency
        });
      }
    });

    // Send SMS notification on success
    if (subscriptionStatus === 'active') {
      await queueService.addSMSNotification({
        phone: subscription.customer_phone,
        message: `Your Max IT TV subscription has been activated! Reference: ${subscription.reference}. Enjoy your service!`
      });

      logger.logPayment('completed', {
        subscriptionId: subscription.id,
        provider: 'orange_money',
        amount: subscription.amount,
        reference: subscription.reference
      });
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    logger.logError(error, {
      context: 'orange_money_webhook',
      payload
    });

    // Still return 200 to prevent webhook retries
    res.status(200).json({ success: false, message: error.message });
  }
});

/**
 * Wave webhook handler
 * POST /api/v1/webhooks/wave
 */
export const waveWebhook = asyncHandler(async (req, res) => {
  const payload = req.body;

  logger.info('Wave webhook received', {
    sessionId: payload.id,
    status: payload.status
  });

  try {
    // Verify signature
    const signature = req.headers['x-wave-signature'];
    if (signature && config.payment.wave.secretKey) {
      const isValid = verifySignature(payload, signature, config.payment.wave.secretKey);

      if (!isValid) {
        throw new UnauthorizedError('Invalid webhook signature');
      }
    }

    // Get subscription by client reference
    const reference = payload.client_reference;
    const subResult = await database.query(
      `SELECT s.*, c.phone as customer_phone, c.name as customer_name
       FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.reference = $1`,
      [reference]
    );

    if (subResult.rows.length === 0) {
      logger.warn('Subscription not found for Wave webhook', { reference });
      return res.status(200).json({ success: false, message: 'Subscription not found' });
    }

    const subscription = subResult.rows[0];

    // Map Wave status
    let subscriptionStatus;
    let shouldProcessCommission = false;

    switch (payload.status?.toLowerCase()) {
      case 'completed':
      case 'successful':
        subscriptionStatus = 'active';
        shouldProcessCommission = true;
        break;
      case 'failed':
        subscriptionStatus = 'failed';
        break;
      case 'pending':
        subscriptionStatus = 'pending';
        break;
      case 'cancelled':
        subscriptionStatus = 'cancelled';
        break;
      default:
        subscriptionStatus = 'pending';
    }

    // Update subscription
    await database.transaction(async (client) => {
      let startDate = null;
      let endDate = null;

      if (subscriptionStatus === 'active') {
        startDate = new Date();
        const offerResult = await client.query(
          'SELECT duration_days FROM subscription_offers WHERE id = $1',
          [subscription.offer_id]
        );
        const durationDays = offerResult.rows[0]?.duration_days || 30;
        endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      await client.query(
        `UPDATE subscriptions
         SET status = $1,
             start_date = $2,
             end_date = $3,
             payment_completed_at = $4,
             payment_metadata = payment_metadata || $5::jsonb,
             updated_at = NOW()
         WHERE id = $6`,
        [
          subscriptionStatus,
          startDate,
          endDate,
          subscriptionStatus === 'active' ? new Date() : null,
          JSON.stringify({
            webhookPayload: payload,
            webhookReceivedAt: new Date().toISOString()
          }),
          subscription.id
        ]
      );

      await client.query(
        `INSERT INTO payment_logs (
          subscription_id, provider, status, transaction_id,
          amount, currency, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          subscription.id,
          'wave',
          subscriptionStatus,
          payload.wave_transaction_id || payload.id,
          (payload.amount || subscription.amount * 100) / 100,
          payload.currency || subscription.currency,
          JSON.stringify(payload)
        ]
      );

      if (shouldProcessCommission) {
        await queueService.addCommissionCalculation({
          subscriptionId: subscription.id,
          affiliateId: subscription.affiliate_id,
          amount: parseFloat(subscription.amount),
          currency: subscription.currency
        });
      }
    });

    // Send notification on success
    if (subscriptionStatus === 'active') {
      await queueService.addSMSNotification({
        phone: subscription.customer_phone,
        message: `Your Max IT TV subscription has been activated! Reference: ${subscription.reference}. Enjoy your service!`
      });

      logger.logPayment('completed', {
        subscriptionId: subscription.id,
        provider: 'wave',
        amount: subscription.amount,
        reference: subscription.reference
      });
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    logger.logError(error, {
      context: 'wave_webhook',
      payload
    });

    res.status(200).json({ success: false, message: error.message });
  }
});

/**
 * MTN Mobile Money webhook handler
 * POST /api/v1/webhooks/mtn-momo
 */
export const mtnMoMoWebhook = asyncHandler(async (req, res) => {
  const payload = req.body;

  logger.info('MTN MoMo webhook received', {
    referenceId: payload.referenceId,
    status: payload.status
  });

  try {
    // Get subscription by external ID
    const externalId = payload.externalId;
    const subResult = await database.query(
      `SELECT s.*, c.phone as customer_phone, c.name as customer_name
       FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.reference = $1`,
      [externalId]
    );

    if (subResult.rows.length === 0) {
      logger.warn('Subscription not found for MTN MoMo webhook', { externalId });
      return res.status(200).json({ success: false, message: 'Subscription not found' });
    }

    const subscription = subResult.rows[0];

    // Map MTN status
    let subscriptionStatus;
    let shouldProcessCommission = false;

    switch (payload.status?.toUpperCase()) {
      case 'SUCCESSFUL':
        subscriptionStatus = 'active';
        shouldProcessCommission = true;
        break;
      case 'FAILED':
        subscriptionStatus = 'failed';
        break;
      case 'PENDING':
        subscriptionStatus = 'pending';
        break;
      default:
        subscriptionStatus = 'pending';
    }

    // Update subscription
    await database.transaction(async (client) => {
      let startDate = null;
      let endDate = null;

      if (subscriptionStatus === 'active') {
        startDate = new Date();
        const offerResult = await client.query(
          'SELECT duration_days FROM subscription_offers WHERE id = $1',
          [subscription.offer_id]
        );
        const durationDays = offerResult.rows[0]?.duration_days || 30;
        endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      await client.query(
        `UPDATE subscriptions
         SET status = $1,
             start_date = $2,
             end_date = $3,
             payment_completed_at = $4,
             payment_metadata = payment_metadata || $5::jsonb,
             updated_at = NOW()
         WHERE id = $6`,
        [
          subscriptionStatus,
          startDate,
          endDate,
          subscriptionStatus === 'active' ? new Date() : null,
          JSON.stringify({
            webhookPayload: payload,
            webhookReceivedAt: new Date().toISOString()
          }),
          subscription.id
        ]
      );

      await client.query(
        `INSERT INTO payment_logs (
          subscription_id, provider, status, transaction_id,
          amount, currency, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          subscription.id,
          'mtn_momo',
          subscriptionStatus,
          payload.financialTransactionId || payload.referenceId,
          payload.amount || subscription.amount,
          payload.currency || subscription.currency,
          JSON.stringify(payload)
        ]
      );

      if (shouldProcessCommission) {
        await queueService.addCommissionCalculation({
          subscriptionId: subscription.id,
          affiliateId: subscription.affiliate_id,
          amount: parseFloat(subscription.amount),
          currency: subscription.currency
        });
      }
    });

    // Send notification
    if (subscriptionStatus === 'active') {
      await queueService.addSMSNotification({
        phone: subscription.customer_phone,
        message: `Your Max IT TV subscription has been activated! Reference: ${subscription.reference}. Enjoy your service!`
      });

      logger.logPayment('completed', {
        subscriptionId: subscription.id,
        provider: 'mtn_momo',
        amount: subscription.amount,
        reference: subscription.reference
      });
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    logger.logError(error, {
      context: 'mtn_momo_webhook',
      payload
    });

    res.status(200).json({ success: false, message: error.message });
  }
});

/**
 * Stripe webhook handler
 * POST /api/v1/webhooks/stripe
 */
export const stripeWebhook = asyncHandler(async (req, res) => {
  const payload = req.body;
  const signature = req.headers['stripe-signature'];

  logger.info('Stripe webhook received', {
    type: payload.type,
    id: payload.id
  });

  try {
    // Verify webhook signature (in production, use Stripe SDK for this)
    if (signature && config.payment.stripe.webhookSecret) {
      // Simplified verification - use official Stripe library in production
      const isValid = verifySignature(
        payload,
        signature,
        config.payment.stripe.webhookSecret
      );

      if (!isValid) {
        throw new UnauthorizedError('Invalid webhook signature');
      }
    }

    // Handle different event types
    const event = payload;

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handleStripePaymentCanceled(event.data.object);
        break;

      default:
        logger.info('Unhandled Stripe event type', { type: event.type });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.logError(error, {
      context: 'stripe_webhook',
      payload
    });

    res.status(200).json({ received: false, error: error.message });
  }
});

/**
 * Handle Stripe payment success
 */
async function handleStripePaymentSuccess(paymentIntent) {
  const reference = paymentIntent.metadata?.reference;

  if (!reference) {
    logger.warn('No reference in Stripe payment intent', { paymentIntentId: paymentIntent.id });
    return;
  }

  const subResult = await database.query(
    `SELECT s.*, c.phone as customer_phone
     FROM subscriptions s
     JOIN customers c ON s.customer_id = c.id
     WHERE s.reference = $1`,
    [reference]
  );

  if (subResult.rows.length === 0) {
    logger.warn('Subscription not found for Stripe payment', { reference });
    return;
  }

  const subscription = subResult.rows[0];

  await database.transaction(async (client) => {
    const startDate = new Date();
    const offerResult = await client.query(
      'SELECT duration_days FROM subscription_offers WHERE id = $1',
      [subscription.offer_id]
    );
    const durationDays = offerResult.rows[0]?.duration_days || 30;
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await client.query(
      `UPDATE subscriptions
       SET status = 'active',
           start_date = $1,
           end_date = $2,
           payment_completed_at = NOW(),
           payment_metadata = payment_metadata || $3::jsonb,
           updated_at = NOW()
       WHERE id = $4`,
      [
        startDate,
        endDate,
        JSON.stringify({ stripePaymentIntent: paymentIntent }),
        subscription.id
      ]
    );

    await queueService.addCommissionCalculation({
      subscriptionId: subscription.id,
      affiliateId: subscription.affiliate_id,
      amount: parseFloat(subscription.amount),
      currency: subscription.currency
    });
  });

  await queueService.addSMSNotification({
    phone: subscription.customer_phone,
    message: `Your Max IT TV subscription has been activated! Reference: ${subscription.reference}. Enjoy your service!`
  });

  logger.logPayment('completed', {
    subscriptionId: subscription.id,
    provider: 'stripe',
    amount: subscription.amount,
    reference: subscription.reference
  });
}

/**
 * Handle Stripe payment failure
 */
async function handleStripePaymentFailed(paymentIntent) {
  const reference = paymentIntent.metadata?.reference;

  if (!reference) return;

  await database.query(
    `UPDATE subscriptions
     SET status = 'failed',
         payment_metadata = payment_metadata || $1::jsonb,
         updated_at = NOW()
     WHERE reference = $2`,
    [
      JSON.stringify({
        stripePaymentIntent: paymentIntent,
        failureReason: paymentIntent.last_payment_error?.message
      }),
      reference
    ]
  );

  logger.logPayment('failed', { reference, reason: paymentIntent.last_payment_error?.message });
}

/**
 * Handle Stripe payment cancellation
 */
async function handleStripePaymentCanceled(paymentIntent) {
  const reference = paymentIntent.metadata?.reference;

  if (!reference) return;

  await database.query(
    `UPDATE subscriptions
     SET status = 'cancelled',
         updated_at = NOW()
     WHERE reference = $1`,
    [reference]
  );

  logger.logPayment('cancelled', { reference });
}

export default {
  orangeMoneyWebhook,
  waveWebhook,
  mtnMoMoWebhook,
  stripeWebhook
};
