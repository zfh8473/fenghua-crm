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
  resourceType: string; // 'CUSTOMER', 'PRODUCT', 'INTERACTION', 'SENSITIVE_DATA', etc.
  resourceId: string;
  operationResult: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>; // Additional metadata (e.g., sensitiveFields for sensitive data access)
}

/**
 * Data modification audit log DTO
 */
export interface DataModificationAuditLogDto {
  resourceType: string; // 'CUSTOMER', 'PRODUCT', 'INTERACTION', etc.
  resourceId: string;
  oldValue?: any; // 修改前的完整对象或字段值
  newValue?: any; // 修改后的完整对象或字段值
  changedFields: string[]; // 修改的字段列表
  reason?: string; // 修改原因
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  actionType?: 'DATA_MODIFICATION' | 'DATA_DELETION'; // 操作类型，默认为 DATA_MODIFICATION
}