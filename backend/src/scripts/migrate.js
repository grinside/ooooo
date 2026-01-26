#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs SQL migration files in order
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import config from '../config/index.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl
});

async function runMigrations() {
  console.log('Starting database migrations...');
  console.log(`Database: ${config.database.name}@${config.database.host}`);

  const client = await pool.connect();

  try {
    // Get migration files
    const migrationsDir = join(__dirname, '../../migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s)`);

    for (const file of files) {
      console.log(`\nRunning migration: ${file}`);

      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf8');

      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✓ Migration ${file} completed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ Migration ${file} failed:`, error.message);
        throw error;
      }
    }

    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations();
