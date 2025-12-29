/**
 * Twenty CRM User Management API Test Script
 * 
 * This script tests the actual GraphQL API endpoints for user management
 * 
 * Run from fenghua-backend directory:
 *   cd fenghua-backend
 *   TWENTY_TEST_TOKEN=your_token npx ts-node ../scripts/test-twenty-user-api.ts
 * 
 * Or use the helper script:
 *   ./scripts/run-api-tests.sh
 */

import { GraphQLClient } from 'graphql-request';

const TWENTY_API_URL = process.env.TWENTY_API_URL || 'http://localhost:3000/graphql';
const TEST_TOKEN = process.env.TWENTY_TEST_TOKEN || '';

if (!TEST_TOKEN) {
  console.error('❌ Please set TWENTY_TEST_TOKEN environment variable');
  console.error('');
  console.error('To get a token, you can:');
  console.error('1. Use the login script:');
  console.error('   TWENTY_TEST_EMAIL=your@email.com TWENTY_TEST_PASSWORD=yourpassword npx ts-node scripts/get-token-from-login.ts');
  console.error('');
  console.error('2. Get token from browser:');
  console.error('   - Login to Twenty CRM at http://localhost:3000');
  console.error('   - Open DevTools > Application > Local Storage');
  console.error('   - Find token key and copy value');
  console.error('   - Set: export TWENTY_TEST_TOKEN=your_token');
  console.error('');
  process.exit(1);
}

const client = new GraphQLClient(TWENTY_API_URL, {
  headers: {
    authorization: `Bearer ${TEST_TOKEN}`,
  },
});

/**
 * Test 1: Query workspace members
 */
async function testQueryWorkspaceMembers() {
  console.log('\n=== Test 1: Query Workspace Members ===');
  
  const query = `
    query {
      workspaceMembers {
        id
        user {
          id
          email
          firstName
          lastName
        }
        roles {
          role
        }
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const result = await client.request(query);
    console.log('✅ Success:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

/**
 * Test 2: Query current user and workspace
 */
async function testQueryCurrentUser() {
  console.log('\n=== Test 2: Query Current User and Workspace ===');
  
  const query = `
    query {
      currentUser {
        id
        email
        firstName
        lastName
        workspaceMember {
          id
          workspace {
            id
            name
          }
          roles {
            role
          }
        }
      }
    }
  `;

  try {
    const result = await client.request(query);
    console.log('✅ Success:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

/**
 * Test 3: Try to create user (may not be supported)
 */
async function testCreateUser() {
  console.log('\n=== Test 3: Try Create User ===');
  
  const mutation = `
    mutation CreateUser($email: String!, $password: String!, $firstName: String, $lastName: String) {
      createUser(
        email: $email
        password: $password
        firstName: $firstName
        lastName: $lastName
      ) {
        id
        email
        firstName
        lastName
        createdAt
      }
    }
  `;

  try {
    const result = await client.request(mutation, {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    });
    console.log('✅ Success - CreateUser is supported:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.log('⚠️  CreateUser mutation not available:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

/**
 * Test 4: Try to create workspace member
 */
async function testCreateWorkspaceMember(userId: string, workspaceId: string) {
  console.log('\n=== Test 4: Try Create Workspace Member ===');
  
  const mutation = `
    mutation CreateWorkspaceMember($userId: ID!, $workspaceId: ID!, $role: String!) {
      createWorkspaceMember(
        userId: $userId
        workspaceId: $workspaceId
        role: $role
      ) {
        id
        roles {
          role
        }
        createdAt
      }
    }
  `;

  try {
    const result = await client.request(mutation, {
      userId: userId,
      workspaceId: workspaceId,
      role: 'USER',
    });
    console.log('✅ Success - CreateWorkspaceMember is supported:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.log('⚠️  CreateWorkspaceMember mutation not available:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

/**
 * Test 5: Try to update workspace member role
 */
async function testUpdateWorkspaceMemberRole(workspaceMemberId: string) {
  console.log('\n=== Test 5: Try Update Workspace Member Role ===');
  
  const mutation = `
    mutation UpdateWorkspaceMember($id: ID!, $role: String!) {
      updateWorkspaceMember(
        id: $id
        role: $role
      ) {
        id
        roles {
          role
        }
        updatedAt
      }
    }
  `;

  try {
    const result = await client.request(mutation, {
      id: workspaceMemberId,
      role: 'ADMIN',
    });
    console.log('✅ Success - UpdateWorkspaceMember is supported:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.log('⚠️  UpdateWorkspaceMember mutation not available:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Twenty CRM User Management API Tests...');
  console.log(`API URL: ${TWENTY_API_URL}`);
  console.log(`Token: ${TEST_TOKEN.substring(0, 20)}...`);

  // Test 1: Query workspace members
  const membersResult = await testQueryWorkspaceMembers();
  
  // Test 2: Query current user
  const currentUserResult = await testQueryCurrentUser();
  
  // Test 3: Try create user
  await testCreateUser();
  
  // Test 4 & 5: If we have workspace member data, test role management
  if (membersResult && (membersResult as any).workspaceMembers?.length > 0) {
    const firstMember = (membersResult as any).workspaceMembers[0];
    const workspaceId = currentUserResult && (currentUserResult as any).currentUser?.workspaceMember?.workspace?.id;
    
    if (workspaceId && firstMember.user?.id) {
      // Test 4: Create workspace member (will likely fail if user doesn't exist)
      // await testCreateWorkspaceMember(firstMember.user.id, workspaceId);
    }
    
    if (firstMember.id) {
      // Test 5: Update workspace member role
      await testUpdateWorkspaceMemberRole(firstMember.id);
    }
  }

  console.log('\n=== Test Summary ===');
  console.log('Please review the results above to determine which APIs are available.');
  console.log('Update the implementation in users.service.ts based on actual API support.');
}

// Run tests
runTests().catch(console.error);

