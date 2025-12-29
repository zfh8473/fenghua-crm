/**
 * DTO for audit log entries
 * All custom code is proprietary and not open source.
 */

export interface AuditLogDto {
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  operatorId: string;
  timestamp: Date;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Role change audit log DTO
 */
export interface RoleChangeAuditLogDto {
  oldRole: string;
  newRole: string;
  userId: string;
  operatorId: string;
  timestamp: Date;
  reason?: string;
}

