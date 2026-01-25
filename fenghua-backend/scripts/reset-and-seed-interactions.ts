/**
 * Reset and Seed Interactions Script
 * 
 * This script:
 * 1. Queries existing customers, products, and associations
 * 2. Soft deletes all existing interactions
 * 3. Creates new interaction records with proper customer and product associations
 * 
 * Usage:
 *   export DATABASE_URL=postgresql://user:password@host:port/database
 *   npx ts-node scripts/reset-and-seed-interactions.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.PG_DATABASE_URL;

/**
 * Interaction types for buyers
 */
const BUYER_INTERACTION_TYPES = [
  'initial_contact',
  'product_inquiry',
  'quotation',
  'quotation_accepted',
  'order_signed',
  'order_follow_up',
];

/**
 * Interaction types for suppliers
 */
const SUPPLIER_INTERACTION_TYPES = [
  'product_inquiry_supplier',
  'quotation_received',
  'specification_confirmed',
  'production_progress',
  'pre_shipment_inspection',
  'shipped',
];

/**
 * Main function
 */
async function main() {
  console.log('=== Reset and Seed Interactions ===\n');
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL or PG_DATABASE_URL environment variable is not set');
    console.error('Please set it in .env file or export it:');
    console.error('  export DATABASE_URL=postgresql://user:password@host:port/database');
    process.exit(1);
  }

  console.log(`Connecting to database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
  });

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Step 1: Query existing customers
    console.log('Step 1: Querying existing customers...');
    const customersResult = await client.query(`
      SELECT id, name, customer_type
      FROM companies
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const customers = customersResult.rows;
    console.log(`Found ${customers.length} customers`);

    if (customers.length === 0) {
      console.log('❌ No customers found. Please create customers first.');
      await client.query('ROLLBACK');
      process.exit(1);
    }

    // Step 2: Query existing products
    console.log('\nStep 2: Querying existing products...');
    const productsResult = await client.query(`
      SELECT id, name, status
      FROM products
      WHERE deleted_at IS NULL AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const products = productsResult.rows;
    console.log(`Found ${products.length} active products`);

    if (products.length === 0) {
      console.log('❌ No active products found. Please create products first.');
      await client.query('ROLLBACK');
      process.exit(1);
    }

    // Step 3: Query product-customer associations
    console.log('\nStep 3: Querying product-customer associations...');
    const associationsResult = await client.query(`
      SELECT pca.product_id, pca.customer_id, c.customer_type
      FROM product_customer_associations pca
      INNER JOIN companies c ON c.id = pca.customer_id
      WHERE pca.deleted_at IS NULL AND c.deleted_at IS NULL
      ORDER BY pca.created_at DESC
    `);
    const associations = associationsResult.rows;
    console.log(`Found ${associations.length} product-customer associations`);

    if (associations.length === 0) {
      console.log('❌ No product-customer associations found. Please create associations first.');
      await client.query('ROLLBACK');
      process.exit(1);
    }

    // Step 4: Get a user ID for created_by
    console.log('\nStep 4: Getting user ID...');
    const userResult = await client.query(`
      SELECT id FROM users WHERE deleted_at IS NULL LIMIT 1
    `);
    const userId = userResult.rows[0]?.id;
    
    if (!userId) {
      console.log('❌ No users found. Please create a user first.');
      await client.query('ROLLBACK');
      process.exit(1);
    }
    console.log(`Using user ID: ${userId}`);

    // Step 5: Soft delete all existing interactions
    console.log('\nStep 5: Soft deleting existing interactions...');
    const deleteResult = await client.query(`
      UPDATE product_customer_interactions
      SET deleted_at = NOW()
      WHERE deleted_at IS NULL
    `);
    console.log(`Soft deleted ${deleteResult.rowCount} interactions`);

    // Step 6: Delete all interaction_products associations
    console.log('\nStep 6: Deleting interaction_products associations...');
    const deleteProductsResult = await client.query(`
      DELETE FROM interaction_products
      WHERE interaction_id IN (
        SELECT id FROM product_customer_interactions WHERE deleted_at IS NOT NULL
      )
    `);
    console.log(`Deleted ${deleteProductsResult.rowCount} interaction_products records`);

    // Step 7: Group associations by customer
    console.log('\nStep 7: Grouping associations by customer...');
    const associationsByCustomer = new Map<string, Array<{ product_id: string; customer_type: string }>>();
    
    for (const assoc of associations) {
      const customerId = assoc.customer_id;
      if (!associationsByCustomer.has(customerId)) {
        associationsByCustomer.set(customerId, []);
      }
      associationsByCustomer.get(customerId)!.push({
        product_id: assoc.product_id,
        customer_type: assoc.customer_type,
      });
    }

    console.log(`Grouped into ${associationsByCustomer.size} customers`);

    // Step 8: Create new interactions
    console.log('\nStep 8: Creating new interactions...');
    let interactionCount = 0;
    const now = new Date();
    
    for (const [customerId, productAssociations] of associationsByCustomer.entries()) {
      // Get customer type
      const customer = customers.find(c => c.id === customerId);
      if (!customer) continue;

      const customerType = customer.customer_type;
      const interactionTypes = customerType === 'BUYER' 
        ? BUYER_INTERACTION_TYPES 
        : SUPPLIER_INTERACTION_TYPES;

      // Create 2-3 interactions per customer
      const numInteractions = Math.min(3, Math.max(2, Math.floor(productAssociations.length / 2)));
      
      for (let i = 0; i < numInteractions; i++) {
        // Select 1-3 products for this interaction
        const numProducts = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
        const selectedProducts = productAssociations
          .sort(() => Math.random() - 0.5)
          .slice(0, numProducts)
          .map(a => a.product_id);

        if (selectedProducts.length === 0) continue;

        // Select interaction type
        const interactionType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
        
        // Create interaction date (within last 90 days)
        const daysAgo = Math.floor(Math.random() * 90);
        const interactionDate = new Date(now);
        interactionDate.setDate(interactionDate.getDate() - daysAgo);

        // Insert interaction
        const insertInteractionQuery = `
          INSERT INTO product_customer_interactions (
            customer_id,
            interaction_type,
            interaction_date,
            description,
            status,
            created_by,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        
        const description = `互动记录 ${i + 1} - ${customer.name}`;
        const status = Math.random() > 0.5 ? 'in_progress' : 'completed';
        
        const interactionResult = await client.query(insertInteractionQuery, [
          customerId,
          interactionType,
          interactionDate,
          description,
          status,
          userId,
          interactionDate,
          interactionDate,
        ]);

        const interactionId = interactionResult.rows[0].id;

        // Insert product associations
        for (const productId of selectedProducts) {
          await client.query(`
            INSERT INTO interaction_products (interaction_id, product_id, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (interaction_id, product_id) DO NOTHING
          `, [interactionId, productId, interactionDate]);
        }

        interactionCount++;
      }
    }

    console.log(`Created ${interactionCount} new interactions`);

    await client.query('COMMIT');
    console.log('\n✅ Successfully reset and seeded interactions!');
    console.log(`\nSummary:`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Associations: ${associations.length}`);
    console.log(`- New Interactions: ${interactionCount}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
