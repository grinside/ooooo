import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import logger from './utils/logger.js';
import database from './config/database.js';
import queueService from './services/queueService.js';

// Import job modules
import * as payoutJobs from './jobs/processPayouts.js';
import * as notificationJobs from './jobs/sendNotifications.js';
import * as statsJobs from './jobs/refreshStats.js';

/**
 * Cron Scheduler
 * Schedules periodic background tasks
 */

// Track scheduled tasks
const scheduledTasks = new Map();
let isShuttingDown = false;

/**
 * Initialize scheduler
 */
async function initializeScheduler() {
  try {
    logger.info('Initializing task scheduler');

    // Initialize database connection
    await database.initialize();

    // Setup scheduled tasks
    setupScheduledTasks();

    logger.info('Task scheduler initialized successfully', {
      tasks: scheduledTasks.size
    });
  } catch (error) {
    logger.error('Failed to initialize scheduler', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Setup all scheduled tasks
 */
function setupScheduledTasks() {
  // Every 15 minutes - Refresh affiliate stats
  scheduleTask('refresh-affiliate-stats', '*/15 * * * *', async () => {
    logger.info('Running scheduled task: refresh-affiliate-stats');
    await queueService.addStatsRefresh('affiliate', null);
  });

  // Every day at 00:30 - Refresh daily stats
  scheduleTask('refresh-daily-stats', '30 0 * * *', async () => {
    logger.info('Running scheduled task: refresh-daily-stats');
    await queueService.addStatsRefresh('daily', null);
  });

  // Every day at 01:00 - Refresh materialized views
  scheduleTask('refresh-materialized-views', '0 1 * * *', async () => {
    logger.info('Running scheduled task: refresh-materialized-views');
    const views = [
      'mv_affiliate_performance',
      'mv_subscription_summary',
      'mv_revenue_by_country',
      'mv_commission_summary'
    ];

    for (const view of views) {
      await queueService.addMaterializedViewRefresh(view);
    }
  });

  // Every day at 02:00 - Send renewal reminders
  scheduleTask('send-renewal-reminders', '0 2 * * *', async () => {
    logger.info('Running scheduled task: send-renewal-reminders');
    await queueService.queues.notifications.add(
      'renewal-reminders',
      {},
      { priority: 5 }
    );
  });

  // Every day at 03:00 - Send expiry notifications
  scheduleTask('send-expiry-notifications', '0 3 * * *', async () => {
    logger.info('Running scheduled task: send-expiry-notifications');
    await queueService.queues.notifications.add(
      'expiry-notifications',
      {},
      { priority: 5 }
    );
  });

  // Every day at 20:00 - Send daily summaries to affiliates
  scheduleTask('send-daily-summaries', '0 20 * * *', async () => {
    logger.info('Running scheduled task: send-daily-summaries');
    await queueService.queues.notifications.add(
      'daily-summaries',
      {},
      { priority: 10 }
    );
  });

  // Every hour - Update leaderboard
  scheduleTask('refresh-leaderboard', '0 * * * *', async () => {
    logger.info('Running scheduled task: refresh-leaderboard');
    await queueService.queues.stats.add(
      'refresh-leaderboard',
      { period: 'month' },
      { priority: 10 }
    );
  });

  // Every 6 hours - Refresh weekly leaderboard
  scheduleTask('refresh-weekly-leaderboard', '0 */6 * * *', async () => {
    logger.info('Running scheduled task: refresh-weekly-leaderboard');
    await queueService.queues.stats.add(
      'refresh-leaderboard',
      { period: 'week' },
      { priority: 10 }
    );
  });

  // First day of month at 04:00 - Generate monthly payouts
  scheduleTask('generate-monthly-payouts', '0 4 1 * *', async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = lastMonth.getMonth() + 1;
    const year = lastMonth.getFullYear();

    logger.info('Running scheduled task: generate-monthly-payouts', {
      month,
      year
    });

    await queueService.queues.payouts.add(
      'generate-monthly-payouts',
      { month, year },
      { priority: 1 }
    );
  });

  // Every day at 05:00 - Auto-process approved payouts
  scheduleTask('auto-process-payouts', '0 5 * * *', async () => {
    logger.info('Running scheduled task: auto-process-payouts');

    if (process.env.FEATURE_AUTO_PAYOUTS === 'true') {
      await queueService.queues.payouts.add(
        'auto-process-payouts',
        {},
        { priority: 2 }
      );
    } else {
      logger.info('Auto payouts feature is disabled');
    }
  });

  // Every Sunday at 06:00 - Clean old data
  scheduleTask('clean-old-data', '0 6 * * 0', async () => {
    logger.info('Running scheduled task: clean-old-data');
    await queueService.queues.stats.add(
      'clean-old-data',
      {},
      { priority: 15 }
    );
  });

  // Every day at 07:00 - Database maintenance
  scheduleTask('database-maintenance', '0 7 * * *', async () => {
    logger.info('Running scheduled task: database-maintenance');
    await queueService.queues.stats.add(
      'vacuum-database',
      {},
      { priority: 15 }
    );
  });

  // Every 30 minutes - Clean completed queue jobs
  scheduleTask('clean-queue-jobs', '*/30 * * * *', async () => {
    logger.info('Running scheduled task: clean-queue-jobs');

    const queues = Object.keys(queueService.queues);
    for (const queueName of queues) {
      try {
        // Clean jobs older than 24 hours
        await queueService.cleanQueue(queueName, 24 * 60 * 60 * 1000);
      } catch (error) {
        logger.logError(error, {
          context: 'clean_queue_jobs',
          queueName
        });
      }
    }
  });

  // Every 5 minutes - Process pending payment verifications
  scheduleTask('verify-pending-payments', '*/5 * * * *', async () => {
    logger.info('Running scheduled task: verify-pending-payments');

    try {
      // Get subscriptions with pending payments older than 5 minutes
      const result = await database.query(
        `SELECT id, payment_provider, payment_transaction_id, reference
         FROM subscriptions
         WHERE status = 'pending'
           AND payment_transaction_id IS NOT NULL
           AND updated_at < NOW() - INTERVAL '5 minutes'
           AND updated_at > NOW() - INTERVAL '1 hour'
         LIMIT 50`
      );

      for (const subscription of result.rows) {
        await queueService.addPaymentVerification({
          subscriptionId: subscription.id,
          provider: subscription.payment_provider,
          transactionId: subscription.payment_transaction_id,
          reference: subscription.reference
        });
      }

      if (result.rows.length > 0) {
        logger.info('Queued payment verifications', {
          count: result.rows.length
        });
      }
    } catch (error) {
      logger.logError(error, {
        context: 'verify_pending_payments'
      });
    }
  });

  // Every day at 08:00 - Generate daily report
  scheduleTask('generate-daily-report', '0 8 * * *', async () => {
    logger.info('Running scheduled task: generate-daily-report');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await queueService.addDailyReport(yesterday);
  });

  logger.info('All scheduled tasks registered', {
    count: scheduledTasks.size
  });
}

/**
 * Schedule a task
 */
function scheduleTask(name, cronExpression, taskFunction) {
  try {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const task = cron.schedule(cronExpression, async () => {
      if (isShuttingDown) {
        logger.info('Skipping scheduled task during shutdown', { name });
        return;
      }

      const startTime = Date.now();

      try {
        await taskFunction();

        const duration = Date.now() - startTime;
        logger.info('Scheduled task completed', {
          name,
          duration: `${duration}ms`
        });
      } catch (error) {
        logger.logError(error, {
          context: 'scheduled_task',
          taskName: name
        });
      }
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    scheduledTasks.set(name, {
      task,
      cronExpression,
      name
    });

    logger.info('Scheduled task registered', {
      name,
      cronExpression,
      timezone: process.env.TZ || 'UTC'
    });
  } catch (error) {
    logger.error('Failed to schedule task', {
      name,
      cronExpression,
      error: error.message
    });
  }
}

/**
 * Get scheduled tasks status
 */
function getTasksStatus() {
  const tasks = [];

  for (const [name, taskInfo] of scheduledTasks) {
    tasks.push({
      name,
      cronExpression: taskInfo.cronExpression,
      nextRun: null // cron doesn't expose next run time easily
    });
  }

  return tasks;
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, stopping scheduler`);

  isShuttingDown = true;

  try {
    // Stop all scheduled tasks
    for (const [name, taskInfo] of scheduledTasks) {
      taskInfo.task.stop();
      logger.info('Stopped scheduled task', { name });
    }

    // Close queue connections
    await queueService.closeAll();

    // Close database connection
    await database.close();

    logger.info('Scheduler shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during scheduler shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start scheduler
initializeScheduler().catch((error) => {
  logger.error('Fatal error starting scheduler', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

export default {
  initializeScheduler,
  scheduleTask,
  getTasksStatus,
  gracefulShutdown
};
