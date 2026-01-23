import dotenv from 'dotenv';
dotenv.config();

import queueService from './services/queueService.js';
import logger from './utils/logger.js';
import database from './config/database.js';

// Import job processors
import * as payoutJobs from './jobs/processPayouts.js';
import * as notificationJobs from './jobs/sendNotifications.js';
import * as statsJobs from './jobs/refreshStats.js';

/**
 * Bull Queue Worker
 * Processes background jobs from Redis queues
 */

// Track graceful shutdown
let isShuttingDown = false;

/**
 * Initialize worker
 */
async function initializeWorker() {
  try {
    logger.info('Initializing queue worker');

    // Initialize database connection
    await database.initialize();

    // Setup queue processors
    setupPaymentProcessors();
    setupNotificationProcessors();
    setupPayoutProcessors();
    setupCommissionProcessors();
    setupStatsProcessors();
    setupReportProcessors();

    logger.info('Queue worker initialized successfully');

    // Setup health check
    startHealthCheck();
  } catch (error) {
    logger.error('Failed to initialize worker', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Setup payment processors
 */
function setupPaymentProcessors() {
  const paymentsQueue = queueService.queues.payments;

  // Verify payment
  paymentsQueue.process('verify-payment', 3, async (job) => {
    logger.info('Processing verify-payment job', { jobId: job.id });

    const { subscriptionId, provider, transactionId, reference } = job.data;

    try {
      // Verify payment with provider
      const verificationResult = await paymentService.verifyPayment(provider, transactionId);

      if (verificationResult.verified) {
        // Update subscription status
        await database.query(
          `UPDATE subscriptions
           SET status = 'active',
               payment_verified_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [subscriptionId]
        );

        logger.info('Payment verified successfully', {
          subscriptionId,
          transactionId,
          provider
        });

        // Trigger commission calculation
        await queueService.addCommissionCalculation({
          subscriptionId,
          amount: verificationResult.amount,
          currency: verificationResult.currency
        });
      } else {
        logger.warn('Payment verification failed', {
          subscriptionId,
          transactionId,
          status: verificationResult.status
        });
      }

      return verificationResult;
    } catch (error) {
      logger.logError(error, {
        context: 'verify_payment',
        subscriptionId,
        jobId: job.id
      });
      throw error;
    }
  });

  // Process payment callback
  paymentsQueue.process('process-callback', 5, async (job) => {
    logger.info('Processing payment callback', { jobId: job.id });
    // Callback processing is handled in webhook controller
    return { success: true };
  });

  logger.info('Payment processors registered');
}

/**
 * Setup notification processors
 */
function setupNotificationProcessors() {
  const notificationsQueue = queueService.queues.notifications;

  notificationsQueue.process('send-sms', 10, notificationJobs.sendSMS);
  notificationsQueue.process('send-bulk-sms', 2, notificationJobs.sendBulkSMS);
  notificationsQueue.process('send-email', 10, async (job) => {
    // Email sending would be implemented here
    logger.info('Email sending not yet implemented', { jobId: job.id });
    return { success: true };
  });

  logger.info('Notification processors registered');
}

/**
 * Setup payout processors
 */
function setupPayoutProcessors() {
  const payoutsQueue = queueService.queues.payouts;

  payoutsQueue.process('process-payout', 2, payoutJobs.processSinglePayout);
  payoutsQueue.process('process-batch-payouts', 1, payoutJobs.processBatchPayouts);

  logger.info('Payout processors registered');
}

/**
 * Setup commission processors
 */
function setupCommissionProcessors() {
  const commissionsQueue = queueService.queues.commissions;

  // Calculate commission for subscription
  commissionsQueue.process('calculate-commission', 5, async (job) => {
    const { subscriptionId, affiliateId, amount, currency } = job.data;

    logger.info('Calculating commission', {
      subscriptionId,
      affiliateId,
      jobId: job.id
    });

    try {
      return await database.transaction(async (client) => {
        // Get affiliate and commission rates
        const affiliateResult = await client.query(
          `SELECT a.*, a.tier, a.parent_id
           FROM affiliates a
           WHERE a.id = $1 AND a.status = 'active'`,
          [affiliateId]
        );

        if (affiliateResult.rows.length === 0) {
          throw new Error('Affiliate not found or inactive');
        }

        const affiliate = affiliateResult.rows[0];

        // Calculate direct commission
        const directRate = parseFloat(process.env.COMMISSION_DIRECT_RATE || 0.10);
        const directAmount = amount * directRate;

        // Create direct commission
        await client.query(
          `INSERT INTO commissions (
            affiliate_id, subscription_id, amount, currency,
            commission_rate, commission_level, status
          )
          VALUES ($1, $2, $3, $4, $5, 1, 'pending')`,
          [affiliateId, subscriptionId, directAmount, currency, directRate]
        );

        logger.logCommission('created', {
          affiliateId,
          subscriptionId,
          amount: directAmount,
          level: 1
        });

        // Calculate network commissions (level 2 and 3)
        let parentId = affiliate.parent_id;
        let level = 2;
        const maxLevel = parseInt(process.env.AFFILIATE_MAX_NETWORK_DEPTH || 3);

        while (parentId && level <= maxLevel) {
          const parentResult = await client.query(
            'SELECT id, parent_id, status FROM affiliates WHERE id = $1',
            [parentId]
          );

          if (parentResult.rows.length === 0 || parentResult.rows[0].status !== 'active') {
            break;
          }

          const parent = parentResult.rows[0];

          // Get commission rate for this level
          const levelRate = level === 2
            ? parseFloat(process.env.COMMISSION_LEVEL2_RATE || 0.05)
            : parseFloat(process.env.COMMISSION_LEVEL3_RATE || 0.03);

          const levelAmount = amount * levelRate;

          // Create network commission
          await client.query(
            `INSERT INTO commissions (
              affiliate_id, subscription_id, amount, currency,
              commission_rate, commission_level, status,
              parent_subscription_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
            [parent.id, subscriptionId, levelAmount, currency, levelRate, level, subscriptionId]
          );

          logger.logCommission('created', {
            affiliateId: parent.id,
            subscriptionId,
            amount: levelAmount,
            level
          });

          parentId = parent.parent_id;
          level++;
        }

        // Refresh affiliate stats
        await queueService.addStatsRefresh('affiliate', affiliateId);

        return {
          success: true,
          directCommission: directAmount,
          networkLevels: level - 2
        };
      });
    } catch (error) {
      logger.logError(error, {
        context: 'calculate_commission',
        subscriptionId,
        affiliateId,
        jobId: job.id
      });
      throw error;
    }
  });

  logger.info('Commission processors registered');
}

/**
 * Setup stats processors
 */
function setupStatsProcessors() {
  const statsQueue = queueService.queues.stats;

  statsQueue.process('refresh-stats', 3, async (job) => {
    const { statsType, entityId } = job.data;

    switch (statsType) {
      case 'affiliate':
        return await statsJobs.refreshAffiliateStats({
          ...job,
          data: { affiliateId: entityId }
        });
      case 'daily':
        return await statsJobs.refreshDailyStats(job);
      default:
        logger.warn('Unknown stats type', { statsType });
        return { success: false };
    }
  });

  statsQueue.process('refresh-materialized-view', 1, statsJobs.refreshMaterializedView);

  logger.info('Stats processors registered');
}

/**
 * Setup report processors
 */
function setupReportProcessors() {
  const reportsQueue = queueService.queues.reports;

  reportsQueue.process('generate-report', 2, async (job) => {
    logger.info('Generating report', {
      reportType: job.data.reportType,
      jobId: job.id
    });

    // Report generation logic would be implemented here
    return { success: true };
  });

  reportsQueue.process('generate-daily-report', 1, async (job) => {
    logger.info('Generating daily report', {
      date: job.data.date,
      jobId: job.id
    });

    // Daily report generation would be implemented here
    return { success: true };
  });

  logger.info('Report processors registered');
}

/**
 * Health check interval
 */
function startHealthCheck() {
  setInterval(async () => {
    if (isShuttingDown) return;

    try {
      const health = await queueService.healthCheck();

      if (!health.healthy) {
        logger.warn('Queue health check failed', { health });
      }
    } catch (error) {
      logger.logError(error, { context: 'worker_health_check' });
    }
  }, 60000); // Every minute

  logger.info('Health check started');
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, starting graceful shutdown`);

  isShuttingDown = true;

  // Stop accepting new jobs
  const queues = Object.values(queueService.queues);

  try {
    // Pause all queues
    await Promise.all(queues.map(queue => queue.pause()));
    logger.info('All queues paused');

    // Wait for active jobs to complete (max 30 seconds)
    const waitForJobs = async () => {
      const timeout = 30000;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const activeJobCounts = await Promise.all(
          queues.map(queue => queue.getActiveCount())
        );

        const totalActive = activeJobCounts.reduce((sum, count) => sum + count, 0);

        if (totalActive === 0) {
          logger.info('All active jobs completed');
          return;
        }

        logger.info(`Waiting for ${totalActive} active jobs to complete`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.warn('Shutdown timeout reached, some jobs may be incomplete');
    };

    await waitForJobs();

    // Close all queues
    await queueService.closeAll();

    // Close database connection
    await database.close();

    logger.info('Worker shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start worker
initializeWorker().catch((error) => {
  logger.error('Fatal error starting worker', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

export default {
  initializeWorker,
  gracefulShutdown
};
