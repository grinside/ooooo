import database from '../config/database.js';
import paymentService from '../services/paymentService.js';
import smsService from '../services/smsService.js';
import logger from '../utils/logger.js';
import { PaymentError, InsufficientBalanceError } from '../utils/errors.js';

/**
 * Process Payouts Job
 * Handles processing of pending affiliate payouts
 */

/**
 * Process a single payout
 */
export async function processSinglePayout(job) {
  const { payoutId, adminId } = job.data;

  logger.info('Processing payout', { payoutId, jobId: job.id });

  try {
    return await database.transaction(async (client) => {
      // Get payout details
      const payoutResult = await client.query(
        `SELECT p.*, a.code as affiliate_code, u.name, u.phone, u.email
         FROM payouts p
         JOIN affiliates a ON p.affiliate_id = a.id
         JOIN users u ON a.user_id = u.id
         WHERE p.id = $1 AND p.status = 'pending'
         FOR UPDATE`,
        [payoutId]
      );

      if (payoutResult.rows.length === 0) {
        throw new Error('Payout not found or already processed');
      }

      const payout = payoutResult.rows[0];

      // Verify affiliate has sufficient balance
      const balanceResult = await client.query(
        `SELECT
           COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_balance,
           COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_balance
         FROM commissions
         WHERE affiliate_id = $1`,
        [payout.affiliate_id]
      );

      const balance = balanceResult.rows[0];
      const availableBalance = parseFloat(balance.pending_balance);

      if (availableBalance < parseFloat(payout.amount)) {
        throw new InsufficientBalanceError(
          'Insufficient balance for payout',
          availableBalance,
          parseFloat(payout.amount)
        );
      }

      // Update payout status to processing
      await client.query(
        `UPDATE payouts
         SET status = 'processing',
             processing_started_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [payoutId]
      );

      // Process payment through provider
      let paymentResult;
      try {
        paymentResult = await paymentService.processPayout({
          provider: payout.payment_provider,
          amount: parseFloat(payout.amount),
          currency: payout.currency,
          phone: payout.payment_details?.phone || payout.phone,
          reference: payout.reference,
          affiliateId: payout.affiliate_id,
          metadata: {
            payoutId: payout.id,
            affiliateCode: payout.affiliate_code,
            type: 'affiliate_payout'
          }
        });
      } catch (error) {
        // Update payout as failed
        await client.query(
          `UPDATE payouts
           SET status = 'failed',
               failure_reason = $1,
               processing_completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [error.message, payoutId]
        );

        throw error;
      }

      // Update payout as completed
      await client.query(
        `UPDATE payouts
         SET status = 'completed',
             transaction_id = $1,
             processing_completed_at = NOW(),
             completed_at = NOW(),
             processed_by = $2,
             payment_metadata = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          paymentResult.transactionId,
          adminId,
          JSON.stringify(paymentResult.metadata || {}),
          payoutId
        ]
      );

      // Update commissions to paid
      await client.query(
        `UPDATE commissions
         SET status = 'paid',
             paid_at = NOW(),
             payout_id = $1,
             updated_at = NOW()
         WHERE affiliate_id = $2
           AND status = 'pending'
           AND id IN (
             SELECT commission_id
             FROM payout_commissions
             WHERE payout_id = $1
           )`,
        [payoutId, payout.affiliate_id]
      );

      // Log payout completion
      await client.query(
        `INSERT INTO payout_logs (payout_id, action, status, details, created_by)
         VALUES ($1, 'completed', 'completed', $2, $3)`,
        [
          payoutId,
          JSON.stringify({
            transactionId: paymentResult.transactionId,
            provider: payout.payment_provider,
            amount: payout.amount
          }),
          adminId
        ]
      );

      logger.info('Payout processed successfully', {
        payoutId,
        affiliateId: payout.affiliate_id,
        amount: payout.amount,
        transactionId: paymentResult.transactionId
      });

      // Send SMS notification
      await smsService.sendSMS({
        to: payout.phone,
        message: `Your Max IT TV payout of ${payout.amount} ${payout.currency} has been processed. Ref: ${payout.reference}. Transaction ID: ${paymentResult.transactionId}`
      });

      return {
        success: true,
        payoutId,
        transactionId: paymentResult.transactionId,
        amount: payout.amount
      };
    });
  } catch (error) {
    logger.logError(error, {
      context: 'process_payout',
      payoutId,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Process batch payouts
 */
export async function processBatchPayouts(job) {
  const { payoutIds, adminId } = job.data;

  logger.info('Processing batch payouts', {
    count: payoutIds.length,
    adminId,
    jobId: job.id
  });

  const results = {
    successful: [],
    failed: []
  };

  for (const payoutId of payoutIds) {
    try {
      const result = await processSinglePayout({
        data: { payoutId, adminId },
        id: `${job.id}-${payoutId}`
      });

      results.successful.push({
        payoutId,
        transactionId: result.transactionId
      });

      // Add delay between payouts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      logger.logError(error, {
        context: 'batch_payout_item',
        payoutId
      });

      results.failed.push({
        payoutId,
        error: error.message
      });

      // Update payout as failed if not already updated
      await database.query(
        `UPDATE payouts
         SET status = 'failed',
             failure_reason = $1,
             updated_at = NOW()
         WHERE id = $2 AND status != 'failed'`,
        [error.message, payoutId]
      );
    }
  }

  logger.info('Batch payout processing completed', {
    total: payoutIds.length,
    successful: results.successful.length,
    failed: results.failed.length,
    jobId: job.id
  });

  return results;
}

/**
 * Auto-process payouts (scheduled job)
 * Process all pending payouts that meet criteria
 */
export async function autoProcessPayouts(job) {
  logger.info('Auto-processing payouts', { jobId: job.id });

  try {
    // Get all pending payouts that are ready for processing
    const result = await database.query(
      `SELECT p.id
       FROM payouts p
       WHERE p.status = 'pending'
         AND p.requested_at <= NOW() - INTERVAL '24 hours'
       ORDER BY p.requested_at ASC
       LIMIT 100`
    );

    if (result.rows.length === 0) {
      logger.info('No pending payouts to process');
      return { processed: 0 };
    }

    const payoutIds = result.rows.map(row => row.id);

    logger.info(`Found ${payoutIds.length} payouts to auto-process`);

    // Process them using batch processor
    const batchResult = await processBatchPayouts({
      data: { payoutIds, adminId: null },
      id: job.id
    });

    return {
      total: payoutIds.length,
      successful: batchResult.successful.length,
      failed: batchResult.failed.length
    };
  } catch (error) {
    logger.logError(error, {
      context: 'auto_process_payouts',
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Generate monthly payout requests
 * Create payout requests for affiliates with sufficient balance
 */
export async function generateMonthlyPayouts(job) {
  const { month, year } = job.data;

  logger.info('Generating monthly payouts', { month, year, jobId: job.id });

  try {
    const results = await database.transaction(async (client) => {
      // Get all affiliates with sufficient pending commissions
      const affiliatesResult = await client.query(
        `SELECT
           a.id as affiliate_id,
           a.code,
           u.id as user_id,
           u.phone,
           a.preferred_payout_provider,
           a.payout_details,
           SUM(c.amount) as total_pending,
           a.currency
         FROM affiliates a
         JOIN users u ON a.user_id = u.id
         JOIN commissions c ON a.id = c.affiliate_id
         WHERE a.status = 'active'
           AND c.status = 'pending'
           AND c.created_at < DATE_TRUNC('month', NOW())
         GROUP BY a.id, a.code, u.id, u.phone, a.preferred_payout_provider, a.payout_details, a.currency
         HAVING SUM(c.amount) >= $1`,
        [parseFloat(process.env.MINIMUM_PAYOUT || 10000)]
      );

      const created = [];

      for (const affiliate of affiliatesResult.rows) {
        // Get commissions to include in payout
        const commissionsResult = await client.query(
          `SELECT id, amount
           FROM commissions
           WHERE affiliate_id = $1
             AND status = 'pending'
             AND created_at < DATE_TRUNC('month', NOW())`,
          [affiliate.affiliate_id]
        );

        const commissionIds = commissionsResult.rows.map(c => c.id);
        const totalAmount = parseFloat(affiliate.total_pending);

        // Calculate processing fee (2%)
        const processingFee = totalAmount * 0.02;
        const netAmount = totalAmount - processingFee;

        // Generate reference
        const reference = `PAYOUT-${year}${String(month).padStart(2, '0')}-${affiliate.code}`;

        // Create payout request
        const payoutResult = await client.query(
          `INSERT INTO payouts (
            affiliate_id, reference, amount, currency,
            payment_provider, payment_details, status,
            commission_amount, processing_fee, net_amount,
            requested_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, NOW())
          RETURNING id`,
          [
            affiliate.affiliate_id,
            reference,
            netAmount,
            affiliate.currency,
            affiliate.preferred_payout_provider || 'orange_money',
            affiliate.payout_details || { phone: affiliate.phone },
            totalAmount,
            processingFee,
            netAmount
          ]
        );

        const payoutId = payoutResult.rows[0].id;

        // Link commissions to payout
        for (const commissionId of commissionIds) {
          await client.query(
            `INSERT INTO payout_commissions (payout_id, commission_id)
             VALUES ($1, $2)`,
            [payoutId, commissionId]
          );
        }

        created.push({
          affiliateId: affiliate.affiliate_id,
          payoutId,
          reference,
          amount: netAmount
        });

        logger.info('Payout request created', {
          affiliateId: affiliate.affiliate_id,
          payoutId,
          amount: netAmount
        });
      }

      return created;
    });

    logger.info('Monthly payout generation completed', {
      created: results.length,
      month,
      year
    });

    return {
      success: true,
      created: results.length,
      payouts: results
    };
  } catch (error) {
    logger.logError(error, {
      context: 'generate_monthly_payouts',
      month,
      year,
      jobId: job.id
    });

    throw error;
  }
}

export default {
  processSinglePayout,
  processBatchPayouts,
  autoProcessPayouts,
  generateMonthlyPayouts
};
