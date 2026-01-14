/**
 * Run GDPR Export Table Migration
 * 
 * This script runs the migration to create the gdpr_export_requests table
 * Uses the same configuration as the backend application
 * All custom code is proprietary and not open source.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config();

async function runMigration() {
  console.log('🚀 GDPR Export Table Migration\n');

  // Get database URL (same as backend)
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.PG_DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL or PG_DATABASE_URL not found in environment variables');
    console.error('   Please set DATABASE_URL in your .env file or environment');
    process.exit(1);
  }

  console.log('✅ Database URL found');
  console.log(`   ${databaseUrl.replace(/:[^:@]*@/, ':***@')}\n`);

  // Create connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1, // Single connection for migration
  });

  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Check if table already exists
    console.log('🔍 Checking if table already exists...');
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gdpr_export_requests'
      )`
    );

    const tableExists = tableCheck.rows[0].exists;

    if (tableExists) {
      console.log('⚠️  Table gdpr_export_requests already exists');
      console.log('   Migration will use CREATE TABLE IF NOT EXISTS, so it\'s safe to run\n');
    } else {
      console.log('✅ Table does not exist, will be created\n');
    }

    // Read migration file
    const migrationPath = join(__dirname, '../migrations/031-add-gdpr-export-request-table.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    // Run migration
    console.log('🔄 Running migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!\n');

    // Verify table
    console.log('🔍 Verifying table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'gdpr_export_requests'
      ORDER BY ordinal_position
      LIMIT 10
    `);

    console.log(`✅ Table created with ${columns.rows.length} columns:`);
    columns.rows.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col.column_name} (${col.data_type})`);
    });

    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'gdpr_export_requests'
      ORDER BY indexname
    `);

    console.log(`\n✅ Created ${indexes.rows.length} indexes:`);
    indexes.rows.forEach((idx, i) => {
      console.log(`   ${i + 1}. ${idx.indexname}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(50));

  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
