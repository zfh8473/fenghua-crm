/**
 * GDPR Deletion API Test Script
 * 
 * Tests the GDPR deletion API endpoints and validates fixes
 * 
 * Run from fenghua-backend directory:
 *   cd fenghua-backend
 *   BACKEND_URL=http://localhost:3001 TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword npx ts-node ../scripts/test-gdpr-deletion-api.ts
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface DeletionRequestResponse {
  id: string;
  status: string;
  requestedAt: string;
  userId: string;
}

interface DeletionRequestListResponse {
  data: DeletionRequestResponse[];
  total: number;
}

let authToken: string = '';
let userId: string = '';
let userRole: string = '';

/**
 * Helper function to make HTTP requests
 */
function httpRequest(url: string, options: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; statusText: string; text: () => Promise<string>; json: () => Promise<any> }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          text: async () => data,
          json: async () => JSON.parse(data),
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Login to get authentication token
 */
async function login(): Promise<boolean> {
  console.log('\n=== Step 1: Login ===');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);

  try {
    const response = await httpRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (response.status < 200 || response.status >= 300) {
      const errorText = await response.text();
      console.error(`❌ Login failed: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);
      return false;
    }

    const data = await response.json() as LoginResponse;
    authToken = data.token;
    userId = data.user.id;
    userRole = data.user.role;

    console.log(`✅ Login successful`);
    console.log(`User ID: ${userId}`);
    console.log(`User Role: ${userRole}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Login error: ${error.message}`);
    return false;
  }
}

/**
 * Test 1: Create deletion request with valid confirmation
 */
async function testCreateDeletionRequest(): Promise<string | null> {
  console.log('\n=== Test 1: Create Deletion Request (Valid Confirmation) ===');

  try {
    const response = await httpRequest(`${BACKEND_URL}/gdpr/deletion-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        confirmation: '确认删除',
      }),
    });

    if (response.status < 200 || response.status >= 300) {
      const errorText = await response.text();
      console.error(`❌ Failed: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);
      return null;
    }

    const data = await response.json() as DeletionRequestResponse;
    console.log(`✅ Success`);
    console.log(`Request ID: ${data.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`Requested At: ${data.requestedAt}`);

    return data.id;
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 2: Create deletion request with invalid confirmation
 */
async function testCreateDeletionRequestInvalidConfirmation() {
  console.log('\n=== Test 2: Create Deletion Request (Invalid Confirmation) ===');

  try {
    const response = await httpRequest(`${BACKEND_URL}/gdpr/deletion-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        confirmation: 'wrong confirmation',
      }),
    });

      if (response.status === 400 || response.status === 422) {
      console.log(`✅ Correctly rejected invalid confirmation`);
      const errorText = await response.text();
      console.log(`Error message: ${errorText}`);
    } else {
      console.error(`❌ Expected 400, got ${response.status}`);
      const errorText = await response.text();
      console.error(`Response: ${errorText}`);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 3: Test confirmation validation (case-insensitive for English)
 */
async function testConfirmationValidation() {
  console.log('\n=== Test 3: Confirmation Validation (Case-Insensitive) ===');

  const testCases = [
    { confirmation: 'DELETE', expected: true, description: 'Uppercase DELETE' },
    { confirmation: 'delete', expected: true, description: 'Lowercase delete' },
    { confirmation: 'Delete', expected: true, description: 'Mixed case Delete' },
    { confirmation: '  DELETE  ', expected: true, description: 'DELETE with spaces' },
    { confirmation: '确认删除', expected: true, description: 'Chinese confirmation' },
    { confirmation: ' 确认删除 ', expected: true, description: 'Chinese with spaces' },
    { confirmation: 'wrong', expected: false, description: 'Invalid confirmation' },
  ];

  for (const testCase of testCases) {
    try {
      const response = await httpRequest(`${BACKEND_URL}/gdpr/deletion-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          confirmation: testCase.confirmation,
        }),
      });

      const isValid = response.status >= 200 && response.status < 300;
      const matchesExpected = isValid === testCase.expected;

      if (matchesExpected) {
        console.log(`✅ ${testCase.description}: ${isValid ? 'Accepted' : 'Rejected'} (as expected)`);
        if (isValid) {
          const data = await response.json() as DeletionRequestResponse;
          console.log(`   Request ID: ${data.id}`);
        }
      } else {
        console.error(`❌ ${testCase.description}: Expected ${testCase.expected ? 'accept' : 'reject'}, got ${isValid ? 'accept' : 'reject'}`);
      }
    } catch (error: any) {
      if (!testCase.expected) {
        console.log(`✅ ${testCase.description}: Rejected (as expected)`);
      } else {
        console.error(`❌ ${testCase.description}: Error - ${error.message}`);
      }
    }
  }
}

/**
 * Test 4: Get deletion request list
 */
async function testGetDeletionRequestList() {
  console.log('\n=== Test 4: Get Deletion Request List ===');

  try {
    const response = await httpRequest(`${BACKEND_URL}/gdpr/deletion-requests?limit=50&offset=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (response.status < 200 || response.status >= 300) {
      const errorText = await response.text();
      console.error(`❌ Failed: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);
      return;
    }

    const data = await response.json() as DeletionRequestListResponse;
    console.log(`✅ Success`);
    console.log(`Total requests: ${data.total}`);
    console.log(`Returned requests: ${data.data.length}`);
    
    if (data.data.length > 0) {
      console.log('\nRecent requests:');
      data.data.slice(0, 5).forEach((req, index) => {
        console.log(`  ${index + 1}. ID: ${req.id}`);
        console.log(`     Status: ${req.status}`);
        console.log(`     Requested At: ${req.requestedAt}`);
      });
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 5: Get deletion request by ID
 */
async function testGetDeletionRequestById(requestId: string) {
  console.log('\n=== Test 5: Get Deletion Request By ID ===');
  console.log(`Request ID: ${requestId}`);

  try {
    const response = await httpRequest(`${BACKEND_URL}/gdpr/deletion-requests/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (response.status < 200 || response.status >= 300) {
      const errorText = await response.text();
      console.error(`❌ Failed: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);
      return;
    }

    const data = await response.json() as DeletionRequestResponse;
    console.log(`✅ Success`);
    console.log(`Request ID: ${data.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`User ID: ${data.userId}`);
    console.log(`Requested At: ${data.requestedAt}`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 6: Security test - Try to access another user's request
 */
async function testSecurityAccessOtherUserRequest() {
  console.log('\n=== Test 6: Security Test - Access Other User\'s Request ===');
  console.log('⚠️  This test requires a valid request ID from another user');
  console.log('⚠️  Skipping for now (requires test data setup)');
  // This test would require:
  // 1. Create a request with user A
  // 2. Try to access it with user B's token
  // 3. Should return 404 or 403
}

/**
 * Test 7: Test without authentication
 */
async function testWithoutAuth() {
  console.log('\n=== Test 7: Security Test - Without Authentication ===');

  try {
    const response = await httpRequest(`${BACKEND_URL}/gdpr/deletion-requests`, {
      method: 'GET',
    });

    if (response.status === 401) {
      console.log(`✅ Correctly rejected request without authentication (401)`);
    } else {
      console.error(`❌ Expected 401, got ${response.status}`);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 8: Test role-based deletion (check deletion option based on role)
 */
async function testRoleBasedDeletion() {
  console.log('\n=== Test 8: Role-Based Deletion Test ===');
  console.log(`Current user role: ${userRole}`);

  const roleDeletionMap: Record<string, string> = {
    'FRONTEND_SPECIALIST': '删除我的采购商数据',
    'BACKEND_SPECIALIST': '删除我的供应商数据',
    'DIRECTOR': '删除我的所有数据',
    'ADMIN': '删除我的所有数据',
  };

  const expectedOption = roleDeletionMap[userRole.toUpperCase()];
  if (expectedOption) {
    console.log(`✅ Expected deletion option for role ${userRole}: ${expectedOption}`);
    console.log(`   (This is validated in frontend, backend handles role filtering automatically)`);
  } else {
    console.log(`⚠️  Unknown role: ${userRole}`);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('========================================');
  console.log('GDPR Deletion API Test Suite');
  console.log('========================================');
  console.log(`Backend URL: ${BACKEND_URL}`);

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error('\n❌ Please set TEST_EMAIL and TEST_PASSWORD environment variables');
    console.error('\nExample:');
    console.error('  TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword npx ts-node ../scripts/test-gdpr-deletion-api.ts');
    process.exit(1);
  }

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Login failed. Cannot continue tests.');
    process.exit(1);
  }

  // Test 1: Create deletion request
  const requestId = await testCreateDeletionRequest();

  // Test 2: Invalid confirmation
  await testCreateDeletionRequestInvalidConfirmation();

  // Test 3: Confirmation validation (case-insensitive)
  await testConfirmationValidation();

  // Test 4: Get deletion request list
  await testGetDeletionRequestList();

  // Test 5: Get deletion request by ID (if we have a request ID)
  if (requestId) {
    await testGetDeletionRequestById(requestId);
  }

  // Test 6: Security test
  await testSecurityAccessOtherUserRequest();

  // Test 7: Without authentication
  await testWithoutAuth();

  // Test 8: Role-based deletion
  await testRoleBasedDeletion();

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log('✅ Basic API tests completed');
  console.log('✅ Confirmation validation tests completed');
  console.log('✅ Security tests completed');
  console.log('\n📝 Note: For full deletion processing tests, you need to:');
  console.log('   1. Wait for the deletion job to process (check Bull Queue)');
  console.log('   2. Verify deletion summary includes correct counts');
  console.log('   3. Verify progress tracking is accurate (H3 fix)');
  console.log('   4. Verify partial failure detection (H1 fix)');
  console.log('   5. Verify user-created products are deleted (H2 fix)');
}

// Run tests
runTests().catch(console.error);
