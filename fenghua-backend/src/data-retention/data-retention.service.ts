/**
 * Data Retention Service
 * 
 * Manages data retention policies and identifies expired data
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * Data retention policy configuration
 */
export interface DataRetentionPolicy {
  customerDataRetentionDays: number;
  productDataRetentionDays: number;
  interactionDataRetentionDays: number;
  auditLogRetentionDays: number;
}

/**
 * Default retention policy values
 */
const DEFAULT_RETENTION_POLICY: DataRetentionPolicy = {
  customerDataRetentionDays: 2555, // 7 years
  productDataRetentionDays: -1, // Permanent retention
  interactionDataRetentionDays: 2555, // 7 years
  auditLogRetentionDays: 3650, // 10 years
};

@Injectable()
export class DataRetentionService implements OnModuleDestroy {
  private readonly logger = new Logger(DataRetentionService.name);
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
      this.logger.warn('DATABASE_URL not configured, data retention operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5,
      });
      this.logger.log('PostgreSQL connection pool initialized for DataRetentionService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for DataRetentionService');
    }
  }

  /**
   * Get all retention policies from system_settings table
   * Uses direct database query (not SettingsService) as SettingsService uses in-memory storage
   */
  async getRetentionPolicy(): Promise<DataRetentionPolicy> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, using default retention policy');
      return DEFAULT_RETENTION_POLICY;
    }

    try {
      const result = await this.pgPool.query(
        `SELECT key, value FROM system_settings 
         WHERE key IN ('customerDataRetentionDays', 'productDataRetentionDays', 'interactionDataRetentionDays', 'auditLogRetentionDays')`,
      );

      const policy: DataRetentionPolicy = { ...DEFAULT_RETENTION_POLICY };

      for (const row of result.rows) {
        const value = parseInt(row.value, 10);
        if (!isNaN(value)) {
          switch (row.key) {
            case 'customerDataRetentionDays':
              policy.customerDataRetentionDays = value;
              break;
            case 'productDataRetentionDays':
              policy.productDataRetentionDays = value;
              break;
            case 'interactionDataRetentionDays':
              policy.interactionDataRetentionDays = value;
              break;
            case 'auditLogRetentionDays':
              policy.auditLogRetentionDays = value;
              break;
          }
        }
      }

      return policy;
    } catch (error) {
      this.logger.warn(
        `Failed to read retention policy from system_settings: ${error instanceof Error ? error.message : String(error)}, using default`,
      );
      return DEFAULT_RETENTION_POLICY;
    }
  }

  /**
   * Get retention days for a specific data type
   */
  async getRetentionDays(
    dataType: 'customers' | 'products' | 'interactions' | 'auditLogs',
  ): Promise<number> {
    const policy = await this.getRetentionPolicy();

    switch (dataType) {
      case 'customers':
        return policy.customerDataRetentionDays;
      case 'products':
        return policy.productDataRetentionDays;
      case 'interactions':
        return policy.interactionDataRetentionDays;
      case 'auditLogs':
        return policy.auditLogRetentionDays;
      default:
        return DEFAULT_RETENTION_POLICY.customerDataRetentionDays;
    }
  }

  /**
   * Check if data is expired based on creation date and retention policy
   */
  async isDataExpired(
    dataType: 'customers' | 'products' | 'interactions' | 'auditLogs',
    createdAt: Date,
  ): Promise<boolean> {
    const retentionDays = await this.getRetentionDays(dataType);

    // -1 means permanent retention
    if (retentionDays === -1) {
      return false;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return createdAt < cutoffDate;
  }

  /**
   * Get count of data that will expire in the specified number of days
   */
  async getExpiringDataCount(
    dataType: 'customers' | 'products' | 'interactions' | 'auditLogs',
    daysAhead: number,
  ): Promise<number> {
    if (!this.pgPool) {
      return 0;
    }

    const retentionDays = await this.getRetentionDays(dataType);

    // -1 means permanent retention, so no data will expire
    if (retentionDays === -1) {
      return 0;
    }

    try {
      const futureCutoffDate = new Date();
      futureCutoffDate.setDate(futureCutoffDate.getDate() - retentionDays + daysAhead);

      const currentCutoffDate = new Date();
      currentCutoffDate.setDate(currentCutoffDate.getDate() - retentionDays);

      let tableName: string;
      let dateColumn: string;

      switch (dataType) {
        case 'customers':
          tableName = 'companies';
          dateColumn = 'created_at';
          break;
        case 'products':
          tableName = 'products';
          dateColumn = 'created_at';
          break;
        case 'interactions':
          tableName = 'product_customer_interactions';
          dateColumn = 'created_at';
          break;
        case 'auditLogs':
          tableName = 'audit_logs';
          dateColumn = 'timestamp';
          break;
        default:
          return 0;
      }

      // audit_logs table does not have deleted_at column
      const deletedAtCondition = tableName === 'audit_logs' ? '' : 'AND deleted_at IS NULL';
      const result = await this.pgPool.query(
        `SELECT COUNT(*) as count FROM ${tableName} 
         WHERE ${dateColumn} BETWEEN $1 AND $2 ${deletedAtCondition}`,
        [currentCutoffDate, futureCutoffDate],
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      this.logger.error(`Failed to get expiring data count for ${dataType}`, error);
      return 0;
    }
  }

  /**
   * Find expired customer records
   */
  async findExpiredCustomers(limit: number, offset: number): Promise<Array<{ id: string; created_at: Date }>> {
    if (!this.pgPool) {
      return [];
    }

    const retentionDays = await this.getRetentionDays('customers');

    // -1 means permanent retention
    if (retentionDays === -1) {
      return [];
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.pgPool.query(
        `SELECT id, created_at FROM companies 
         WHERE created_at < $1 AND deleted_at IS NULL 
         ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
        [cutoffDate, limit, offset],
      );

      return result.rows.map((row) => ({
        id: row.id,
        created_at: row.created_at,
      }));
    } catch (error) {
      this.logger.error('Failed to find expired customers', error);
      return [];
    }
  }

  /**
   * Find expired product records
   */
  async findExpiredProducts(limit: number, offset: number): Promise<Array<{ id: string; created_at: Date }>> {
    if (!this.pgPool) {
      return [];
    }

    const retentionDays = await this.getRetentionDays('products');

    // -1 means permanent retention
    if (retentionDays === -1) {
      return [];
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.pgPool.query(
        `SELECT id, created_at FROM products 
         WHERE created_at < $1 AND deleted_at IS NULL 
         ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
        [cutoffDate, limit, offset],
      );

      return result.rows.map((row) => ({
        id: row.id,
        created_at: row.created_at,
      }));
    } catch (error) {
      this.logger.error('Failed to find expired products', error);
      return [];
    }
  }

  /**
   * Find expired interaction records
   */
  async findExpiredInteractions(limit: number, offset: number): Promise<Array<{ id: string; created_at: Date }>> {
    if (!this.pgPool) {
      return [];
    }

    const retentionDays = await this.getRetentionDays('interactions');

    // -1 means permanent retention
    if (retentionDays === -1) {
      return [];
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.pgPool.query(
        `SELECT id, created_at FROM product_customer_interactions 
         WHERE created_at < $1 AND deleted_at IS NULL 
         ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
        [cutoffDate, limit, offset],
      );

      return result.rows.map((row) => ({
        id: row.id,
        created_at: row.created_at,
      }));
    } catch (error) {
      this.logger.error('Failed to find expired interactions', error);
      return [];
    }
  }

  /**
   * Find expired audit log records
   */
  async findExpiredAuditLogs(limit: number, offset: number): Promise<Array<{ id: string; timestamp: Date }>> {
    if (!this.pgPool) {
      return [];
    }

    const retentionDays = await this.getRetentionDays('auditLogs');

    // -1 means permanent retention
    if (retentionDays === -1) {
      return [];
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.pgPool.query(
        `SELECT id, timestamp FROM audit_logs 
         WHERE timestamp < $1 
         ORDER BY timestamp ASC LIMIT $2 OFFSET $3`,
        [cutoffDate, limit, offset],
      );

      return result.rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      this.logger.error('Failed to find expired audit logs', error);
      return [];
    }
  }

  /**
   * Get cleanup history from audit logs
   */
  async getCleanupHistory(): Promise<
    Array<{
      id: string;
      timestamp: Date;
      summary: {
        customers?: { deleted: number; hardDeleted: number };
        products?: { deleted: number; hardDeleted: number };
        interactions?: { deleted: number; hardDeleted: number };
        auditLogs?: { deleted: number };
        totalDuration?: number;
      };
      operatorId?: string;
    }>
  > {
    if (!this.pgPool) {
      return [];
    }

    try {
      const result = await this.pgPool.query(
        `SELECT id, timestamp, metadata, operator_id 
         FROM audit_logs 
         WHERE action = 'DATA_RETENTION_CLEANUP' 
         ORDER BY timestamp DESC 
         LIMIT 10`,
      );

      return result.rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        summary: row.metadata?.summary || {},
        operatorId: row.operator_id,
      }));
    } catch (error) {
      this.logger.error('Failed to get cleanup history from audit logs', error);
      throw error;
    }
  }
}
