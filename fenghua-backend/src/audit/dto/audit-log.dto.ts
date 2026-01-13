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
  ipAddress?: string;
  userAgent?: string;
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

/**
 * Data access audit log DTO
 */
export interface DataAccessAuditLogDto {
  resourceType: string; // 'CUSTOMER', 'PRODUCT', 'INTERACTION', etc.
  resourceId: string;
  operationResult: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}