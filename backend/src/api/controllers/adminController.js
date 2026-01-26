import { asyncHandler } from '../../utils/errors.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError
} from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import database from '../../config/database.js';
import queueService from '../../services/queueService.js';
import paymentService from '../../services/paymentService.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

/**
 * Admin Controller
 * Handles admin dashboard, affiliate management, reports, and system operations
 */

/**
 * Admin login
 * POST /api/v1/admin/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.info('Admin login attempt', { email });

  // Get admin user
  const result = await database.query(
    `SELECT u.*, r.name as role_name, r.permissions
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1 AND u.status = 'active'`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = result.rows[0];

  // Check if user is admin or super_admin
  if (!['admin', 'super_admin'].includes(user.role_name)) {
    throw new ForbiddenError('Access denied');
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate JWT tokens
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.accessTokenExpiry,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    config.jwt.secret,
    {
      expiresIn: config.jwt.refreshTokenExpiry,
      issuer: config.jwt.issuer
    }
  );

  // Update last login
  await database.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  logger.info('Admin login successful', { userId: user.id, role: user.role_name });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role_name,
        permissions: user.permissions
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessTokenExpiry
      }
    }
  });
});

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard/stats
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // Calculate date range
  const now = new Date();
  const periodDays = parseInt(period) || 30;
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  logger.info('Fetching dashboard stats', { period, startDate });

  // Execute multiple queries in parallel
  const [
    subscriptionStats,
    revenueStats,
    affiliateStats,
    payoutStats,
    recentActivity
  ] = await Promise.all([
    // Subscription statistics
    database.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_subscriptions,
         COUNT(*) FILTER (WHERE status = 'expired') as expired_subscriptions,
         COUNT(*) FILTER (WHERE created_at >= $1) as new_subscriptions,
         COUNT(*) as total_subscriptions
       FROM subscriptions`,
      [startDate]
    ),

    // Revenue statistics
    database.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'active'), 0) as total_revenue,
         COALESCE(SUM(amount) FILTER (WHERE created_at >= $1 AND status = 'active'), 0) as period_revenue,
         COALESCE(AVG(amount) FILTER (WHERE status = 'active'), 0) as avg_subscription_value,
         currency
       FROM subscriptions
       GROUP BY currency`,
      [startDate]
    ),

    // Affiliate statistics
    database.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') as active_affiliates,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_affiliates,
         COUNT(*) FILTER (WHERE created_at >= $1) as new_affiliates,
         COUNT(*) as total_affiliates
       FROM affiliates`
      [startDate]
    ),

    // Payout statistics
    database.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
         COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as paid_amount,
         COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND completed_at >= $1), 0) as period_paid,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_count
       FROM payouts`,
      [startDate]
    ),

    // Recent activity
    database.query(
      `SELECT 'subscription' as type, id, reference as identifier, status, created_at
       FROM subscriptions
       WHERE created_at >= $1
       UNION ALL
       SELECT 'payout' as type, id, reference as identifier, status, created_at
       FROM payouts
       WHERE created_at >= $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [startDate]
    )
  ]);

  res.json({
    success: true,
    data: {
      subscriptions: subscriptionStats.rows[0],
      revenue: revenueStats.rows,
      affiliates: affiliateStats.rows[0],
      payouts: payoutStats.rows[0],
      recentActivity: recentActivity.rows,
      period: {
        days: periodDays,
        startDate,
        endDate: now
      }
    }
  });
});

/**
 * List affiliates with filters
 * GET /api/v1/admin/affiliates
 */
export const listAffiliates = asyncHandler(async (req, res) => {
  const {
    status,
    tier,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = req.query;

  const offset = (page - 1) * limit;

  // Build query
  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  if (status) {
    whereConditions.push(`a.status = $${paramCount}`);
    params.push(status);
    paramCount++;
  }

  if (tier) {
    whereConditions.push(`a.tier = $${paramCount}`);
    params.push(tier);
    paramCount++;
  }

  if (search) {
    whereConditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR a.code ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // Get total count
  const countResult = await database.query(
    `SELECT COUNT(*) FROM affiliates a
     JOIN users u ON a.user_id = u.id
     ${whereClause}`,
    params
  );
  const totalCount = parseInt(countResult.rows[0].count);

  // Get affiliates
  const validSortColumns = ['created_at', 'total_subscriptions', 'total_earnings'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  params.push(limit, offset);

  const result = await database.query(
    `SELECT a.*, u.name, u.email, u.phone,
            COUNT(DISTINCT s.id) as total_subscriptions,
            COALESCE(SUM(c.amount), 0) as total_earnings,
            COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0) as pending_earnings
     FROM affiliates a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN subscriptions s ON a.id = s.affiliate_id
     LEFT JOIN commissions c ON a.id = c.affiliate_id
     ${whereClause}
     GROUP BY a.id, u.name, u.email, u.phone
     ORDER BY a.${sortColumn} ${order}
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  res.json({
    success: true,
    data: {
      affiliates: result.rows.map(aff => ({
        id: aff.id,
        code: aff.code,
        status: aff.status,
        tier: aff.tier,
        user: {
          name: aff.name,
          email: aff.email,
          phone: aff.phone
        },
        stats: {
          totalSubscriptions: parseInt(aff.total_subscriptions),
          totalEarnings: parseFloat(aff.total_earnings),
          pendingEarnings: parseFloat(aff.pending_earnings)
        },
        createdAt: aff.created_at
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

/**
 * Update affiliate status
 * PATCH /api/v1/admin/affiliates/:id/status
 */
export const updateAffiliateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const adminId = req.user.userId;

  logger.info('Updating affiliate status', { affiliateId: id, status, adminId });

  const validStatuses = ['active', 'suspended', 'rejected', 'pending'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status');
  }

  const result = await database.transaction(async (client) => {
    // Get affiliate
    const affiliateResult = await client.query(
      'SELECT * FROM affiliates WHERE id = $1',
      [id]
    );

    if (affiliateResult.rows.length === 0) {
      throw new NotFoundError('Affiliate not found');
    }

    // Update status
    await client.query(
      `UPDATE affiliates
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [status, id]
    );

    // Log status change
    await client.query(
      `INSERT INTO affiliate_status_logs (affiliate_id, old_status, new_status, reason, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, affiliateResult.rows[0].status, status, reason, adminId]
    );

    return affiliateResult.rows[0];
  });

  logger.info('Affiliate status updated', { affiliateId: id, newStatus: status });

  res.json({
    success: true,
    message: 'Affiliate status updated successfully',
    data: {
      affiliateId: id,
      status
    }
  });
});

/**
 * Get affiliate details
 * GET /api/v1/admin/affiliates/:id
 */
export const getAffiliateDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [affiliateResult, statsResult, recentSales] = await Promise.all([
    // Get affiliate details
    database.query(
      `SELECT a.*, u.name, u.email, u.phone, u.created_at as user_created_at,
              parent.code as parent_code
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN affiliates parent ON a.parent_id = parent.id
       WHERE a.id = $1`,
      [id]
    ),

    // Get statistics
    database.query(
      `SELECT
         COUNT(DISTINCT s.id) as total_subscriptions,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
         COALESCE(SUM(c.amount), 0) as total_earnings,
         COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'pending'), 0) as pending_earnings,
         COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'paid'), 0) as paid_earnings,
         COUNT(DISTINCT CASE WHEN a_child.parent_id = $1 THEN a_child.id END) as total_referrals
       FROM affiliates a
       LEFT JOIN subscriptions s ON a.id = s.affiliate_id
       LEFT JOIN commissions c ON a.id = c.affiliate_id
       LEFT JOIN affiliates a_child ON a.id = a_child.parent_id
       WHERE a.id = $1`,
      [id]
    ),

    // Get recent sales
    database.query(
      `SELECT s.*, c.name as customer_name, o.name as offer_name
       FROM subscriptions s
       JOIN customers c ON s.customer_id = c.id
       JOIN subscription_offers o ON s.offer_id = o.id
       WHERE s.affiliate_id = $1
       ORDER BY s.created_at DESC
       LIMIT 10`,
      [id]
    )
  ]);

  if (affiliateResult.rows.length === 0) {
    throw new NotFoundError('Affiliate not found');
  }

  const affiliate = affiliateResult.rows[0];
  const stats = statsResult.rows[0];

  res.json({
    success: true,
    data: {
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        status: affiliate.status,
        tier: affiliate.tier,
        parentCode: affiliate.parent_code,
        user: {
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          createdAt: affiliate.user_created_at
        },
        createdAt: affiliate.created_at
      },
      stats: {
        totalSubscriptions: parseInt(stats.total_subscriptions),
        activeSubscriptions: parseInt(stats.active_subscriptions),
        totalEarnings: parseFloat(stats.total_earnings),
        pendingEarnings: parseFloat(stats.pending_earnings),
        paidEarnings: parseFloat(stats.paid_earnings),
        totalReferrals: parseInt(stats.total_referrals)
      },
      recentSales: recentSales.rows.map(sale => ({
        id: sale.id,
        reference: sale.reference,
        customerName: sale.customer_name,
        offerName: sale.offer_name,
        amount: parseFloat(sale.amount),
        status: sale.status,
        createdAt: sale.created_at
      }))
    }
  });
});

/**
 * Process pending payouts
 * POST /api/v1/admin/payouts/process
 */
export const processPendingPayouts = asyncHandler(async (req, res) => {
  const { payoutIds } = req.body;
  const adminId = req.user.userId;

  logger.info('Processing pending payouts', { count: payoutIds.length, adminId });

  // Queue batch payout processing
  const job = await queueService.addBatchPayoutProcessing(payoutIds, {
    adminId
  });

  logger.info('Payout processing job queued', { jobId: job.id });

  res.json({
    success: true,
    message: 'Payout processing initiated',
    data: {
      jobId: job.id,
      payoutCount: payoutIds.length
    }
  });
});

/**
 * Get system reports
 * GET /api/v1/admin/reports/:type
 */
export const getReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { startDate, endDate, format = 'json' } = req.query;

  logger.info('Generating report', { type, startDate, endDate, format });

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  let reportData;

  switch (type) {
    case 'revenue':
      reportData = await database.query(
        `SELECT
           DATE(created_at) as date,
           COUNT(*) as subscriptions,
           SUM(amount) as revenue,
           currency
         FROM subscriptions
         WHERE created_at BETWEEN $1 AND $2
           AND status = 'active'
         GROUP BY DATE(created_at), currency
         ORDER BY date DESC`,
        [start, end]
      );
      break;

    case 'affiliates':
      reportData = await database.query(
        `SELECT
           a.id, a.code, u.name, u.email,
           COUNT(DISTINCT s.id) as total_sales,
           COALESCE(SUM(s.amount), 0) as total_revenue,
           COALESCE(SUM(c.amount), 0) as total_commissions
         FROM affiliates a
         JOIN users u ON a.user_id = u.id
         LEFT JOIN subscriptions s ON a.id = s.affiliate_id
           AND s.created_at BETWEEN $1 AND $2
         LEFT JOIN commissions c ON a.id = c.affiliate_id
           AND c.created_at BETWEEN $1 AND $2
         GROUP BY a.id, a.code, u.name, u.email
         ORDER BY total_revenue DESC`,
        [start, end]
      );
      break;

    case 'commissions':
      reportData = await database.query(
        `SELECT
           DATE(c.created_at) as date,
           COUNT(*) as total_commissions,
           SUM(c.amount) as total_amount,
           c.status,
           c.commission_level
         FROM commissions c
         WHERE c.created_at BETWEEN $1 AND $2
         GROUP BY DATE(c.created_at), c.status, c.commission_level
         ORDER BY date DESC`,
        [start, end]
      );
      break;

    default:
      throw new BadRequestError('Invalid report type');
  }

  res.json({
    success: true,
    data: {
      report: type,
      period: { startDate: start, endDate: end },
      data: reportData.rows
    }
  });
});

/**
 * Get queue statistics
 * GET /api/v1/admin/system/queues
 */
export const getQueueStats = asyncHandler(async (req, res) => {
  const stats = await queueService.getAllQueuesStats();

  res.json({
    success: true,
    data: {
      queues: stats,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Retry failed job
 * POST /api/v1/admin/system/queues/:queueName/jobs/:jobId/retry
 */
export const retryFailedJob = asyncHandler(async (req, res) => {
  const { queueName, jobId } = req.params;

  logger.info('Retrying failed job', { queueName, jobId });

  const result = await queueService.retryFailedJob(queueName, jobId);

  res.json({
    success: true,
    message: 'Job retry initiated',
    data: result
  });
});

/**
 * Get system health
 * GET /api/v1/admin/system/health
 */
export const getSystemHealth = asyncHandler(async (req, res) => {
  const [dbHealth, queueHealth] = await Promise.all([
    database.healthCheck(),
    queueService.healthCheck()
  ]);

  const healthy = dbHealth.healthy && queueHealth.healthy;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'healthy' : 'unhealthy',
      database: dbHealth,
      queues: queueHealth,
      timestamp: new Date().toISOString()
    }
  });
});

export default {
  login,
  getDashboardStats,
  listAffiliates,
  updateAffiliateStatus,
  getAffiliateDetails,
  processPendingPayouts,
  getReport,
  getQueueStats,
  retryFailedJob,
  getSystemHealth
};
