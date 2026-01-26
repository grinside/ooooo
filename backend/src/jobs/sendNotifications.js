import smsService from '../services/smsService.js';
import database from '../config/database.js';
import logger from '../utils/logger.js';
import { addDays, format } from 'date-fns';

/**
 * Send Notifications Job
 * Handles sending SMS and email notifications
 */

/**
 * Send single SMS notification
 */
export async function sendSMS(job) {
  const { phone, message, urgent = false } = job.data;

  logger.info('Sending SMS', {
    phone: phone.slice(0, 4) + '****',
    urgent,
    jobId: job.id
  });

  try {
    const result = await smsService.sendSMS({
      to: phone,
      message
    });

    logger.info('SMS sent successfully', {
      phone: phone.slice(0, 4) + '****',
      messageId: result.messageId,
      jobId: job.id
    });

    return result;
  } catch (error) {
    logger.logError(error, {
      context: 'send_sms',
      phone: phone.slice(0, 4) + '****',
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(job) {
  const { recipients, message } = job.data;

  logger.info('Sending bulk SMS', {
    count: recipients.length,
    jobId: job.id
  });

  const results = {
    successful: [],
    failed: []
  };

  for (const phone of recipients) {
    try {
      const result = await smsService.sendSMS({
        to: phone,
        message
      });

      results.successful.push({
        phone: phone.slice(0, 4) + '****',
        messageId: result.messageId
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.logError(error, {
        context: 'bulk_sms_item',
        phone: phone.slice(0, 4) + '****'
      });

      results.failed.push({
        phone: phone.slice(0, 4) + '****',
        error: error.message
      });
    }
  }

  logger.info('Bulk SMS completed', {
    total: recipients.length,
    successful: results.successful.length,
    failed: results.failed.length,
    jobId: job.id
  });

  return results;
}

/**
 * Send subscription renewal reminders
 */
export async function sendRenewalReminders(job) {
  logger.info('Sending subscription renewal reminders', { jobId: job.id });

  try {
    // Get subscriptions expiring in 3 days
    const reminderDays = parseInt(process.env.SUBSCRIPTION_REMINDER_DAYS || '3');
    const targetDate = addDays(new Date(), reminderDays);

    const result = await database.query(
      `SELECT s.id, s.reference, s.end_date, s.amount, s.currency,
              c.name as customer_name, c.phone as customer_phone,
              o.name as offer_name
       FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       JOIN subscription_offers o ON s.offer_id = o.id
       WHERE s.status = 'active'
         AND DATE(s.end_date) = DATE($1)
         AND s.renewal_reminder_sent = FALSE`,
      [targetDate]
    );

    const sent = [];

    for (const subscription of result.rows) {
      try {
        const expiryDate = format(new Date(subscription.end_date), 'dd/MM/yyyy');

        const message = `Hi ${subscription.customer_name}, your Max IT TV subscription (${subscription.offer_name}) expires on ${expiryDate}. Renew now to continue enjoying our services! Ref: ${subscription.reference}`;

        await smsService.sendSMS({
          to: subscription.customer_phone,
          message
        });

        // Mark reminder as sent
        await database.query(
          `UPDATE subscriptions
           SET renewal_reminder_sent = TRUE,
               updated_at = NOW()
           WHERE id = $1`,
          [subscription.id]
        );

        sent.push(subscription.id);

        logger.info('Renewal reminder sent', {
          subscriptionId: subscription.id,
          expiryDate
        });

        // Add delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.logError(error, {
          context: 'renewal_reminder_item',
          subscriptionId: subscription.id
        });
      }
    }

    logger.info('Renewal reminders completed', {
      total: result.rows.length,
      sent: sent.length
    });

    return {
      success: true,
      total: result.rows.length,
      sent: sent.length
    };
  } catch (error) {
    logger.logError(error, {
      context: 'send_renewal_reminders',
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Send expiry notifications
 */
export async function sendExpiryNotifications(job) {
  logger.info('Sending expiry notifications', { jobId: job.id });

  try {
    // Get subscriptions that expired today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await database.query(
      `SELECT s.id, s.reference,
              c.name as customer_name, c.phone as customer_phone,
              o.name as offer_name
       FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       JOIN subscription_offers o ON s.offer_id = o.id
       WHERE s.status = 'active'
         AND DATE(s.end_date) = DATE($1)
         AND s.expiry_notification_sent = FALSE`,
      [today]
    );

    const sent = [];

    for (const subscription of result.rows) {
      try {
        const message = `Hi ${subscription.customer_name}, your Max IT TV subscription (${subscription.offer_name}) has expired. Renew now to continue enjoying our services! Ref: ${subscription.reference}`;

        await smsService.sendSMS({
          to: subscription.customer_phone,
          message
        });

        // Update subscription status to expired
        await database.query(
          `UPDATE subscriptions
           SET status = 'expired',
               expiry_notification_sent = TRUE,
               updated_at = NOW()
           WHERE id = $1`,
          [subscription.id]
        );

        sent.push(subscription.id);

        logger.info('Expiry notification sent', {
          subscriptionId: subscription.id
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.logError(error, {
          context: 'expiry_notification_item',
          subscriptionId: subscription.id
        });
      }
    }

    logger.info('Expiry notifications completed', {
      total: result.rows.length,
      sent: sent.length
    });

    return {
      success: true,
      total: result.rows.length,
      sent: sent.length
    };
  } catch (error) {
    logger.logError(error, {
      context: 'send_expiry_notifications',
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Send welcome SMS to new affiliates
 */
export async function sendWelcomeSMS(job) {
  const { affiliateId, userName, affiliateCode } = job.data;

  logger.info('Sending welcome SMS to affiliate', {
    affiliateId,
    jobId: job.id
  });

  try {
    // Get affiliate details
    const result = await database.query(
      `SELECT u.phone
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [affiliateId]
    );

    if (result.rows.length === 0) {
      throw new Error('Affiliate not found');
    }

    const affiliate = result.rows[0];

    const message = `Welcome to Max IT TV Affiliate Program, ${userName}! Your affiliate code is: ${affiliateCode}. Start sharing and earning commissions today! Visit ${process.env.APP_URL}/affiliate to get your links.`;

    await smsService.sendSMS({
      to: affiliate.phone,
      message
    });

    logger.info('Welcome SMS sent', { affiliateId });

    return { success: true, affiliateId };
  } catch (error) {
    logger.logError(error, {
      context: 'send_welcome_sms',
      affiliateId,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Send commission earned notification
 */
export async function sendCommissionNotification(job) {
  const { affiliateId, amount, currency, subscriptionReference } = job.data;

  logger.info('Sending commission notification', {
    affiliateId,
    amount,
    jobId: job.id
  });

  try {
    // Get affiliate details
    const result = await database.query(
      `SELECT u.name, u.phone, a.code
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [affiliateId]
    );

    if (result.rows.length === 0) {
      throw new Error('Affiliate not found');
    }

    const affiliate = result.rows[0];

    const message = `Congratulations ${affiliate.name}! You earned ${amount} ${currency} commission from subscription ${subscriptionReference}. Keep up the great work!`;

    await smsService.sendSMS({
      to: affiliate.phone,
      message
    });

    logger.info('Commission notification sent', { affiliateId, amount });

    return { success: true, affiliateId };
  } catch (error) {
    logger.logError(error, {
      context: 'send_commission_notification',
      affiliateId,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Send payout notification
 */
export async function sendPayoutNotification(job) {
  const { payoutId } = job.data;

  logger.info('Sending payout notification', { payoutId, jobId: job.id });

  try {
    // Get payout details
    const result = await database.query(
      `SELECT p.reference, p.amount, p.currency, p.status,
              u.name, u.phone
       FROM payouts p
       JOIN affiliates a ON p.affiliate_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE p.id = $1`,
      [payoutId]
    );

    if (result.rows.length === 0) {
      throw new Error('Payout not found');
    }

    const payout = result.rows[0];

    let message;
    if (payout.status === 'completed') {
      message = `Hi ${payout.name}, your payout of ${payout.amount} ${payout.currency} has been processed successfully! Ref: ${payout.reference}`;
    } else if (payout.status === 'failed') {
      message = `Hi ${payout.name}, your payout request ${payout.reference} could not be processed. Please contact support for assistance.`;
    } else {
      message = `Hi ${payout.name}, your payout request of ${payout.amount} ${payout.currency} is being processed. Ref: ${payout.reference}`;
    }

    await smsService.sendSMS({
      to: payout.phone,
      message
    });

    logger.info('Payout notification sent', { payoutId, status: payout.status });

    return { success: true, payoutId };
  } catch (error) {
    logger.logError(error, {
      context: 'send_payout_notification',
      payoutId,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Send daily summary to affiliates
 */
export async function sendDailySummary(job) {
  logger.info('Sending daily summaries to affiliates', { jobId: job.id });

  try {
    // Get active affiliates with activity today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await database.query(
      `SELECT
         a.id as affiliate_id,
         u.name, u.phone,
         COUNT(DISTINCT s.id) as daily_sales,
         COALESCE(SUM(c.amount), 0) as daily_earnings
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN subscriptions s ON a.id = s.affiliate_id
         AND DATE(s.created_at) = DATE($1)
       LEFT JOIN commissions c ON a.id = c.affiliate_id
         AND DATE(c.created_at) = DATE($1)
       WHERE a.status = 'active'
         AND a.daily_summary_enabled = TRUE
       GROUP BY a.id, u.name, u.phone
       HAVING COUNT(DISTINCT s.id) > 0`,
      [today]
    );

    const sent = [];

    for (const affiliate of result.rows) {
      try {
        const message = `Max IT TV Daily Summary: You made ${affiliate.daily_sales} sale(s) today and earned ${affiliate.daily_earnings} XOF. Keep it up, ${affiliate.name}!`;

        await smsService.sendSMS({
          to: affiliate.phone,
          message
        });

        sent.push(affiliate.affiliate_id);

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.logError(error, {
          context: 'daily_summary_item',
          affiliateId: affiliate.affiliate_id
        });
      }
    }

    logger.info('Daily summaries sent', {
      total: result.rows.length,
      sent: sent.length
    });

    return {
      success: true,
      total: result.rows.length,
      sent: sent.length
    };
  } catch (error) {
    logger.logError(error, {
      context: 'send_daily_summary',
      jobId: job.id
    });

    throw error;
  }
}

export default {
  sendSMS,
  sendBulkSMS,
  sendRenewalReminders,
  sendExpiryNotifications,
  sendWelcomeSMS,
  sendCommissionNotification,
  sendPayoutNotification,
  sendDailySummary
};
