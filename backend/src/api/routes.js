import express from 'express';

// Middleware
import {
  authenticate,
  requireAdmin,
  requireAffiliate,
  requireOwnership
} from '../middleware/auth.js';
import {
  validateBody,
  validateParams,
  validateQuery
} from '../middleware/validator.js';
import {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  payoutLimiter,
  webhookLimiter,
  adminLimiter
} from '../middleware/rateLimiter.js';

// Controllers
import * as subscriptionController from './controllers/subscriptionController.js';
import * as adminController from './controllers/adminController.js';
import * as webhookController from './controllers/webhookController.js';

// Schemas
import {
  subscriptionSchemas,
  payoutSchemas,
  adminSchemas,
  affiliateSchemas
} from './schemas/index.js';

const router = express.Router();

/**
 * API Routes
 * Version: v1
 */

// ===========================================
// PUBLIC ROUTES (No authentication required)
// ===========================================

/**
 * Health Check
 * GET /api/v1/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ===========================================
// SUBSCRIPTION ROUTES
// ===========================================

/**
 * Create new subscription
 * POST /api/v1/subscriptions
 */
router.post(
  '/subscriptions',
  apiLimiter,
  validateBody(subscriptionSchemas.createSubscription),
  subscriptionController.createSubscription
);

/**
 * Process payment for subscription
 * POST /api/v1/subscriptions/:id/pay
 */
router.post(
  '/subscriptions/:id/pay',
  paymentLimiter,
  validateParams(subscriptionSchemas.subscriptionIdParam),
  validateBody(subscriptionSchemas.paySubscription),
  subscriptionController.paySubscription
);

/**
 * Get subscription status by reference
 * GET /api/v1/subscriptions/:reference/status
 */
router.get(
  '/subscriptions/:reference/status',
  apiLimiter,
  validateParams(subscriptionSchemas.getSubscriptionStatus),
  subscriptionController.getSubscriptionStatus
);

/**
 * Cancel subscription
 * POST /api/v1/subscriptions/:id/cancel
 */
router.post(
  '/subscriptions/:id/cancel',
  authenticate,
  apiLimiter,
  validateParams(subscriptionSchemas.subscriptionIdParam),
  validateBody(subscriptionSchemas.cancelSubscription),
  subscriptionController.cancelSubscription
);

/**
 * Renew subscription
 * POST /api/v1/subscriptions/:id/renew
 */
router.post(
  '/subscriptions/:id/renew',
  authenticate,
  paymentLimiter,
  validateParams(subscriptionSchemas.subscriptionIdParam),
  validateBody(subscriptionSchemas.renewSubscription),
  subscriptionController.renewSubscription
);

/**
 * List subscriptions (with filters)
 * GET /api/v1/subscriptions
 */
router.get(
  '/subscriptions',
  authenticate,
  apiLimiter,
  validateQuery(subscriptionSchemas.querySubscriptions),
  subscriptionController.listSubscriptions
);

// ===========================================
// WEBHOOK ROUTES
// ===========================================

/**
 * Orange Money webhook
 * POST /api/v1/webhooks/orange-money
 */
router.post(
  '/webhooks/orange-money',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  webhookController.orangeMoneyWebhook
);

/**
 * Wave webhook
 * POST /api/v1/webhooks/wave
 */
router.post(
  '/webhooks/wave',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  webhookController.waveWebhook
);

/**
 * MTN Mobile Money webhook
 * POST /api/v1/webhooks/mtn-momo
 */
router.post(
  '/webhooks/mtn-momo',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  webhookController.mtnMoMoWebhook
);

/**
 * Stripe webhook
 * POST /api/v1/webhooks/stripe
 */
router.post(
  '/webhooks/stripe',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  webhookController.stripeWebhook
);

// ===========================================
// ADMIN ROUTES (Requires admin authentication)
// ===========================================

/**
 * Admin login
 * POST /api/v1/admin/auth/login
 */
router.post(
  '/admin/auth/login',
  authLimiter,
  validateBody(adminSchemas.login),
  adminController.login
);

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard/stats
 */
router.get(
  '/admin/dashboard/stats',
  authenticate,
  requireAdmin,
  adminLimiter,
  validateQuery(adminSchemas.dashboardStatsQuery),
  adminController.getDashboardStats
);

/**
 * List affiliates
 * GET /api/v1/admin/affiliates
 */
router.get(
  '/admin/affiliates',
  authenticate,
  requireAdmin,
  adminLimiter,
  validateQuery(adminSchemas.listAffiliatesQuery),
  adminController.listAffiliates
);

/**
 * Get affiliate details
 * GET /api/v1/admin/affiliates/:id
 */
router.get(
  '/admin/affiliates/:id',
  authenticate,
  requireAdmin,
  adminLimiter,
  validateParams(adminSchemas.affiliateIdParam),
  adminController.getAffiliateDetails
);

/**
 * Update affiliate status
 * PATCH /api/v1/admin/affiliates/:id/status
 */
router.patch(
  '/admin/affiliates/:id/status',
  authenticate,
  requireAdmin,
  adminLimiter,
  validateParams(adminSchemas.affiliateIdParam),
  validateBody(adminSchemas.updateAffiliateStatus),
  adminController.updateAffiliateStatus
);

/**
 * Process pending payouts
 * POST /api/v1/admin/payouts/process
 */
router.post(
  '/admin/payouts/process',
  authenticate,
  requireAdmin,
  payoutLimiter,
  validateBody(adminSchemas.processPayouts),
  adminController.processPendingPayouts
);

/**
 * Get system report
 * GET /api/v1/admin/reports/:type
 */
router.get(
  '/admin/reports/:type',
  authenticate,
  requireAdmin,
  adminLimiter,
  validateParams(adminSchemas.reportTypeParam),
  validateQuery(adminSchemas.reportQuery),
  adminController.getReport
);

/**
 * Get queue statistics
 * GET /api/v1/admin/system/queues
 */
router.get(
  '/admin/system/queues',
  authenticate,
  requireAdmin,
  adminLimiter,
  adminController.getQueueStats
);

/**
 * Retry failed job
 * POST /api/v1/admin/system/queues/:queueName/jobs/:jobId/retry
 */
router.post(
  '/admin/system/queues/:queueName/jobs/:jobId/retry',
  authenticate,
  requireAdmin,
  adminLimiter,
  adminController.retryFailedJob
);

/**
 * Get system health
 * GET /api/v1/admin/system/health
 */
router.get(
  '/admin/system/health',
  authenticate,
  requireAdmin,
  adminLimiter,
  adminController.getSystemHealth
);

// ===========================================
// AFFILIATE ROUTES (Requires affiliate authentication)
// ===========================================

/**
 * Get affiliate dashboard
 * GET /api/v1/affiliate/dashboard
 */
router.get(
  '/affiliate/dashboard',
  authenticate,
  requireAffiliate,
  apiLimiter,
  async (req, res, next) => {
    try {
      const { affiliate } = req;

      // Get affiliate stats, earnings, recent activity
      const [statsResult, earningsResult, activityResult] = await Promise.all([
        database.query(
          `SELECT * FROM affiliate_stats WHERE affiliate_id = $1`,
          [affiliate.id]
        ),
        database.query(
          `SELECT
             COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending,
             COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid,
             COUNT(*) as total_commissions
           FROM commissions
           WHERE affiliate_id = $1`,
          [affiliate.id]
        ),
        database.query(
          `SELECT s.*, c.name as customer_name, o.name as offer_name
           FROM subscriptions s
           JOIN customers c ON s.customer_id = c.id
           JOIN subscription_offers o ON s.offer_id = o.id
           WHERE s.affiliate_id = $1
           ORDER BY s.created_at DESC
           LIMIT 10`,
          [affiliate.id]
        )
      ]);

      res.json({
        success: true,
        data: {
          affiliate: {
            id: affiliate.id,
            code: affiliate.code,
            tier: affiliate.tier
          },
          stats: statsResult.rows[0] || {},
          earnings: earningsResult.rows[0],
          recentActivity: activityResult.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get affiliate QR code
 * GET /api/v1/affiliate/qr-code
 */
router.get(
  '/affiliate/qr-code',
  authenticate,
  requireAffiliate,
  apiLimiter,
  async (req, res, next) => {
    try {
      const { affiliate } = req;
      const { format = 'png' } = req.query;

      // Generate QR code
      const QRCode = await import('qrcode');
      const affiliateUrl = `${process.env.APP_URL}/subscribe?ref=${affiliate.code}`;

      if (format === 'svg') {
        const svg = await QRCode.toString(affiliateUrl, {
          type: 'svg',
          width: 300
        });

        res.type('image/svg+xml');
        res.send(svg);
      } else {
        const buffer = await QRCode.toBuffer(affiliateUrl, {
          width: 300,
          margin: 2
        });

        res.type('image/png');
        res.send(buffer);
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Request payout
 * POST /api/v1/affiliate/payouts/request
 */
router.post(
  '/affiliate/payouts/request',
  authenticate,
  requireAffiliate,
  payoutLimiter,
  validateBody(payoutSchemas.requestPayout),
  async (req, res, next) => {
    try {
      const { affiliate, user } = req;
      const { amount, paymentProvider, paymentDetails } = req.body;

      // Validate minimum payout amount
      const minimumPayout = parseFloat(process.env.MINIMUM_PAYOUT || 10000);
      if (amount < minimumPayout) {
        throw new BadRequestError(
          `Minimum payout amount is ${minimumPayout}`,
          'MINIMUM_PAYOUT_NOT_MET'
        );
      }

      // Check available balance
      const balanceResult = await database.query(
        `SELECT COALESCE(SUM(amount), 0) as available
         FROM commissions
         WHERE affiliate_id = $1 AND status = 'pending'`,
        [affiliate.id]
      );

      const available = parseFloat(balanceResult.rows[0].available);

      if (amount > available) {
        throw new InsufficientBalanceError(
          'Insufficient balance for payout',
          available,
          amount
        );
      }

      // Create payout request
      const reference = `PAYOUT-${Date.now()}-${affiliate.code}`;

      const result = await database.query(
        `INSERT INTO payouts (
          affiliate_id, reference, amount, currency,
          payment_provider, payment_details, status, requested_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
        RETURNING *`,
        [
          affiliate.id,
          reference,
          amount,
          'XOF', // Default currency
          paymentProvider,
          JSON.stringify(paymentDetails)
        ]
      );

      logger.info('Payout requested', {
        affiliateId: affiliate.id,
        payoutId: result.rows[0].id,
        amount
      });

      res.status(201).json({
        success: true,
        message: 'Payout request submitted successfully',
        data: {
          payout: {
            id: result.rows[0].id,
            reference: result.rows[0].reference,
            amount: parseFloat(result.rows[0].amount),
            status: result.rows[0].status,
            requestedAt: result.rows[0].requested_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get affiliate payouts
 * GET /api/v1/affiliate/payouts
 */
router.get(
  '/affiliate/payouts',
  authenticate,
  requireAffiliate,
  apiLimiter,
  validateQuery(payoutSchemas.queryPayouts),
  async (req, res, next) => {
    try {
      const { affiliate } = req;
      const { status, page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      let whereClause = 'WHERE affiliate_id = $1';
      const params = [affiliate.id];
      let paramCount = 2;

      if (status) {
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      // Get total count
      const countResult = await database.query(
        `SELECT COUNT(*) FROM payouts ${whereClause}`,
        params
      );

      params.push(limit, offset);

      // Get payouts
      const result = await database.query(
        `SELECT * FROM payouts
         ${whereClause}
         ORDER BY requested_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        params
      );

      res.json({
        success: true,
        data: {
          payouts: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].count),
            pages: Math.ceil(countResult.rows[0].count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// ERROR HANDLER (Must be last)
// ===========================================

router.use((err, req, res, next) => {
  // This will be handled by the main error handler in index.js
  next(err);
});

export default router;
