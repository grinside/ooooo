#!/usr/bin/env node

/**
 * Database Seed Script
 * Runs SQL seed files to populate initial data
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

async function runSeeds() {
  console.log('Starting database seeding...');
  console.log(`Database: ${config.database.name}@${config.database.host}`);

  const client = await pool.connect();

  try {
    // Get seed files
    const seedsDir = join(__dirname, '../../seeds');
    const files = readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} seed file(s)`);

    for (const file of files) {
      console.log(`\nRunning seed: ${file}`);

      const filePath = join(seedsDir, file);
      const sql = readFileSync(filePath, 'utf8');

      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✓ Seed ${file} completed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ Seed ${file} failed:`, error.message);

        // Don't fail on constraint violations (data might already exist)
        if (error.code !== '23505' && error.code !== '23503') {
          throw error;
        } else {
          console.log(`  (skipped - data already exists)`);
        }
      }
    }

    console.log('\n✓ All seeds completed successfully!');
  } catch (error) {
    console.error('\n✗ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeds
runSeeds();
