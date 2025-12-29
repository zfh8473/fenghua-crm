/**
 * Set User as Admin
 * 
 * This script sets a user to ADMIN role by email
 * 
 * Usage:
 *   export TWENTY_TEST_TOKEN=your_admin_token
 *   npx ts-node scripts/set-user-admin.ts zfh8473@gmail.com
 */

import { GraphQLClient } from 'graphql-request';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TWENTY_TEST_TOKEN || '';

if (!TEST_TOKEN) {
  console.error('❌ Please set TWENTY_TEST_TOKEN environment variable');
  process.exit(1);
}

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide user email as argument');
  console.error('Usage: npx ts-node scripts/set-user-admin.ts <email>');
  process.exit(1);
}

/**
 * Find user by email and return userId
 */
async function findUserByEmail(email: string): Promise<string | null> {
  console.log(`\n=== Finding user: ${email} ===`);
  
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
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log(`Available users: ${users.map((u: any) => u.email).join(', ')}`);
      return null;
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    console.log(`   Current role: ${user.role || 'NONE'}`);
    return user.id;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

/**
 * Assign ADMIN role to user
 */
async function assignAdminRole(userId: string): Promise<boolean> {
  console.log(`\n=== Assigning ADMIN role to user ${userId} ===`);
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/roles/users/${userId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({
        role: 'ADMIN',
        reason: 'Set as admin via script',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error:', errorData.message || `HTTP ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Success: User role set to ADMIN`);
    console.log(`   Role ID: ${result.roleId || 'N/A'}`);
    console.log(`   Assigned at: ${result.assignedAt || 'N/A'}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Set User as Admin ===');
  console.log(`Backend API: ${BACKEND_API_URL}`);
  console.log(`User Email: ${userEmail}`);
  
  // Find user by email
  const userId = await findUserByEmail(userEmail);
  
  if (!userId) {
    console.error('\n❌ Failed to find user');
    process.exit(1);
  }
  
  // Assign ADMIN role
  const success = await assignAdminRole(userId);
  
  if (success) {
    console.log('\n✅ User successfully set as ADMIN');
  } else {
    console.error('\n❌ Failed to set user as ADMIN');
    process.exit(1);
  }
}

main().catch(console.error);

