import database from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Refresh Stats Job
 * Handles refreshing materialized views and aggregate statistics
 */

/**
 * Refresh affiliate statistics
 */
export async function refreshAffiliateStats(job) {
  const { affiliateId } = job.data || {};

  logger.info('Refreshing affiliate stats', { affiliateId, jobId: job.id });

  try {
    if (affiliateId) {
      // Refresh specific affiliate stats
      await database.query(
        `INSERT INTO affiliate_stats (
          affiliate_id, total_clicks, total_subscriptions,
          active_subscriptions, total_revenue, total_commissions,
          pending_commissions, paid_commissions, conversion_rate,
          last_sale_at, updated_at
        )
        SELECT
          a.id,
          COUNT(DISTINCT ac.id) as total_clicks,
          COUNT(DISTINCT s.id) as total_subscriptions,
          COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
          COALESCE(SUM(s.amount) FILTER (WHERE s.status = 'active'), 0) as total_revenue,
          COALESCE(SUM(c.amount), 0) as total_commissions,
          COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'pending'), 0) as pending_commissions,
          COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'paid'), 0) as paid_commissions,
          CASE
            WHEN COUNT(DISTINCT ac.id) > 0
            THEN (COUNT(DISTINCT s.id)::float / COUNT(DISTINCT ac.id)::float) * 100
            ELSE 0
          END as conversion_rate,
          MAX(s.created_at) as last_sale_at,
          NOW() as updated_at
        FROM affiliates a
        LEFT JOIN affiliate_clicks ac ON a.id = ac.affiliate_id
        LEFT JOIN subscriptions s ON a.id = s.affiliate_id
        LEFT JOIN commissions c ON a.id = c.affiliate_id
        WHERE a.id = $1
        GROUP BY a.id
        ON CONFLICT (affiliate_id)
        DO UPDATE SET
          total_clicks = EXCLUDED.total_clicks,
          total_subscriptions = EXCLUDED.total_subscriptions,
          active_subscriptions = EXCLUDED.active_subscriptions,
          total_revenue = EXCLUDED.total_revenue,
          total_commissions = EXCLUDED.total_commissions,
          pending_commissions = EXCLUDED.pending_commissions,
          paid_commissions = EXCLUDED.paid_commissions,
          conversion_rate = EXCLUDED.conversion_rate,
          last_sale_at = EXCLUDED.last_sale_at,
          updated_at = NOW()`,
        [affiliateId]
      );

      logger.info('Affiliate stats refreshed', { affiliateId });
    } else {
      // Refresh all affiliate stats
      await database.query(
        `INSERT INTO affiliate_stats (
          affiliate_id, total_clicks, total_subscriptions,
          active_subscriptions, total_revenue, total_commissions,
          pending_commissions, paid_commissions, conversion_rate,
          last_sale_at, updated_at
        )
        SELECT
          a.id,
          COUNT(DISTINCT ac.id) as total_clicks,
          COUNT(DISTINCT s.id) as total_subscriptions,
          COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
          COALESCE(SUM(s.amount) FILTER (WHERE s.status = 'active'), 0) as total_revenue,
          COALESCE(SUM(c.amount), 0) as total_commissions,
          COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'pending'), 0) as pending_commissions,
          COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'paid'), 0) as paid_commissions,
          CASE
            WHEN COUNT(DISTINCT ac.id) > 0
            THEN (COUNT(DISTINCT s.id)::float / COUNT(DISTINCT ac.id)::float) * 100
            ELSE 0
          END as conversion_rate,
          MAX(s.created_at) as last_sale_at,
          NOW() as updated_at
        FROM affiliates a
        LEFT JOIN affiliate_clicks ac ON a.id = ac.affiliate_id
        LEFT JOIN subscriptions s ON a.id = s.affiliate_id
        LEFT JOIN commissions c ON a.id = c.affiliate_id
        GROUP BY a.id
        ON CONFLICT (affiliate_id)
        DO UPDATE SET
          total_clicks = EXCLUDED.total_clicks,
          total_subscriptions = EXCLUDED.total_subscriptions,
          active_subscriptions = EXCLUDED.active_subscriptions,
          total_revenue = EXCLUDED.total_revenue,
          total_commissions = EXCLUDED.total_commissions,
          pending_commissions = EXCLUDED.pending_commissions,
          paid_commissions = EXCLUDED.paid_commissions,
          conversion_rate = EXCLUDED.conversion_rate,
          last_sale_at = EXCLUDED.last_sale_at,
          updated_at = NOW()`
      );

      logger.info('All affiliate stats refreshed');
    }

    return { success: true, affiliateId };
  } catch (error) {
    logger.logError(error, {
      context: 'refresh_affiliate_stats',
      affiliateId,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Refresh daily statistics
 */
export async function refreshDailyStats(job) {
  const { date } = job.data || {};
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  logger.info('Refreshing daily stats', { date: targetDate, jobId: job.id });

  try {
    await database.query(
      `INSERT INTO daily_stats (
        date, total_subscriptions, active_subscriptions,
        new_subscriptions, expired_subscriptions,
        total_revenue, total_commissions,
        new_affiliates, active_affiliates,
        total_clicks, conversion_rate
      )
      SELECT
        DATE($1) as date,
        COUNT(DISTINCT s.id) as total_subscriptions,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
        COUNT(DISTINCT s.id) FILTER (WHERE DATE(s.created_at) = DATE($1)) as new_subscriptions,
        COUNT(DISTINCT s.id) FILTER (WHERE DATE(s.end_date) = DATE($1) AND s.status = 'expired') as expired_subscriptions,
        COALESCE(SUM(s.amount) FILTER (WHERE DATE(s.created_at) = DATE($1) AND s.status = 'active'), 0) as total_revenue,
        COALESCE(SUM(c.amount) FILTER (WHERE DATE(c.created_at) = DATE($1)), 0) as total_commissions,
        COUNT(DISTINCT a.id) FILTER (WHERE DATE(a.created_at) = DATE($1)) as new_affiliates,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') as active_affiliates,
        COUNT(DISTINCT ac.id) FILTER (WHERE DATE(ac.created_at) = DATE($1)) as total_clicks,
        CASE
          WHEN COUNT(DISTINCT ac.id) FILTER (WHERE DATE(ac.created_at) = DATE($1)) > 0
          THEN (COUNT(DISTINCT s.id) FILTER (WHERE DATE(s.created_at) = DATE($1))::float /
                COUNT(DISTINCT ac.id) FILTER (WHERE DATE(ac.created_at) = DATE($1))::float) * 100
          ELSE 0
        END as conversion_rate
      FROM subscriptions s
      CROSS JOIN affiliates a
      LEFT JOIN affiliate_clicks ac ON TRUE
      LEFT JOIN commissions c ON TRUE
      ON CONFLICT (date)
      DO UPDATE SET
        total_subscriptions = EXCLUDED.total_subscriptions,
        active_subscriptions = EXCLUDED.active_subscriptions,
        new_subscriptions = EXCLUDED.new_subscriptions,
        expired_subscriptions = EXCLUDED.expired_subscriptions,
        total_revenue = EXCLUDED.total_revenue,
        total_commissions = EXCLUDED.total_commissions,
        new_affiliates = EXCLUDED.new_affiliates,
        active_affiliates = EXCLUDED.active_affiliates,
        total_clicks = EXCLUDED.total_clicks,
        conversion_rate = EXCLUDED.conversion_rate,
        updated_at = NOW()`,
      [targetDate]
    );

    logger.info('Daily stats refreshed', { date: targetDate });

    return { success: true, date: targetDate };
  } catch (error) {
    logger.logError(error, {
      context: 'refresh_daily_stats',
      date: targetDate,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Refresh materialized view
 */
export async function refreshMaterializedView(job) {
  const { viewName } = job.data;

  logger.info('Refreshing materialized view', { viewName, jobId: job.id });

  try {
    const validViews = [
      'mv_affiliate_performance',
      'mv_subscription_summary',
      'mv_revenue_by_country',
      'mv_commission_summary'
    ];

    if (!validViews.includes(viewName)) {
      throw new Error(`Invalid materialized view: ${viewName}`);
    }

    const startTime = Date.now();

    // Refresh the materialized view
    await database.query(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`
    );

    const duration = Date.now() - startTime;

    logger.info('Materialized view refreshed', {
      viewName,
      duration: `${duration}ms`
    });

    return {
      success: true,
      viewName,
      duration
    };
  } catch (error) {
    logger.logError(error, {
      context: 'refresh_materialized_view',
      viewName,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Calculate commission leaderboard
 */
export async function refreshLeaderboard(job) {
  const { period = 'month' } = job.data || {};

  logger.info('Refreshing leaderboard', { period, jobId: job.id });

  try {
    let dateFilter;
    switch (period) {
      case 'week':
        dateFilter = "DATE_TRUNC('week', NOW())";
        break;
      case 'month':
        dateFilter = "DATE_TRUNC('month', NOW())";
        break;
      case 'year':
        dateFilter = "DATE_TRUNC('year', NOW())";
        break;
      case 'all':
        dateFilter = "'1970-01-01'::timestamp";
        break;
      default:
        dateFilter = "DATE_TRUNC('month', NOW())";
    }

    await database.query(
      `INSERT INTO leaderboard (
        period, affiliate_id, rank, total_sales,
        total_revenue, total_commissions, updated_at
      )
      SELECT
        $1 as period,
        a.id as affiliate_id,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.amount), 0) DESC) as rank,
        COUNT(DISTINCT s.id) as total_sales,
        COALESCE(SUM(s.amount), 0) as total_revenue,
        COALESCE(SUM(c.amount), 0) as total_commissions,
        NOW() as updated_at
      FROM affiliates a
      LEFT JOIN subscriptions s ON a.id = s.affiliate_id
        AND s.created_at >= ${dateFilter}
        AND s.status = 'active'
      LEFT JOIN commissions c ON a.id = c.affiliate_id
        AND c.created_at >= ${dateFilter}
      WHERE a.status = 'active'
      GROUP BY a.id
      ORDER BY total_commissions DESC
      LIMIT 100
      ON CONFLICT (period, affiliate_id)
      DO UPDATE SET
        rank = EXCLUDED.rank,
        total_sales = EXCLUDED.total_sales,
        total_revenue = EXCLUDED.total_revenue,
        total_commissions = EXCLUDED.total_commissions,
        updated_at = NOW()`,
      [period]
    );

    logger.info('Leaderboard refreshed', { period });

    return { success: true, period };
  } catch (error) {
    logger.logError(error, {
      context: 'refresh_leaderboard',
      period,
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Clean old data
 */
export async function cleanOldData(job) {
  logger.info('Cleaning old data', { jobId: job.id });

  try {
    const results = {};

    // Clean old payment logs (older than 1 year)
    const paymentLogsResult = await database.query(
      `DELETE FROM payment_logs
       WHERE created_at < NOW() - INTERVAL '1 year'
       RETURNING id`
    );
    results.paymentLogs = paymentLogsResult.rowCount;

    // Clean old affiliate clicks (older than 6 months)
    const clicksResult = await database.query(
      `DELETE FROM affiliate_clicks
       WHERE created_at < NOW() - INTERVAL '6 months'
       AND subscription_id IS NULL
       RETURNING id`
    );
    results.affiliateClicks = clicksResult.rowCount;

    // Clean old failed jobs (older than 30 days)
    // This would be done through Bull queue cleanup

    // Archive old subscriptions (older than 2 years and expired)
    const archiveResult = await database.query(
      `UPDATE subscriptions
       SET archived = TRUE
       WHERE status = 'expired'
         AND end_date < NOW() - INTERVAL '2 years'
         AND archived = FALSE
       RETURNING id`
    );
    results.archivedSubscriptions = archiveResult.rowCount;

    logger.info('Old data cleaned', results);

    return {
      success: true,
      cleaned: results
    };
  } catch (error) {
    logger.logError(error, {
      context: 'clean_old_data',
      jobId: job.id
    });

    throw error;
  }
}

/**
 * Vacuum and analyze database
 */
export async function vacuumDatabase(job) {
  logger.info('Running database maintenance', { jobId: job.id });

  try {
    // Analyze tables for query optimization
    const tables = [
      'subscriptions',
      'affiliates',
      'commissions',
      'payouts',
      'customers',
      'affiliate_clicks'
    ];

    for (const table of tables) {
      await database.query(`ANALYZE ${table}`);
      logger.info(`Analyzed table: ${table}`);
    }

    logger.info('Database maintenance completed');

    return { success: true, tables: tables.length };
  } catch (error) {
    logger.logError(error, {
      context: 'vacuum_database',
      jobId: job.id
    });

    throw error;
  }
}

export default {
  refreshAffiliateStats,
  refreshDailyStats,
  refreshMaterializedView,
  refreshLeaderboard,
  cleanOldData,
  vacuumDatabase
};
