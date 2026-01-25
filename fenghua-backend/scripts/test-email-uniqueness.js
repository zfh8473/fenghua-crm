/**
 * Test email uniqueness constraint for people table
 * 
 * This script tests that the email uniqueness constraint works correctly
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env.development
const envPath = path.join(__dirname, '..', '.env.development');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL=(.+)/m);
const dbUrl = match ? match[1].trim() : process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function testEmailUniqueness() {
  try {
    // Get a company ID for testing
    const companyRes = await pool.query(
      "SELECT id FROM companies WHERE deleted_at IS NULL LIMIT 1"
    );
    
    if (companyRes.rows.length === 0) {
      console.log('⚠️  No companies found, skipping email uniqueness test');
      await pool.end();
      return;
    }
    
    const companyId = companyRes.rows[0].id;
    const testEmail = 'test-unique-email-' + Date.now() + '@example.com';
    
    // Clean up any existing test data
    await pool.query(
      'DELETE FROM people WHERE email = $1 AND deleted_at IS NULL',
      [testEmail]
    );
    
    // First insert should succeed
    const insert1 = await pool.query(
      'INSERT INTO people (first_name, company_id, email) VALUES ($1, $2, $3) RETURNING id',
      ['Test User 1', companyId, testEmail]
    );
    console.log('✅ First insert successful, id:', insert1.rows[0].id);
    
    // Second insert with same email should fail
    try {
      await pool.query(
        'INSERT INTO people (first_name, company_id, email) VALUES ($1, $2, $3)',
        ['Test User 2', companyId, testEmail]
      );
      console.log('❌ Email uniqueness constraint failed - duplicate email was allowed');
    } catch (e) {
      if (e.code === '23505') {
        console.log('✅ Email uniqueness constraint works - duplicate email rejected');
      } else {
        throw e;
      }
    }
    
    // Clean up
    await pool.query('DELETE FROM people WHERE email = $1', [testEmail]);
    console.log('✅ Test data cleaned up');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testEmailUniqueness();
