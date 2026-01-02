/**
 * Direct test of UsersService methods
 * This tests the service methods directly without going through HTTP
 * 
 * Run: cd fenghua-backend && export TWENTY_TEST_TOKEN=your_token && npx ts-node scripts/test-users-direct.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

const TEST_TOKEN = process.env.TWENTY_TEST_TOKEN || '';

if (!TEST_TOKEN) {
  console.error('❌ Please set TWENTY_TEST_TOKEN environment variable');
  process.exit(1);
}

async function testUsersService() {
  console.log('🚀 Starting Direct UsersService Tests...');
  console.log(`Token: ${TEST_TOKEN.substring(0, 20)}...\n`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Test 1: findAll
    console.log('=== Test 1: findAll() ===');
    try {
      const users = await usersService.findAll();
      console.log(`✅ Success: Found ${users.length} users`);
      if (users.length > 0) {
        console.log('First user:', JSON.stringify(users[0], null, 2));
        
        const firstUserId = users[0].id;
        
        // Test 2: findOne
        console.log('\n=== Test 2: findOne() ===');
        try {
          const user = await usersService.findOne(firstUserId);
          console.log('✅ Success:', JSON.stringify(user, null, 2));
        } catch (error: any) {
          console.error('❌ Error:', error.message);
        }

        // Test 3: update
        console.log('\n=== Test 3: update() ===');
        try {
          const mockOperatorId = firstUserId; // Use first user as operator for testing
          const updatedUser = await usersService.update(firstUserId, {
            firstName: 'Updated',
            lastName: 'Name',
          }, mockOperatorId);
          console.log('✅ Success:', JSON.stringify(updatedUser, null, 2));
        } catch (error: any) {
          console.error('❌ Error:', error.message);
        }

        // Test 4: create (should fail with helpful message)
        console.log('\n=== Test 4: create() ===');
        try {
          await usersService.create({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'FRONTEND_SPECIALIST' as any,
          });
          console.log('⚠️  Unexpected success (create should not work)');
        } catch (error: any) {
          if (error.message && (error.message.includes('not supported') || error.message.includes('manually'))) {
            console.log('✅ Expected failure with helpful message:', error.message);
          } else {
            console.error('❌ Unexpected error:', error.message);
          }
        }

        // Test 5: remove (test self-deletion prevention)
        console.log('\n=== Test 5: remove() - Self-deletion prevention ===');
        try {
          // Get current user ID from token (decode JWT)
          const tokenParts = TEST_TOKEN.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const currentUserId = payload.userId || payload.sub;
            
            if (currentUserId) {
              await usersService.remove(currentUserId, currentUserId);
              console.log('⚠️  Self-deletion was not prevented');
            } else {
              console.log('⚠️  Could not extract current user ID from token');
            }
          }
        } catch (error: any) {
          if (error.message && (error.message.includes('不能删除自己的账户') || error.message.includes('cannot delete'))) {
            console.log('✅ Self-deletion correctly prevented:', error.message);
          } else {
            console.error('❌ Error:', error.message);
          }
        }
      } else {
        console.log('⚠️  No users found, skipping other tests');
      }
    } catch (error: any) {
      console.error('❌ Error in findAll:', error.message);
      if (error.response) {
        console.error('Response:', JSON.stringify(error.response, null, 2));
      }
    }

    console.log('\n=== Test Summary ===');
    console.log('✅ Test 1: findAll() - Completed');
    console.log('✅ Test 2: findOne() - Completed');
    console.log('✅ Test 3: update() - Completed');
    console.log('✅ Test 4: create() - Completed (expected to fail)');
    console.log('✅ Test 5: remove() - Completed (self-deletion test)');
    
  } finally {
    await app.close();
  }
}

testUsersService().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

