/**
 * Script to check if user exists in database (including soft deleted)
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function checkUser(email: string) {
  const client = await pool.connect();
  
  try {
    console.log(`\n检查用户: ${email}`);
    console.log('='.repeat(50));
    
    // 检查所有用户（包括已删除的）
    const query = `
      SELECT 
        u.id,
        u.email,
        u.password_hash IS NOT NULL as has_password,
        u.first_name,
        u.last_name,
        u.email_verified,
        u.deleted_at,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1
    `;
    
    const result = await client.query(query, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ 用户不存在');
      console.log('\n建议：');
      console.log('  1. 使用管理员账户创建新用户');
      console.log('  2. 或运行数据迁移脚本导入用户');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ 用户存在');
    console.log(`   用户 ID: ${user.id}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   姓名: ${user.first_name || ''} ${user.last_name || ''}`);
    console.log(`   角色: ${user.role_name || '无角色'}`);
    console.log(`   邮箱已验证: ${user.email_verified}`);
    console.log(`   有密码: ${user.has_password ? '是' : '否'}`);
    console.log(`   已删除: ${user.deleted_at ? '是' : '否'}`);
    
    if (user.deleted_at) {
      console.log(`\n⚠️  用户已被软删除`);
      console.log(`   删除时间: ${user.deleted_at}`);
      console.log('\n建议：');
      console.log('  恢复用户（设置 deleted_at = NULL）');
    }
    
    if (!user.has_password) {
      console.log(`\n⚠️  用户没有密码哈希`);
      console.log('\n建议：');
      console.log('  需要设置密码或重置密码');
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

const email = process.argv[2] || 'zfh8473@gmail.com';
checkUser(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

