import Queue from 'bull';
import logger from '../utils/logger.js';

/**
 * Queue Service - Manages background job queues using Bull
 * Queues: payments, notifications, payouts, stats, reports
 */
class QueueService {
  constructor() {
    this.queues = {};
    this.redisConfig = {
      host: process.env.QUEUE_REDIS_HOST || process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.QUEUE_REDIS_PORT || process.env.REDIS_PORT || 6379),
      password: process.env.QUEUE_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
      db: 1, // Use separate DB for queues
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    };

    this.initializeQueues();
  }

  /**
   * Initialize all queues
   */
  initializeQueues() {
    // Payment processing queue
    this.queues.payments = new Queue('payments', {
      redis: this.redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });

    // Notification queue (SMS, Email, Push)
    this.queues.notifications = new Queue('notifications', {
      redis: this.redisConfig,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 50,
        removeOnFail: 200
      }
    });

    // Payout processing queue
    this.queues.payouts = new Queue('payouts', {
      redis: this.redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 200,
        removeOnFail: 1000
      }
    });

    // Stats refresh queue
    this.queues.stats = new Queue('stats', {
      redis: this.redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 10000
        },
        removeOnComplete: 20,
        removeOnFail: 50
      }
    });

    // Reports generation queue
    this.queues.reports = new Queue('reports', {
      redis: this.redisConfig,
      defaultJobOptions: {
        attempts: 2,
        timeout: 300000, // 5 minutes
        removeOnComplete: 10,
        removeOnFail: 50
      }
    });

    // Commission calculation queue
    this.queues.commissions = new Queue('commissions', {
      redis: this.redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });

    logger.info('Queue service initialized', {
      queues: Object.keys(this.queues),
      redis: `${this.redisConfig.host}:${this.redisConfig.port}`
    });

    // Setup event listeners for all queues
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for queue monitoring
   */
  setupEventListeners() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      // Job completed
      queue.on('completed', (job, result) => {
        logger.info(`Job completed in queue ${name}`, {
          jobId: job.id,
          queue: name,
          data: job.data,
          result,
          duration: Date.now() - job.timestamp
        });
      });

      // Job failed
      queue.on('failed', (job, err) => {
        logger.error(`Job failed in queue ${name}`, {
          jobId: job.id,
          queue: name,
          data: job.data,
          error: err.message,
          stack: err.stack,
          attemptsMade: job.attemptsMade,
          attemptsTotal: job.opts.attempts
        });
      });

      // Job stalled
      queue.on('stalled', (job) => {
        logger.warn(`Job stalled in queue ${name}`, {
          jobId: job.id,
          queue: name,
          data: job.data
        });
      });

      // Error in queue
      queue.on('error', (error) => {
        logger.error(`Queue error in ${name}`, {
          queue: name,
          error: error.message,
          stack: error.stack
        });
      });
    });
  }

  /**
   * Add payment verification job
   */
  async addPaymentVerification(paymentData, options = {}) {
    return await this.queues.payments.add('verify-payment', paymentData, {
      delay: options.delay || 30000, // Verify after 30 seconds
      priority: options.priority || 1,
      ...options
    });
  }

  /**
   * Add payment callback processing job
   */
  async addPaymentCallback(callbackData, options = {}) {
    return await this.queues.payments.add('process-callback', callbackData, {
      priority: 1, // High priority
      ...options
    });
  }

  /**
   * Add SMS notification job
   */
  async addSMSNotification(smsData, options = {}) {
    return await this.queues.notifications.add('send-sms', smsData, {
      priority: options.urgent ? 1 : 5,
      ...options
    });
  }

  /**
   * Add bulk SMS job
   */
  async addBulkSMS(recipients, message, options = {}) {
    return await this.queues.notifications.add('send-bulk-sms', { recipients, message }, {
      priority: 10, // Low priority for bulk
      ...options
    });
  }

  /**
   * Add email notification job
   */
  async addEmailNotification(emailData, options = {}) {
    return await this.queues.notifications.add('send-email', emailData, {
      priority: options.urgent ? 1 : 5,
      ...options
    });
  }

  /**
   * Add payout processing job
   */
  async addPayoutProcessing(payoutData, options = {}) {
    return await this.queues.payouts.add('process-payout', payoutData, {
      priority: 1,
      ...options
    });
  }

  /**
   * Add batch payout processing job
   */
  async addBatchPayoutProcessing(payoutIds, options = {}) {
    return await this.queues.payouts.add('process-batch-payouts', { payoutIds }, {
      priority: 2,
      timeout: 600000, // 10 minutes
      ...options
    });
  }

  /**
   * Add commission calculation job
   */
  async addCommissionCalculation(subscriptionData, options = {}) {
    return await this.queues.commissions.add('calculate-commission', subscriptionData, {
      priority: 1,
      ...options
    });
  }

  /**
   * Add network commission calculation job
   */
  async addNetworkCommissionCalculation(affiliateData, options = {}) {
    return await this.queues.commissions.add('calculate-network-commission', affiliateData, {
      priority: 2,
      ...options
    });
  }

  /**
   * Add stats refresh job
   */
  async addStatsRefresh(statsType, entityId, options = {}) {
    return await this.queues.stats.add('refresh-stats', { statsType, entityId }, {
      priority: 5,
      ...options
    });
  }

  /**
   * Add materialized view refresh job
   */
  async addMaterializedViewRefresh(viewName, options = {}) {
    return await this.queues.stats.add('refresh-materialized-view', { viewName }, {
      priority: 10,
      ...options
    });
  }

  /**
   * Add report generation job
   */
  async addReportGeneration(reportConfig, options = {}) {
    return await this.queues.reports.add('generate-report', reportConfig, {
      priority: 5,
      timeout: 600000, // 10 minutes
      ...options
    });
  }

  /**
   * Add daily report job
   */
  async addDailyReport(date, options = {}) {
    return await this.queues.reports.add('generate-daily-report', { date }, {
      priority: 5,
      ...options
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [
      waitingCount,
      activeCount,
      completedCount,
      failedCount,
      delayedCount,
      pausedCount
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount()
    ]);

    return {
      name: queueName,
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      delayed: delayedCount,
      paused: pausedCount,
      total: waitingCount + activeCount + delayedCount
    };
  }

  /**
   * Get all queues statistics
   */
  async getAllQueuesStats() {
    const stats = {};

    for (const queueName of Object.keys(this.queues)) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(queueName, start = 0, end = 10) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failedJobs = await queue.getFailed(start, end);

    return failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    }));
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(queueName, jobId) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.retry();

    logger.info(`Retrying job ${jobId} in queue ${queueName}`);

    return { success: true, jobId, queueName };
  }

  /**
   * Remove job
   */
  async removeJob(queueName, jobId) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    await job.remove();

    logger.info(`Removed job ${jobId} from queue ${queueName}`);

    return { success: true, jobId, queueName };
  }

  /**
   * Clean queue (remove old completed/failed jobs)
   */
  async cleanQueue(queueName, grace = 86400000) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const cleaned = await queue.clean(grace, 'completed');
    const cleanedFailed = await queue.clean(grace, 'failed');

    logger.info(`Cleaned queue ${queueName}`, {
      completedRemoved: cleaned.length,
      failedRemoved: cleanedFailed.length
    });

    return {
      success: true,
      queueName,
      completedRemoved: cleaned.length,
      failedRemoved: cleanedFailed.length
    };
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();

    logger.info(`Paused queue ${queueName}`);

    return { success: true, queueName, status: 'paused' };
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();

    logger.info(`Resumed queue ${queueName}`);

    return { success: true, queueName, status: 'active' };
  }

  /**
   * Empty queue (remove all jobs)
   */
  async emptyQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.empty();

    logger.warn(`Emptied queue ${queueName}`);

    return { success: true, queueName, status: 'empty' };
  }

  /**
   * Close all queues
   */
  async closeAll() {
    logger.info('Closing all queues');

    await Promise.all(
      Object.values(this.queues).map(queue => queue.close())
    );

    logger.info('All queues closed');
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = await this.getAllQueuesStats();

      return {
        healthy: true,
        queues: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.logError(error, { context: 'queue_health_check' });

      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new QueueService();
