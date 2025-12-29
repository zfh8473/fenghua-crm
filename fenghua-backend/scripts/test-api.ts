/**
 * Twenty CRM User Management API Test Script
 * Run from fenghua-backend directory: npx ts-node scripts/test-api.ts
 */

import { GraphQLClient } from 'graphql-request';

const TWENTY_API_URL = process.env.TWENTY_API_URL || 'http://localhost:3000/graphql';
const TEST_TOKEN = process.env.TWENTY_TEST_TOKEN || '';

if (!TEST_TOKEN) {
  console.error('❌ Please set TWENTY_TEST_TOKEN environment variable');
  console.error('');
  console.error('To get a token, run:');
  console.error('  TWENTY_TEST_EMAIL=your@email.com TWENTY_TEST_PASSWORD=yourpassword npx ts-node scripts/get-token.ts');
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
 * Note: workspaceMembers returns WorkspaceMemberConnection (GraphQL connection pattern)
 */
async function testQueryWorkspaceMembers() {
  console.log('\n=== Test 1: Query Workspace Members ===');
  
  // Try connection pattern (edges/node) - WorkspaceMember has userId, not user
  const query = `
    query {
      workspaceMembers {
        edges {
          node {
            id
            userId
            roles {
              id
            }
            createdAt
            updatedAt
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
 * Test 2: Query current user and workspace
 */
async function testQueryCurrentUser() {
  console.log('\n=== Test 2: Query Current User and Workspace ===');
  
  // Try without workspace field - Role might have id or other fields
  const query = `
    query {
      currentUser {
        id
        email
        firstName
        lastName
        workspaceMember {
          id
          roles {
            id
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
  
  // Try different mutation formats - Based on errors, need data parameter and UUID type
  const mutations = [
    {
      name: 'UpdateWorkspaceMember (with data parameter)',
      mutation: `
        mutation UpdateWorkspaceMember($id: UUID!, $data: WorkspaceMemberUpdateInput!) {
          updateWorkspaceMember(
            id: $id
            data: $data
          ) {
            id
            roles {
              id
            }
            updatedAt
          }
        }
      `,
      variables: { id: workspaceMemberId, data: { roles: [{ id: '7a5e2079-4d69-4712-85d9-e10a66d81972' }] } },
    },
    {
      name: 'UpdateWorkspaceMember (with roleIds)',
      mutation: `
        mutation UpdateWorkspaceMember($id: UUID!, $data: WorkspaceMemberUpdateInput!) {
          updateWorkspaceMember(
            id: $id
            data: $data
          ) {
            id
            roles {
              id
            }
          }
        }
      `,
      variables: { id: workspaceMemberId, data: { roleIds: ['7a5e2079-4d69-4712-85d9-e10a66d81972'] } },
    },
  ];

  for (const { name, mutation, variables } of mutations) {
    try {
      console.log(`  Trying: ${name}...`);
      const result = await client.request(mutation, variables as any);
      console.log(`✅ Success - ${name} is supported:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      console.log(`  ⚠️  ${name} not available:`, error.message);
    }
  }

  console.log('⚠️  All UpdateWorkspaceMember mutation formats failed');
  return null;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Twenty CRM User Management API Tests...');
  console.log(`API URL: ${TWENTY_API_URL}`);
  console.log(`Token: ${TEST_TOKEN.substring(0, 20)}...`);

  const results: any = {};

  // Test 1: Query workspace members
  results.workspaceMembers = await testQueryWorkspaceMembers();
  
  // Test 2: Query current user
  results.currentUser = await testQueryCurrentUser();
  
  // Test 3: Try create user
  results.createUser = await testCreateUser();
  
  // Test 4 & 5: If we have workspace member data, test role management
  const workspaceMembersData = results.workspaceMembers && (results.workspaceMembers as any).workspaceMembers?.edges;
  if (workspaceMembersData && workspaceMembersData.length > 0) {
    const firstMember = workspaceMembersData[0].node;
    
    if (firstMember?.id) {
      // Test 5: Update workspace member role
      results.updateRole = await testUpdateWorkspaceMemberRole(firstMember.id);
    }
  }

  console.log('\n=== Test Summary ===');
  console.log('✅ Query Workspace Members:', results.workspaceMembers ? 'Available' : 'Failed');
  console.log('✅ Query Current User:', results.currentUser ? 'Available' : 'Failed');
  console.log('❓ Create User:', results.createUser ? 'Available' : 'Not Available');
  console.log('❓ Update Workspace Member Role:', results.updateRole ? 'Available' : 'Not Available');
  console.log('\nPlease review the results above to determine which APIs are available.');
  console.log('Update the implementation in users.service.ts based on actual API support.');
}

// Run tests
runTests().catch(console.error);

