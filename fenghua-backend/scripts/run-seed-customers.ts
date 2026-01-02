/**
 * Script to seed test customer data
 * 
 * This script reads the SQL file and executes it against the database
 * All custom code is proprietary and not open source.
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seedCustomers() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.PG_DATABASE_URL ||
    'postgresql://user:password@localhost:5432/fenghua_crm';

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log('📊 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'seed-test-customers.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('📝 Executing SQL script...');
    await pool.query(sql);

    // Verify insertion
    const result = await pool.query(`
      SELECT 
        customer_type,
        COUNT(*) as count
      FROM companies
      WHERE customer_code IN (
        'BUYER001', 'BUYER002', 'BUYER003', 'BUYER004', 'BUYER005',
        'BUYER006', 'BUYER007', 'BUYER008', 'BUYER009', 'BUYER010',
        'SUPPLIER001', 'SUPPLIER002', 'SUPPLIER003', 'SUPPLIER004', 'SUPPLIER005',
        'SUPPLIER006', 'SUPPLIER007', 'SUPPLIER008', 'SUPPLIER009', 'SUPPLIER010'
      )
      GROUP BY customer_type
    `);

    console.log('\n✅ Test customers inserted successfully!');
    console.log('\n📊 Summary:');
    result.rows.forEach((row) => {
      console.log(`   ${row.customer_type}: ${row.count} customers`);
    });

    // Show total count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM companies
      WHERE customer_code IN (
        'BUYER001', 'BUYER002', 'BUYER003', 'BUYER004', 'BUYER005',
        'BUYER006', 'BUYER007', 'BUYER008', 'BUYER009', 'BUYER010',
        'SUPPLIER001', 'SUPPLIER002', 'SUPPLIER003', 'SUPPLIER004', 'SUPPLIER005',
        'SUPPLIER006', 'SUPPLIER007', 'SUPPLIER008', 'SUPPLIER009', 'SUPPLIER010'
      )
    `);
    console.log(`\n   Total: ${totalResult.rows[0].total} customers`);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
seedCustomers().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

