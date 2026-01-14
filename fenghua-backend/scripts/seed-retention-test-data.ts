/**
 * Script to seed data retention test data
 * 
 * Creates expired data and soft-deleted data for testing Story 9-7
 * All custom code is proprietary and not open source.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

async function seedRetentionTestData() {
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

    // Get existing user
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('❌ No users found in database. Please create at least one user first.');
      process.exit(1);
    }
    const userId = userResult.rows[0].id;

    // Get retention policy (default: 7 years = 2555 days)
    const retentionResult = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'customerDataRetentionDays'`,
    );
    const retentionDays = retentionResult.rows[0]
      ? parseInt(retentionResult.rows[0].value, 10)
      : 2555;

    console.log(`\n📋 Retention policy: ${retentionDays} days (${Math.round(retentionDays / 365)} years)`);

    // Create expired customers (created_at > retentionDays days ago)
    console.log(`\n📝 Creating expired customers...`);
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - retentionDays - 10); // 10 days past retention

    let expiredCount = 0;
    for (let i = 1; i <= 10; i++) {
      const customerId = randomUUID();
      await pool.query(
        `INSERT INTO companies (
          id, name, customer_code, customer_type, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT DO NOTHING`,
        [
          customerId,
          `Expired Customer ${i}`,
          `EXPIRED_CUSTOMER_${i}`,
          i % 2 === 0 ? 'BUYER' : 'SUPPLIER',
          userId,
          expiredDate.toISOString(),
        ],
      );
      expiredCount++;
    }
    console.log(`   ✅ Created ${expiredCount} expired customers`);

    // Create soft-deleted customers (deleted_at set, but within extra retention period)
    console.log(`\n📝 Creating soft-deleted customers...`);
    const softDeleteDate = new Date();
    softDeleteDate.setDate(softDeleteDate.getDate() - 20); // 20 days ago (within 30-day extra retention)

    let softDeletedCount = 0;
    for (let i = 1; i <= 10; i++) {
      const customerId = randomUUID();
      await pool.query(
        `INSERT INTO companies (
          id, name, customer_code, customer_type, created_by, created_at, updated_at, deleted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
        ON CONFLICT DO NOTHING`,
        [
          customerId,
          `Soft Deleted Customer ${i}`,
          `SOFT_DELETED_CUSTOMER_${i}`,
          i % 2 === 0 ? 'BUYER' : 'SUPPLIER',
          userId,
          expiredDate.toISOString(),
          softDeleteDate.toISOString(),
        ],
      );
      softDeletedCount++;
    }
    console.log(`   ✅ Created ${softDeletedCount} soft-deleted customers`);

    // Create expired interactions
    console.log(`\n📝 Creating expired interactions...`);
    const interactionRetentionResult = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'interactionDataRetentionDays'`,
    );
    const interactionRetentionDays = interactionRetentionResult.rows[0]
      ? parseInt(interactionRetentionResult.rows[0].value, 10)
      : 2555;

    const expiredInteractionDate = new Date();
    expiredInteractionDate.setDate(expiredInteractionDate.getDate() - interactionRetentionDays - 10);

    // Get a customer ID for interactions
    const customerResult = await pool.query('SELECT id FROM companies LIMIT 1');
    if (customerResult.rows.length === 0) {
      console.warn('⚠️  No customers found. Skipping interaction creation.');
    } else {
      const customerId = customerResult.rows[0].id;
      const productResult = await pool.query('SELECT id FROM products LIMIT 1');
      const productId = productResult.rows.length > 0 ? productResult.rows[0].id : null;

      if (productId) {
        let expiredInteractionCount = 0;
        for (let i = 1; i <= 10; i++) {
          const interactionId = randomUUID();
          await pool.query(
            `INSERT INTO product_customer_interactions (
              id, customer_id, product_id, interaction_type, notes, created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT DO NOTHING`,
            [
              interactionId,
              customerId,
              productId,
              'MEETING',
              `Expired interaction ${i}`,
              userId,
              expiredInteractionDate.toISOString(),
            ],
          );
          expiredInteractionCount++;
        }
        console.log(`   ✅ Created ${expiredInteractionCount} expired interactions`);
      }
    }

    // Create expired audit logs (for testing audit log retention)
    console.log(`\n📝 Creating expired audit logs...`);
    const auditRetentionResult = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'auditLogRetentionDays'`,
    );
    const auditRetentionDays = auditRetentionResult.rows[0]
      ? parseInt(auditRetentionResult.rows[0].value, 10)
      : 3650;

    const expiredAuditDate = new Date();
    expiredAuditDate.setDate(expiredAuditDate.getDate() - auditRetentionDays - 10);

    let expiredAuditCount = 0;
    for (let i = 1; i <= 20; i++) {
      await pool.query(
        `INSERT INTO audit_logs (
          id, action, entity_type, entity_id, user_id, operator_id, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING`,
        [
          randomUUID(),
          'DATA_ACCESS',
          'CUSTOMER',
          randomUUID(),
          userId,
          userId,
          expiredAuditDate.toISOString(),
          JSON.stringify({ operationResult: 'SUCCESS' }),
        ],
      );
      expiredAuditCount++;
    }
    console.log(`   ✅ Created ${expiredAuditCount} expired audit logs`);

    // Summary
    console.log('\n✅ Data retention test data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Expired customers: ${expiredCount}`);
    console.log(`   Soft-deleted customers: ${softDeletedCount}`);
    console.log(`   Expired audit logs: ${expiredAuditCount}`);
    console.log(
      `\n💡 Note: These records will be processed by the automatic deletion task (runs daily at 2:00 AM)`,
    );
  } catch (error) {
    console.error('❌ Error seeding retention test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
seedRetentionTestData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
