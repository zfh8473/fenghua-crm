/**
 * Script to check user login credentials
 * 
 * This script helps debug login issues by checking:
 * - User exists in database
 * - Password hash is correct
 * - User is not soft deleted
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function checkUserLogin(email: string, password: string) {
  const client = await pool.connect();
  
  try {
    console.log(`\n检查用户登录: ${email}`);
    console.log('='.repeat(50));
    
    // 1. 检查用户是否存在
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.email_verified,
        u.deleted_at,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE LOWER(u.email) = LOWER($1)
        AND u.deleted_at IS NULL
      LIMIT 1
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ 用户不存在或已被删除');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ 用户存在');
    console.log(`   用户 ID: ${user.id}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   姓名: ${user.first_name || ''} ${user.last_name || ''}`);
    console.log(`   角色: ${user.role_name || '无角色'}`);
    console.log(`   邮箱已验证: ${user.email_verified}`);
    console.log(`   已删除: ${user.deleted_at ? '是' : '否'}`);
    
    // 2. 检查密码哈希
    if (!user.password_hash) {
      console.log('❌ 用户没有密码哈希');
      return;
    }
    
    console.log(`\n密码哈希: ${user.password_hash.substring(0, 30)}...`);
    
    // 3. 验证密码
    console.log('\n验证密码...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ 密码正确');
    } else {
      console.log('❌ 密码不正确');
      console.log('\n可能的原因：');
      console.log('  1. 密码输入错误');
      console.log('  2. 密码哈希在数据库迁移时未正确设置');
      console.log('  3. 密码哈希格式不正确');
    }
    
    // 4. 检查邮箱验证状态
    if (!user.email_verified) {
      console.log('\n⚠️  邮箱未验证（可能不影响登录）');
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 从命令行参数获取邮箱和密码
const email = process.argv[2] || 'zfh8473@gmail.com';
const password = process.argv[3] || 'Zfh122431!';

checkUserLogin(email, password)
  .then(() => {
    console.log('\n检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

