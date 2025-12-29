/**
 * Set User as Admin - Direct Database Update
 * 
 * This script directly updates the user role in Twenty CRM database
 * 
 * Prerequisites:
 * - Access to Twenty CRM PostgreSQL database
 * - Database connection string in environment variable
 * 
 * Usage:
 *   export TWENTY_DATABASE_URL=postgresql://user:password@localhost:5432/twenty
 *   npx ts-node scripts/set-user-admin-db.ts zfh8473@gmail.com
 */

import { Pool } from 'pg';

const TWENTY_DATABASE_URL = process.env.TWENTY_DATABASE_URL || 
  process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/twenty';

const userEmail = process.argv[2] || 'zfh8473@gmail.com';

if (!userEmail) {
  console.error('❌ Please provide user email as argument');
  console.error('Usage: npx ts-node scripts/set-user-admin-db.ts <email>');
  process.exit(1);
}

/**
 * Main function
 */
/**
 * Try to connect to database with different connection strings
 */
async function tryConnect(pool: Pool): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('=== Set User as Admin (Direct Database Update) ===');
  console.log(`User Email: ${userEmail}`);
  
  // 尝试多种数据库连接方式
  const possibleUrls = [
    TWENTY_DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5432/twenty',
    'postgresql://twenty:twenty@localhost:5432/twenty',
    'postgresql://postgres:postgres@localhost:5432/postgres',
  ];
  
  let pool: Pool | null = null;
  let connected = false;
  
  for (const url of possibleUrls) {
    console.log(`\nTrying to connect: ${url.replace(/:[^:@]+@/, ':****@')}`);
    pool = new Pool({ connectionString: url });
    
    try {
      await pool.query('SELECT 1');
      console.log(`✅ Connected successfully!`);
      connected = true;
      break;
    } catch (error: any) {
      console.log(`❌ Connection failed: ${error.message}`);
      await pool.end();
      pool = null;
    }
  }
  
  if (!connected || !pool) {
    console.error('\n❌ Could not connect to database');
    console.error('\nPlease provide database connection string:');
    console.error('  export TWENTY_DATABASE_URL=postgresql://user:password@host:port/database');
    console.error('\nOr if using Docker:');
    console.error('  docker exec -it twenty-db-1 psql -U postgres -d twenty');
    process.exit(1);
  }

  try {
    // Step 1: Find user and workspace member
    console.log('\n=== Step 1: Finding user... ===');
    const userQuery = `
      SELECT 
        u.id as user_id,
        u.email,
        wm.id as workspace_member_id,
        wm."userId" as workspace_user_id
      FROM 
        "user" u
      LEFT JOIN 
        "workspaceMember" wm ON wm."userId" = u.id
      WHERE 
        LOWER(u.email) = LOWER($1)
      LIMIT 1;
    `;
    
    const userResult = await pool.query(userQuery, [userEmail]);
    
    if (userResult.rows.length === 0) {
      console.error(`❌ User ${userEmail} not found`);
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.user_id})`);
    
    if (!user.workspace_member_id) {
      console.error(`❌ Workspace member not found for user ${userEmail}`);
      console.error('   User may not be added to workspace yet');
      process.exit(1);
    }
    
    console.log(`✅ Found workspace member: ${user.workspace_member_id}`);
    
    // Step 2: Find ADMIN role
    console.log('\n=== Step 2: Finding ADMIN role... ===');
    const roleQuery = `
      SELECT 
        id as role_id,
        name as role_name,
        description
      FROM 
        "workspaceRole"
      WHERE 
        UPPER(name) LIKE '%ADMIN%'
      ORDER BY 
        "createdAt" ASC
      LIMIT 1;
    `;
    
    const roleResult = await pool.query(roleQuery);
    
    if (roleResult.rows.length === 0) {
      console.error('❌ ADMIN role not found');
      console.error('   Please check if workspace roles are set up correctly');
      process.exit(1);
    }
    
    const adminRole = roleResult.rows[0];
    console.log(`✅ Found ADMIN role: ${adminRole.role_name} (ID: ${adminRole.role_id})`);
    
    // Step 3: Remove old roles
    console.log('\n=== Step 3: Removing old roles... ===');
    const deleteQuery = `
      DELETE FROM 
        "_workspaceMemberToWorkspaceRole"
      WHERE 
        "A" = $1;
    `;
    
    const deleteResult = await pool.query(deleteQuery, [user.workspace_member_id]);
    console.log(`✅ Removed ${deleteResult.rowCount} old role(s)`);
    
    // Step 4: Add ADMIN role
    console.log('\n=== Step 4: Adding ADMIN role... ===');
    const insertQuery = `
      INSERT INTO 
        "_workspaceMemberToWorkspaceRole" ("A", "B")
      VALUES 
        ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `;
    
    const insertResult = await pool.query(insertQuery, [
      user.workspace_member_id,
      adminRole.role_id
    ]);
    
    if (insertResult.rows.length > 0) {
      console.log(`✅ ADMIN role added successfully`);
    } else {
      console.log(`⚠️  ADMIN role may already exist (conflict ignored)`);
    }
    
    // Step 5: Verify
    console.log('\n=== Step 5: Verifying update... ===');
    const verifyQuery = `
      SELECT 
        u.email,
        u."firstName",
        u."lastName",
        wm.id as workspace_member_id,
        wr.name as role_name,
        wr.id as role_id
      FROM 
        "user" u
      JOIN 
        "workspaceMember" wm ON wm."userId" = u.id
      JOIN 
        "_workspaceMemberToWorkspaceRole" wmwr ON wmwr."A" = wm.id
      JOIN 
        "workspaceRole" wr ON wr.id = wmwr."B"
      WHERE 
        LOWER(u.email) = LOWER($1);
    `;
    
    const verifyResult = await pool.query(verifyQuery, [userEmail]);
    
    if (verifyResult.rows.length > 0) {
      console.log(`✅ Verification successful:`);
      verifyResult.rows.forEach(row => {
        console.log(`   - Email: ${row.email}`);
        console.log(`   - Role: ${row.role_name} (${row.role_id})`);
      });
    } else {
      console.error('❌ Verification failed: Role not found after update');
      process.exit(1);
    }
    
    console.log('\n✅ User successfully set as ADMIN!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P01') {
      console.error('   Table not found. Please check if you are connected to the correct database.');
      console.error('   This script requires access to Twenty CRM database.');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed. Please check your database credentials.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Cannot connect to database. Please check if database is running.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);

