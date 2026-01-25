/**
 * Execute Migration and Reset Interactions Script
 * 
 * This script:
 * 1. Creates interaction_products table if it doesn't exist
 * 2. Resets and seeds interactions
 * 
 * Usage:
 *   npx ts-node scripts/execute-reset-interactions.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.development') });
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_DATABASE_URL;

async function executeScript() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL or PG_DATABASE_URL not set');
    console.error('Please set it in .env file or export it');
    process.exit(1);
  }

  console.log(`Connecting to database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('📊 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Step 1: Check if interaction_products table exists
    console.log('📋 Checking if interaction_products table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'interaction_products'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('⚠️  interaction_products table does not exist. Creating it...\n');
      
      // Read migration file
      const migrationFilePath = path.join(__dirname, '../migrations/037-create-interaction-products-table.sql');
      if (!fs.existsSync(migrationFilePath)) {
        console.error(`❌ Migration file not found: ${migrationFilePath}`);
        process.exit(1);
      }

      const migrationSql = fs.readFileSync(migrationFilePath, 'utf-8');
      console.log('📝 Executing migration...');
      await pool.query(migrationSql);
      console.log('✅ Migration completed successfully\n');
    } else {
      console.log('✅ interaction_products table already exists\n');
    }

    // Step 2: Read and execute reset SQL file
    const sqlFilePath = path.join(__dirname, '../scripts/reset-and-seed-interactions.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ SQL file not found: ${sqlFilePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('📝 Executing reset and seed SQL script...\n');

    // Execute SQL script
    await pool.query(sql);

    console.log('\n✅ SQL script executed successfully!\n');

    // Display summary
    const summaryResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL) as total_customers,
        (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND status = 'active') as total_products,
        (SELECT COUNT(*) FROM product_customer_associations WHERE deleted_at IS NULL) as total_associations,
        (SELECT COUNT(*) FROM product_customer_interactions WHERE deleted_at IS NULL) as total_interactions,
        (SELECT COUNT(*) FROM interaction_products) as total_interaction_products
    `);
    const summary = summaryResult.rows[0];

    console.log('=== Summary ===');
    console.log(`Customers: ${summary.total_customers}`);
    console.log(`Products: ${summary.total_products}`);
    console.log(`Associations: ${summary.total_associations}`);
    console.log(`Interactions: ${summary.total_interactions}`);
    console.log(`Interaction Products: ${summary.total_interaction_products}`);

  } catch (error: any) {
    console.error('\n❌ Error executing SQL script:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`Detail: ${error.detail}`);
    }
    if (error.position) {
      console.error(`Position: ${error.position}`);
    }
    throw error;
  } finally {
    await pool.end();
  }
}

executeScript().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
