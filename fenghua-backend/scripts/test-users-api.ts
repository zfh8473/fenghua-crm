/**
 * Test Users API Endpoints
 * Run from fenghua-backend directory: 
 *   export TWENTY_TEST_TOKEN=your_token
 *   npx ts-node scripts/test-users-api.ts
 */

import { GraphQLClient } from 'graphql-request';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TWENTY_TEST_TOKEN || '';

if (!TEST_TOKEN) {
  console.error('❌ Please set TWENTY_TEST_TOKEN environment variable');
  process.exit(1);
}

/**
 * Test GET /users - Get all users
 */
async function testGetAllUsers() {
  console.log('\n=== Test 1: GET /users (findAll) ===');
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error:', errorData.message || `HTTP ${response.status}`);
      return null;
    }

    const users = await response.json();
    console.log(`✅ Success: Found ${users.length} users`);
    if (users.length > 0) {
      console.log('First user:', JSON.stringify(users[0], null, 2));
    }
    return users;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

/**
 * Test GET /users/:id - Get user by ID
 */
async function testGetUserById(userId: string) {
  console.log(`\n=== Test 2: GET /users/${userId} (findOne) ===`);
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error:', errorData.message || `HTTP ${response.status}`);
      return null;
    }

    const user = await response.json();
    console.log('✅ Success:', JSON.stringify(user, null, 2));
    return user;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

/**
 * Test POST /users - Create user (should fail with helpful message)
 */
async function testCreateUser() {
  console.log('\n=== Test 3: POST /users (create) ===');
  
  const newUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
  };

  try {
    const response = await fetch(`${BACKEND_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(newUser),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('⚠️  Expected failure:', errorData.message);
      if (errorData.message.includes('not supported') || errorData.message.includes('manually')) {
        console.log('✅ Error message is helpful and guides user to manual creation');
        return { success: false, message: errorData.message };
      } else {
        console.log('⚠️  Unexpected error message');
        return { success: false, message: errorData.message };
      }
    }

    const user = await response.json();
    console.log('✅ Success (unexpected):', JSON.stringify(user, null, 2));
    return { success: true, user };
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test PUT /users/:id - Update user
 */
async function testUpdateUser(userId: string) {
  console.log(`\n=== Test 4: PUT /users/${userId} (update) ===`);
  
  const updateData = {
    firstName: 'Updated',
    lastName: 'Name',
  };

  try {
    const response = await fetch(`${BACKEND_API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error:', errorData.message || `HTTP ${response.status}`);
      return null;
    }

    const user = await response.json();
    console.log('✅ Success:', JSON.stringify(user, null, 2));
    return user;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

/**
 * Test DELETE /users/:id - Delete user (should prevent self-deletion)
 */
async function testDeleteUser(userId: string, currentUserId: string) {
  console.log(`\n=== Test 5: DELETE /users/${userId} (remove) ===`);
  
  // Test self-deletion prevention
  if (userId === currentUserId) {
    console.log('Testing self-deletion prevention...');
    try {
      const response = await fetch(`${BACKEND_API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message.includes('不能删除自己的账户') || errorData.message.includes('cannot delete')) {
          console.log('✅ Self-deletion correctly prevented:', errorData.message);
          return { success: false, expected: true, message: errorData.message };
        }
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }
  }

  // Note: We won't actually delete a user in testing
  console.log('⚠️  Skipping actual deletion to preserve data');
  return { skipped: true };
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Users API Tests...');
  console.log(`Backend URL: ${BACKEND_API_URL}`);
  console.log(`Token: ${TEST_TOKEN.substring(0, 20)}...`);

  // Test 1: Get all users
  const users = await testGetAllUsers();
  
  if (!users || users.length === 0) {
    console.log('\n⚠️  No users found, cannot continue with other tests');
    return;
  }

  const firstUser = users[0];
  const userId = firstUser.id;

  // Test 2: Get user by ID
  await testGetUserById(userId);

  // Test 3: Create user (should fail)
  await testCreateUser();

  // Test 4: Update user
  await testUpdateUser(userId);

  // Test 5: Delete user (test self-deletion prevention)
  await testDeleteUser(userId, userId);

  console.log('\n=== Test Summary ===');
  console.log('✅ Test 1: GET /users - Completed');
  console.log('✅ Test 2: GET /users/:id - Completed');
  console.log('✅ Test 3: POST /users - Completed (expected to fail)');
  console.log('✅ Test 4: PUT /users/:id - Completed');
  console.log('✅ Test 5: DELETE /users/:id - Completed (self-deletion test)');
  console.log('\n📋 Review the results above to verify all methods work as expected.');
}

runTests().catch(console.error);

