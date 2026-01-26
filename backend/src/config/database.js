import pkg from 'pg';
const { Pool } = pkg;
import logger from '../utils/logger.js';

/**
 * PostgreSQL Database Configuration and Connection Pool
 */
class Database {
  constructor() {
    this.pool = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    if (this.initialized) {
      return this.pool;
    }

    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'maxittv',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,

      // Connection pool settings
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),

      // Timeouts
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),

      // SSL configuration
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,

      // Statement timeout
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),

      // Application name for monitoring
      application_name: 'maxittv-affiliation-api'
    };

    this.pool = new Pool(config);

    // Error handler
    this.pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle database client', {
        error: err.message,
        stack: err.stack
      });
    });

    // Connection handler
    this.pool.on('connect', (client) => {
      logger.debug('New database client connected', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });

    // Acquire handler
    this.pool.on('acquire', (client) => {
      logger.debug('Database client acquired from pool');
    });

    // Remove handler
    this.pool.on('remove', (client) => {
      logger.debug('Database client removed from pool', {
        totalCount: this.pool.totalCount
      });
    });

    try {
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW(), version()');
      client.release();

      logger.info('Database connected successfully', {
        time: result.rows[0].now,
        version: result.rows[0].version.split(' ')[0],
        host: config.host,
        database: config.database,
        poolMin: config.min,
        poolMax: config.max
      });

      this.initialized = true;
      return this.pool;
    } catch (error) {
      logger.error('Database connection failed', {
        error: error.message,
        stack: error.stack,
        config: {
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user
        }
      });
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        duration: `${duration}ms`,
        rows: result.rowCount,
        command: result.command
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error('Database query failed', {
        error: error.message,
        duration: `${duration}ms`,
        query: text.substring(0, 100),
        params
      });

      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');

      logger.debug('Transaction committed successfully');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');

      logger.error('Transaction rolled back', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    if (!this.pool) {
      return null;
    }

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');

      return {
        healthy: result.rows[0].health === 1,
        pool: this.getStats(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.logError(error, { context: 'database_health_check' });

      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      logger.info('Closing database connection pool');
      await this.pool.end();
      this.initialized = false;
      logger.info('Database connection pool closed');
    }
  }
}

// Export singleton instance
export default new Database();
