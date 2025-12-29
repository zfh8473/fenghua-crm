/**
 * Audit Service
 * 
 * Handles audit logging for compliance and security
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AuditLogDto, RoleChangeAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private auditLogs: AuditLogDto[] = []; // In-memory storage for MVP, replace with database in production

  /**
   * Log a role change event
   */
  async logRoleChange(roleChangeLog: RoleChangeAuditLogDto): Promise<void> {
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

    this.auditLogs.push(auditLog);
    this.logger.log(`Audit log: Role changed for user ${roleChangeLog.userId} from ${roleChangeLog.oldRole} to ${roleChangeLog.newRole} by ${roleChangeLog.operatorId}`);

    // TODO: In production, save to database with 1-year retention policy (FR65)
    // TODO: Implement log rotation and archival
  }

  /**
   * Log a generic audit event
   */
  async log(auditLog: AuditLogDto): Promise<void> {
    this.auditLogs.push(auditLog);
    this.logger.log(`Audit log: ${auditLog.action} on ${auditLog.entityType} ${auditLog.entityId} by ${auditLog.operatorId}`);

    // TODO: In production, save to database
  }

  /**
   * Get audit logs for a user (for compliance requests)
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLogDto[]> {
    return this.auditLogs
      .filter((log) => log.userId === userId || log.entityId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get audit logs for a specific action type
   */
  async getAuditLogsByAction(action: string, limit: number = 100): Promise<AuditLogDto[]> {
    return this.auditLogs
      .filter((log) => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
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
    let logs = [...this.auditLogs];

    // Filter by action type
    if (filters.action) {
      logs = logs.filter((log) => log.action === filters.action);
    }

    // Filter by operator ID
    if (filters.operatorId) {
      logs = logs.filter((log) => log.operatorId === filters.operatorId);
    }

    // Filter by operator email (if available in metadata)
    // Note: Email is not directly stored in audit logs, this filter searches operatorId
    // For proper email filtering, we would need to query user service to get email from operatorId
    // This is a limitation of the current in-memory storage approach
    if (filters.operatorEmail) {
      const emailLower = filters.operatorEmail.toLowerCase();
      logs = logs.filter((log) => {
        // Try to match email in operatorId (if stored) or metadata
        const operatorIdMatch = log.operatorId?.toLowerCase().includes(emailLower);
        const metadataMatch = log.metadata?.operatorEmail?.toLowerCase().includes(emailLower);
        return operatorIdMatch || metadataMatch;
      });
    }

    // Filter by time range
    if (filters.startDate) {
      logs = logs.filter((log) => log.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter((log) => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    return {
      data: paginatedLogs,
      total: logs.length,
      page,
      limit,
      totalPages: Math.ceil(logs.length / limit),
    };
  }

  /**
   * Clean up old audit logs based on retention policy
   * Retention policy: 1 year (configurable via Story 1.5 settings)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const initialLength = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter((log) => log.timestamp >= cutoffDate);
    const removedCount = initialLength - this.auditLogs.length;

    this.logger.log(`Cleaned up ${removedCount} audit logs older than ${retentionDays} days`);
    return removedCount;
  }
}

