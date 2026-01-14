/**
 * Script to seed GDPR test data
 * 
 * Creates complete user data (customers, interactions, products, audit logs) for GDPR testing
 * All custom code is proprietary and not open source.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

async function seedGdprTestData() {
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

    // Get existing users with different roles
    const usersResult = await pool.query(`
      SELECT id, role 
      FROM users 
      WHERE role IN ('FRONTEND_SPECIALIST', 'BACKEND_SPECIALIST', 'DIRECTOR', 'ADMIN')
      LIMIT 4
    `);

    if (usersResult.rows.length < 4) {
      console.warn('⚠️  Not all required roles found. Creating test users...');
      // Create test users if they don't exist
      const roles = ['FRONTEND_SPECIALIST', 'BACKEND_SPECIALIST', 'DIRECTOR', 'ADMIN'];
      const roleUsers: any[] = [];

      for (const role of roles) {
        const existingUser = usersResult.rows.find((u) => u.role === role);
        if (!existingUser) {
          const userId = randomUUID();
          await pool.query(
            `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [userId, `test-${role.toLowerCase()}@example.com`, 'hashed_password', role],
          );
          roleUsers.push({ id: userId, role });
        } else {
          roleUsers.push(existingUser);
        }
      }

      // Re-fetch users
      const updatedUsersResult = await pool.query(`
        SELECT id, role 
        FROM users 
        WHERE role IN ('FRONTEND_SPECIALIST', 'BACKEND_SPECIALIST', 'DIRECTOR', 'ADMIN')
        LIMIT 4
      `);
      usersResult.rows = updatedUsersResult.rows;
    }

    const frontendUser = usersResult.rows.find((u) => u.role === 'FRONTEND_SPECIALIST');
    const backendUser = usersResult.rows.find((u) => u.role === 'BACKEND_SPECIALIST');
    const directorUser = usersResult.rows.find((u) => u.role === 'DIRECTOR');
    const adminUser = usersResult.rows.find((u) => u.role === 'ADMIN');

    if (!frontendUser || !backendUser || !directorUser || !adminUser) {
      console.error('❌ Could not find or create all required test users');
      process.exit(1);
    }

    console.log(`\n📋 Test users ready:`);
    console.log(`   Frontend Specialist: ${frontendUser.id}`);
    console.log(`   Backend Specialist: ${backendUser.id}`);
    console.log(`   Director: ${directorUser.id}`);
    console.log(`   Admin: ${adminUser.id}`);

    // Create test customers (buyers and suppliers)
    console.log(`\n📝 Creating test customers...`);
    const buyerIds: string[] = [];
    const supplierIds: string[] = [];

    // Create 5 buyers (for frontend specialist)
    for (let i = 1; i <= 5; i++) {
      const customerId = randomUUID();
      await pool.query(
        `INSERT INTO companies (
          id, name, customer_code, customer_type, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT DO NOTHING`,
        [customerId, `Test Buyer ${i}`, `TEST_BUYER_${i}`, 'BUYER', frontendUser.id],
      );
      buyerIds.push(customerId);
    }

    // Create 5 suppliers (for backend specialist)
    for (let i = 1; i <= 5; i++) {
      const customerId = randomUUID();
      await pool.query(
        `INSERT INTO companies (
          id, name, customer_code, customer_type, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT DO NOTHING`,
        [customerId, `Test Supplier ${i}`, `TEST_SUPPLIER_${i}`, 'SUPPLIER', backendUser.id],
      );
      supplierIds.push(customerId);
    }

    console.log(`   ✅ Created ${buyerIds.length} buyers and ${supplierIds.length} suppliers`);

    // Create test products
    console.log(`\n📝 Creating test products...`);
    const productIds: string[] = [];

    for (let i = 1; i <= 10; i++) {
      const productId = randomUUID();
      await pool.query(
        `INSERT INTO products (
          id, name, product_code, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT DO NOTHING`,
        [productId, `Test Product ${i}`, `TEST_PRODUCT_${i}`, adminUser.id],
      );
      productIds.push(productId);
    }

    console.log(`   ✅ Created ${productIds.length} products`);

    // Create product-customer associations
    console.log(`\n📝 Creating product-customer associations...`);
    let associationCount = 0;

    for (const productId of productIds.slice(0, 5)) {
      for (const buyerId of buyerIds.slice(0, 3)) {
        await pool.query(
          `INSERT INTO product_customer_associations (
            id, product_id, customer_id, created_at, updated_at
          ) VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT DO NOTHING`,
          [randomUUID(), productId, buyerId],
        );
        associationCount++;
      }
    }

    for (const productId of productIds.slice(5, 10)) {
      for (const supplierId of supplierIds.slice(0, 3)) {
        await pool.query(
          `INSERT INTO product_customer_associations (
            id, product_id, customer_id, created_at, updated_at
          ) VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT DO NOTHING`,
          [randomUUID(), productId, supplierId],
        );
        associationCount++;
      }
    }

    console.log(`   ✅ Created ${associationCount} product-customer associations`);

    // Create test interactions
    console.log(`\n📝 Creating test interactions...`);
    let interactionCount = 0;

    for (let i = 0; i < 20; i++) {
      const interactionId = randomUUID();
      const customerId = i % 2 === 0 ? buyerIds[i % buyerIds.length] : supplierIds[i % supplierIds.length];
      const productId = productIds[i % productIds.length];
      const userId = i % 2 === 0 ? frontendUser.id : backendUser.id;

      await pool.query(
        `INSERT INTO product_customer_interactions (
          id, customer_id, product_id, interaction_type, notes, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT DO NOTHING`,
        [
          interactionId,
          customerId,
          productId,
          'MEETING',
          `Test interaction ${i + 1} for GDPR testing`,
          userId,
        ],
      );
      interactionCount++;
    }

    console.log(`   ✅ Created ${interactionCount} interactions`);

    // Create audit logs for GDPR testing
    console.log(`\n📝 Creating audit logs...`);
    let auditLogCount = 0;

    for (let i = 0; i < 50; i++) {
      const userId = [frontendUser.id, backendUser.id, directorUser.id, adminUser.id][
        i % 4
      ];
      const customerId = i % 2 === 0 ? buyerIds[i % buyerIds.length] : supplierIds[i % supplierIds.length];

      await pool.query(
        `INSERT INTO audit_logs (
          id, action, entity_type, entity_id, user_id, operator_id, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${i} days', $7)
        ON CONFLICT DO NOTHING`,
        [
          randomUUID(),
          'DATA_ACCESS',
          'CUSTOMER',
          customerId,
          userId,
          userId,
          JSON.stringify({ operationResult: 'SUCCESS' }),
        ],
      );
      auditLogCount++;
    }

    console.log(`   ✅ Created ${auditLogCount} audit logs`);

    // Summary
    console.log('\n✅ GDPR test data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Buyers: ${buyerIds.length}`);
    console.log(`   Suppliers: ${supplierIds.length}`);
    console.log(`   Products: ${productIds.length}`);
    console.log(`   Associations: ${associationCount}`);
    console.log(`   Interactions: ${interactionCount}`);
    console.log(`   Audit Logs: ${auditLogCount}`);
  } catch (error) {
    console.error('❌ Error seeding GDPR test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
seedGdprTestData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
