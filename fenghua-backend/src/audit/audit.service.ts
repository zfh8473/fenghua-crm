/**
 * Audit Service
 * 
 * Handles audit logging for compliance and security
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';
import { AuditLogDto, RoleChangeAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);
  private pgPool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeDatabaseConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, audit logging will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for AuditService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Cleanup database connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for AuditService');
    }
  }

  /**
   * Log a role change event
   */
  async logRoleChange(roleChangeLog: RoleChangeAuditLogDto): Promise<void> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping audit log');
      return;
    }

    try {
      const auditLog: AuditLogDto = {
        action: 'ROLE_CHANGE',
        entityType: 'USER',
        entityId: roleChangeLog.userId,
        oldValue: roleChangeLog.oldRole,
        newValue: roleChangeLog.newRole,
        userId: roleChangeLog.userId,
        operatorId: roleChangeLog.operatorId,
        timestamp: roleChangeLog.timestamp,
        reason: roleChangeLog.reason,
        metadata: {
          actionType: 'ROLE_ASSIGNMENT',
        },
      };

      await this.saveToDatabase(auditLog);
      this.logger.log(`Audit log: Role changed for user ${roleChangeLog.userId} from ${roleChangeLog.oldRole} to ${roleChangeLog.newRole} by ${roleChangeLog.operatorId}`);
    } catch (error) {
      this.logger.error(`Failed to log role change: ${error instanceof Error ? error.message : String(error)}`, error);
      // Don't throw - audit logging failure should not affect main request
    }
  }

  /**
   * Log a generic audit event
   */
  async log(auditLog: AuditLogDto): Promise<void> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping audit log');
      return;
    }

    try {
      await this.saveToDatabase(auditLog);
      this.logger.log(`Audit log: ${auditLog.action} on ${auditLog.entityType} ${auditLog.entityId} by ${auditLog.operatorId}`);
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${error instanceof Error ? error.message : String(error)}`, error);
      // Don't throw - audit logging failure should not affect main request
    }
  }

  /**
   * Save audit log to database
   */
  private async saveToDatabase(auditLog: AuditLogDto): Promise<void> {
    if (!this.pgPool) {
      throw new Error('Database pool not initialized');
    }

    const query = `
      INSERT INTO audit_logs (
        action, entity_type, entity_id, old_value, new_value,
        user_id, operator_id, timestamp, reason, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.pgPool.query(query, [
      auditLog.action,
      auditLog.entityType,
      auditLog.entityId,
      auditLog.oldValue ? JSON.stringify(auditLog.oldValue) : null,
      auditLog.newValue ? JSON.stringify(auditLog.newValue) : null,
      auditLog.userId,
      auditLog.operatorId,
      auditLog.timestamp,
      auditLog.reason || null,
      auditLog.metadata ? JSON.stringify(auditLog.metadata) : null,
    ]);
  }

  /**
   * Get audit logs for a user (for compliance requests)
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLogDto[]> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, returning empty array');
      return [];
    }

    try {
      const query = `
        SELECT 
          action, entity_type, entity_id, old_value, new_value,
          user_id, operator_id, timestamp, reason, metadata
        FROM audit_logs
        WHERE user_id = $1 OR entity_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `;

      const result = await this.pgPool.query(query, [userId, limit]);
      return result.rows.map((row) => this.mapRowToAuditLogDto(row));
    } catch (error) {
      this.logger.error(`Failed to get user audit logs: ${error instanceof Error ? error.message : String(error)}`, error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific action type
   */
  async getAuditLogsByAction(action: string, limit: number = 100): Promise<AuditLogDto[]> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, returning empty array');
      return [];
    }

    try {
      const query = `
        SELECT 
          action, entity_type, entity_id, old_value, new_value,
          user_id, operator_id, timestamp, reason, metadata
        FROM audit_logs
        WHERE action = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `;

      const result = await this.pgPool.query(query, [action, limit]);
      return result.rows.map((row) => this.mapRowToAuditLogDto(row));
    } catch (error) {
      this.logger.error(`Failed to get audit logs by action: ${error instanceof Error ? error.message : String(error)}`, error);
      return [];
    }
  }

  /**
   * Query audit logs with filters and pagination
   */
  async getAuditLogs(filters: {
    action?: string;
    operatorId?: string;
    operatorEmail?: string;
    startDate?: Date;
    endDate?: Date;
  }, pagination: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: AuditLogDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, returning empty result');
      return {
        data: [],
        total: 0,
        page: pagination.page || 1,
        limit: pagination.limit || 50,
        totalPages: 0,
      };
    }

    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 50;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters.action) {
        whereConditions.push(`action = $${paramIndex}`);
        queryParams.push(filters.action);
        paramIndex++;
      }

      if (filters.operatorId) {
        whereConditions.push(`operator_id = $${paramIndex}`);
        queryParams.push(filters.operatorId);
        paramIndex++;
      }

      if (filters.startDate) {
        whereConditions.push(`timestamp >= $${paramIndex}`);
        queryParams.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        whereConditions.push(`timestamp <= $${paramIndex}`);
        queryParams.push(filters.endDate);
        paramIndex++;
      }

      // Note: operatorEmail filtering is handled by the controller
      // which queries UsersService to get operatorId from email

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
      const countResult = await this.pgPool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total, 10);

      // Get paginated results
      const dataQuery = `
        SELECT 
          action, entity_type, entity_id, old_value, new_value,
          user_id, operator_id, timestamp, reason, metadata
        FROM audit_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);
      const dataResult = await this.pgPool.query(dataQuery, queryParams);

      const data = dataResult.rows.map((row) => this.mapRowToAuditLogDto(row));

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error instanceof Error ? error.message : String(error)}`, error);
      return {
        data: [],
        total: 0,
        page: pagination.page || 1,
        limit: pagination.limit || 50,
        totalPages: 0,
      };
    }
  }

  /**
   * Map database row to AuditLogDto
   */
  private mapRowToAuditLogDto(row: any): AuditLogDto {
    return {
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValue: row.old_value ? (typeof row.old_value === 'string' ? JSON.parse(row.old_value) : row.old_value) : undefined,
      newValue: row.new_value ? (typeof row.new_value === 'string' ? JSON.parse(row.new_value) : row.new_value) : undefined,
      userId: row.user_id,
      operatorId: row.operator_id,
      timestamp: new Date(row.timestamp),
      reason: row.reason || undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
    };
  }

  /**
   * Clean up old audit logs based on retention policy
   * Retention policy: 1 year (configurable via Story 1.5 settings)
   * 
   * Note: This requires database administrator privileges to DELETE from audit_logs table
   * The REVOKE statement in migration script prevents regular users from deleting logs
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, cannot cleanup old logs');
      return 0;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Delete old logs (requires admin privileges)
      const deleteQuery = `
        DELETE FROM audit_logs
        WHERE timestamp < $1
      `;

      const result = await this.pgPool.query(deleteQuery, [cutoffDate]);
      const removedCount = result.rowCount || 0;

      this.logger.log(`Cleaned up ${removedCount} audit logs older than ${retentionDays} days`);
      return removedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup old audit logs: ${error instanceof Error ? error.message : String(error)}`, error);
      // If deletion fails due to permissions, log warning but don't throw
      if (error instanceof Error && error.message.includes('permission denied')) {
        this.logger.warn('Cleanup requires database administrator privileges. Logs will be retained.');
      }
      return 0;
    }
  }
}

