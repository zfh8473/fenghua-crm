/**
 * Script to seed audit logs test data
 * 
 * Creates 1000+ audit log records for testing Story 9-1 and 9-2
 * All custom code is proprietary and not open source.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Generate random audit log data
 */
function generateAuditLog(
  userId: string,
  operatorId: string,
  action: string,
  entityType: string,
  entityId: string,
  timestamp: Date,
): any {
  const actions = ['DATA_ACCESS', 'DATA_MODIFICATION', 'DATA_DELETION', 'ROLE_CHANGE'];
  const entityTypes = ['CUSTOMER', 'PRODUCT', 'INTERACTION', 'USER'];
  const operationResults = ['SUCCESS', 'FAILURE'];
  const ipAddresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '203.0.113.1'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  ];

  const isDataModification = action === 'DATA_MODIFICATION';
  const isDataDeletion = action === 'DATA_DELETION';

  return {
    id: randomUUID(),
    action: action || actions[Math.floor(Math.random() * actions.length)],
    entity_type: entityType || entityTypes[Math.floor(Math.random() * entityTypes.length)],
    entity_id: entityId || randomUUID(),
    old_value: isDataModification || isDataDeletion ? { name: 'Old Value', status: 'active' } : null,
    new_value: isDataModification ? { name: 'New Value', status: 'updated' } : null,
    user_id: userId,
    operator_id: operatorId,
    timestamp: timestamp.toISOString(),
    reason: Math.random() > 0.8 ? 'Test reason' : null,
    metadata: {
      operationResult: operationResults[Math.floor(Math.random() * operationResults.length)],
      ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    },
    ip_address: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
    user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
  };
}

async function seedAuditLogs() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.PG_DATABASE_URL ||
    'postgresql://user:password@localhost:5432/fenghua_crm';

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log('📊 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Get existing user IDs (we need at least one user)
    const usersResult = await pool.query('SELECT id FROM users LIMIT 10');
    if (usersResult.rows.length === 0) {
      console.error('❌ No users found in database. Please create at least one user first.');
      process.exit(1);
    }

    const userIds = usersResult.rows.map((row) => row.id);
    console.log(`📋 Found ${userIds.length} users for audit log generation`);

    // Generate audit logs
    const batchSize = 100;
    const totalLogs = 1000;
    const logs: any[] = [];

    console.log(`\n📝 Generating ${totalLogs} audit log records...`);

    // Generate logs with different timestamps (spread over last 90 days)
    const now = new Date();
    for (let i = 0; i < totalLogs; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const operatorId = userIds[Math.floor(Math.random() * userIds.length)];

      // Mix of different actions
      let action: string;
      if (i % 3 === 0) {
        action = 'DATA_ACCESS';
      } else if (i % 3 === 1) {
        action = 'DATA_MODIFICATION';
      } else {
        action = 'DATA_DELETION';
      }

      const log = generateAuditLog(userId, operatorId, action, '', '', timestamp);
      logs.push(log);
    }

    // Insert in batches
    console.log(`\n💾 Inserting audit logs in batches of ${batchSize}...`);
    let inserted = 0;

    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      const values = batch
        .map(
          (log, idx) =>
            `($${idx * 12 + 1}, $${idx * 12 + 2}, $${idx * 12 + 3}, $${idx * 12 + 4}, $${idx * 12 + 5}, $${idx * 12 + 6}, $${idx * 12 + 7}, $${idx * 12 + 8}, $${idx * 12 + 9}, $${idx * 12 + 10}, $${idx * 12 + 11}, $${idx * 12 + 12})`,
        )
        .join(', ');

      const params: any[] = [];
      batch.forEach((log) => {
        params.push(
          log.id,
          log.action,
          log.entity_type,
          log.entity_id,
          log.old_value ? JSON.stringify(log.old_value) : null,
          log.new_value ? JSON.stringify(log.new_value) : null,
          log.user_id,
          log.operator_id,
          log.timestamp,
          log.reason,
          log.metadata ? JSON.stringify(log.metadata) : null,
          log.ip_address,
          log.user_agent,
        );
      });

      await pool.query(
        `INSERT INTO audit_logs (
          id, action, entity_type, entity_id, old_value, new_value,
          user_id, operator_id, timestamp, reason, metadata, ip_address, user_agent
        ) VALUES ${values}`,
        params,
      );

      inserted += batch.length;
      process.stdout.write(`\r   Progress: ${inserted}/${totalLogs} (${Math.round((inserted / totalLogs) * 100)}%)`);
    }

    console.log('\n\n✅ Audit logs inserted successfully!');

    // Verify insertion
    const result = await pool.query(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
    `);

    console.log('\n📊 Summary by action:');
    result.rows.forEach((row) => {
      console.log(`   ${row.action}: ${row.count} logs`);
    });

    // Show total count
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM audit_logs');
    console.log(`\n   Total: ${totalResult.rows[0].total} audit logs`);
  } catch (error) {
    console.error('❌ Error seeding audit logs:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
seedAuditLogs().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
