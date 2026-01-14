/**
 * DTOs for data retention policy
 * All custom code is proprietary and not open source.
 */

import { DataRetentionPolicy } from '../data-retention.service';

/**
 * DTO for data retention policy response
 */
export class DataRetentionPolicyDto implements DataRetentionPolicy {
  customerDataRetentionDays: number;
  productDataRetentionDays: number;
  interactionDataRetentionDays: number;
  auditLogRetentionDays: number;
}

/**
 * DTO for expiring data statistics
 */
export class DataRetentionStatisticsDto {
  customers: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
  products: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
  interactions: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
  auditLogs: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
}

/**
 * DTO for cleanup history entry (from audit logs)
 */
export class DataRetentionCleanupHistoryDto {
  id: string;
  timestamp: Date;
  summary: {
    customers?: { deleted: number; hardDeleted: number };
    products?: { deleted: number; hardDeleted: number };
    interactions?: { deleted: number; hardDeleted: number };
    auditLogs?: { deleted: number };
    totalDuration?: number; // in seconds
  };
  operatorId?: string;
}
