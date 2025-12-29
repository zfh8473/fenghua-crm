/**
 * Script to list all users in database
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

async function listUsers() {
  const client = await pool.connect();
  
  try {
    console.log('\n数据库中的所有用户：');
    console.log('='.repeat(50));
    
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.password_hash IS NOT NULL as has_password,
        u.email_verified,
        u.deleted_at,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      ORDER BY u.created_at DESC
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ 数据库中没有用户');
      return;
    }
    
    console.log(`找到 ${result.rows.length} 个用户：\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   用户 ID: ${user.id}`);
      console.log(`   姓名: ${user.first_name || ''} ${user.last_name || ''}`);
      console.log(`   角色: ${user.role_name || '无角色'}`);
      console.log(`   有密码: ${user.has_password ? '是' : '否'}`);
      console.log(`   已删除: ${user.deleted_at ? '是' : '否'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

listUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

