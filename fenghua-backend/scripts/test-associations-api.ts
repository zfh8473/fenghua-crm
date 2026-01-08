/**
 * Test Product Associations API Endpoint
 * Run from fenghua-backend directory: 
 *   export TWENTY_TEST_TOKEN=your_token
 *   export PRODUCT_ID=your_product_id
 *   npx ts-node scripts/test-associations-api.ts
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3006';
const TEST_TOKEN = process.env.TWENTY_TEST_TOKEN || '';
const PRODUCT_ID = process.env.PRODUCT_ID || '';

if (!TEST_TOKEN) {
  console.error('❌ Please set TWENTY_TEST_TOKEN environment variable');
  process.exit(1);
}

if (!PRODUCT_ID) {
  console.error('❌ Please set PRODUCT_ID environment variable');
  console.error('Example: PRODUCT_ID=7c7378f5-9e94-465e-bec7-f2a71d528e61 npx ts-node scripts/test-associations-api.ts');
  process.exit(1);
}

/**
 * Test GET /api/products/:id/associations
 */
async function testGetProductAssociations() {
  console.log(`\n=== Test: GET /api/products/${PRODUCT_ID}/associations ===`);
  
  try {
    const url = `${BACKEND_API_URL}/api/products/${PRODUCT_ID}/associations?page=1&limit=10`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Success!');
    console.log(`Total associations: ${data.total}`);
    console.log(`Customers in response: ${data.customers?.length || 0}`);
    
    if (data.customers && data.customers.length > 0) {
      console.log('\nFirst customer:');
      console.log(JSON.stringify(data.customers[0], null, 2));
    }
    
    return data;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Testing Product Associations API...');
  console.log(`Backend URL: ${BACKEND_API_URL}`);
  console.log(`Product ID: ${PRODUCT_ID}`);
  console.log(`Token: ${TEST_TOKEN.substring(0, 20)}...`);
  
  await testGetProductAssociations();
}

main().catch(console.error);

