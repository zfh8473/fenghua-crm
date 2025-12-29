/**
 * Script to create admin user
 * 
 * This script creates a user with admin role
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

async function createAdminUser(email: string, password: string, firstName?: string, lastName?: string) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`\n创建管理员用户: ${email}`);
    console.log('='.repeat(50));
    
    // 1. 检查用户是否已存在
    const checkQuery = `
      SELECT id, email, deleted_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;
    
    const checkResult = await client.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      if (existingUser.deleted_at) {
        console.log('⚠️  用户已存在但被删除，将恢复用户...');
        // 恢复用户
        await client.query(
          'UPDATE users SET deleted_at = NULL WHERE id = $1',
          [existingUser.id]
        );
        console.log('✅ 用户已恢复');
      } else {
        console.log('❌ 用户已存在');
        await client.query('ROLLBACK');
        return;
      }
    }
    
    // 2. 获取 ADMIN 角色 ID
    const roleQuery = 'SELECT id FROM roles WHERE name = $1 LIMIT 1';
    const roleResult = await client.query(roleQuery, ['ADMIN']);
    
    if (roleResult.rows.length === 0) {
      console.log('❌ ADMIN 角色不存在，请先运行迁移脚本创建角色');
      await client.query('ROLLBACK');
      return;
    }
    
    const roleId = roleResult.rows[0].id;
    console.log(`✅ 找到 ADMIN 角色 (ID: ${roleId})`);
    
    // 3. 生成密码哈希
    console.log('生成密码哈希...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 4. 创建用户
    if (checkResult.rows.length === 0) {
      console.log('创建新用户...');
      const insertUserQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      
      const userResult = await client.query(insertUserQuery, [
        email,
        passwordHash,
        firstName || null,
        lastName || null,
      ]);
      
      const userId = userResult.rows[0].id;
      console.log(`✅ 用户创建成功 (ID: ${userId})`);
      
      // 5. 分配 ADMIN 角色
      console.log('分配 ADMIN 角色...');
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [userId, roleId]
      );
      console.log('✅ 角色分配成功');
    } else {
      // 更新现有用户的密码
      const userId = checkResult.rows[0].id;
      console.log('更新用户密码...');
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, userId]
      );
      console.log('✅ 密码更新成功');
      
      // 确保用户有 ADMIN 角色
      const roleCheckQuery = `
        SELECT role_id FROM user_roles WHERE user_id = $1 AND role_id = $2
      `;
      const roleCheckResult = await client.query(roleCheckQuery, [userId, roleId]);
      
      if (roleCheckResult.rows.length === 0) {
        console.log('分配 ADMIN 角色...');
        await client.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [userId, roleId]
        );
        console.log('✅ 角色分配成功');
      } else {
        console.log('✅ 用户已有 ADMIN 角色');
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ 用户创建/更新成功！');
    console.log('\n登录信息：');
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${password}`);
    console.log(`   角色: ADMIN`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('错误:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const email = process.argv[2] || 'zfh8473@gmail.com';
const password = process.argv[3] || 'Zfh122431!';
const firstName = process.argv[4] || 'Admin';
const lastName = process.argv[5] || 'User';

createAdminUser(email, password, firstName, lastName)
  .then(() => {
    console.log('\n现在可以登录了！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

