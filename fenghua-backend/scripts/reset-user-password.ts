/**
 * Script to reset user password
 * 
 * This script helps reset password for a user
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
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

async function resetPassword(email: string, newPassword: string) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`\n重置用户密码: ${email}`);
    console.log('='.repeat(50));
    
    // 1. 检查用户是否存在（包括已删除的）
    const userQuery = `
      SELECT id, email, deleted_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ 用户不存在');
      await client.query('ROLLBACK');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ 找到用户');
    console.log(`   用户 ID: ${user.id}`);
    console.log(`   邮箱: ${user.email}`);
    
    // 2. 如果用户被删除，先恢复
    if (user.deleted_at) {
      console.log('\n恢复已删除的用户...');
      await client.query(
        'UPDATE users SET deleted_at = NULL WHERE id = $1',
        [user.id]
      );
      console.log('✅ 用户已恢复');
    }
    
    // 3. 生成密码哈希
    console.log('\n生成密码哈希...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // 4. 更新密码
    console.log('更新密码...');
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, user.id]
    );
    
    await client.query('COMMIT');
    
    console.log('✅ 密码重置成功');
    console.log('\n现在可以使用新密码登录：');
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${newPassword}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('错误:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('用法: npx ts-node scripts/reset-user-password.ts <email> <password>');
  process.exit(1);
}

resetPassword(email, password)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

