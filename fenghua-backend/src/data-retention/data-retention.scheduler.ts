/**
 * Data Retention Scheduler
 * 
 * Scheduled tasks for automatic data retention cleanup
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { DataRetentionService } from './data-retention.service';

/**
 * Cleanup summary for audit logging
 */
interface CleanupSummary {
  customers: { deleted: number; hardDeleted: number };
  products: { deleted: number; hardDeleted: number };
  interactions: { deleted: number; hardDeleted: number };
  auditLogs: { deleted: number };
  totalDuration: number; // in seconds
}

@Injectable()
export class DataRetentionScheduler implements OnModuleInit {
  private readonly logger = new Logger(DataRetentionScheduler.name);
  private readonly BATCH_SIZE = 1000;
  private readonly EXTRA_RETENTION_DAYS = 30; // Additional retention period after soft delete
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly dataRetentionService: DataRetentionService,
  ) {
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
      this.logger.warn('DATABASE_URL not configured, data retention scheduler will not work');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 2,
      });
      this.logger.log('PostgreSQL connection pool initialized for DataRetentionScheduler');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  onModuleInit() {
    this.logger.log('Data Retention Scheduler initialized');
  }

  /**
   * Cleanup expired data
   * Runs daily at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredData(): Promise<void> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping cleanup');
      return;
    }

    const startTime = Date.now();
    const summary: CleanupSummary = {
      customers: { deleted: 0, hardDeleted: 0 },
      products: { deleted: 0, hardDeleted: 0 },
      interactions: { deleted: 0, hardDeleted: 0 },
      auditLogs: { deleted: 0 },
      totalDuration: 0,
    };

    this.logger.log('Starting data retention cleanup...');

    try {
      // Cleanup each data type (with error recovery - continue even if one fails)
      try {
        await this.cleanupExpiredCustomers(summary);
      } catch (error) {
        this.logger.error('Failed to cleanup expired customers', error);
        await this.logCleanupError('customers', error);
      }

      try {
        await this.cleanupExpiredProducts(summary);
      } catch (error) {
        this.logger.error('Failed to cleanup expired products', error);
        await this.logCleanupError('products', error);
      }

      try {
        await this.cleanupExpiredInteractions(summary);
      } catch (error) {
        this.logger.error('Failed to cleanup expired interactions', error);
        await this.logCleanupError('interactions', error);
      }

      try {
        await this.cleanupExpiredAuditLogs(summary);
      } catch (error) {
        this.logger.error('Failed to cleanup expired audit logs', error);
        await this.logCleanupError('auditLogs', error);
      }

      // Hard delete soft-deleted records that exceed extra retention period
      try {
        await this.hardDeleteExpiredSoftDeletedRecords(summary);
      } catch (error) {
        this.logger.error('Failed to hard delete expired soft-deleted records', error);
        await this.logCleanupError('hardDelete', error);
      }

      const totalDuration = Math.floor((Date.now() - startTime) / 1000);
      summary.totalDuration = totalDuration;

      // Log cleanup summary to audit
      await this.auditService.log({
        action: 'DATA_RETENTION_CLEANUP',
        entityType: 'SYSTEM',
        entityId: 'data-retention-cleanup',
        userId: 'system',
        operatorId: 'system',
        timestamp: new Date(),
        metadata: {
          summary: {
            customers: summary.customers,
            products: summary.products,
            interactions: summary.interactions,
            auditLogs: summary.auditLogs,
            totalDuration,
          },
        },
      });

      this.logger.log(
        `Data retention cleanup completed in ${totalDuration}s. Customers: ${summary.customers.deleted} soft, ${summary.customers.hardDeleted} hard. Products: ${summary.products.deleted} soft, ${summary.products.hardDeleted} hard. Interactions: ${summary.interactions.deleted} soft, ${summary.interactions.hardDeleted} hard. Audit logs: ${summary.auditLogs.deleted} deleted.`,
      );
    } catch (error) {
      this.logger.error('Critical error during data retention cleanup', error);
      await this.logCleanupError('cleanup', error);
    }
  }

  /**
   * Cleanup expired customers (soft delete)
   */
  private async cleanupExpiredCustomers(summary: CleanupSummary): Promise<void> {
    let offset = 0;
    let totalDeleted = 0;

    while (true) {
      const expiredCustomers = await this.dataRetentionService.findExpiredCustomers(
        this.BATCH_SIZE,
        offset,
      );

      if (expiredCustomers.length === 0) {
        break;
      }

      // Process batch in transaction to ensure atomicity
      const client = await this.pgPool!.connect();
      try {
        await client.query('BEGIN');
        for (const customer of expiredCustomers) {
          try {
            await client.query('UPDATE companies SET deleted_at = NOW() WHERE id = $1', [
              customer.id,
            ]);
            totalDeleted++;
          } catch (error) {
            this.logger.warn(`Failed to soft delete customer ${customer.id}`, error);
            // Continue with next record, transaction will be rolled back if critical
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        this.logger.error('Failed to soft delete customers batch', error);
        throw error;
      } finally {
        client.release();
      }

      offset += this.BATCH_SIZE;

      if (expiredCustomers.length < this.BATCH_SIZE) {
        break;
      }
    }

    summary.customers.deleted = totalDeleted;
    this.logger.log(`Soft deleted ${totalDeleted} expired customers`);
  }

  /**
   * Cleanup expired products (soft delete)
   */
  private async cleanupExpiredProducts(summary: CleanupSummary): Promise<void> {
    const retentionDays = await this.dataRetentionService.getRetentionDays('products');

    // -1 means permanent retention
    if (retentionDays === -1) {
      return;
    }

    let offset = 0;
    let totalDeleted = 0;

    while (true) {
      const expiredProducts = await this.dataRetentionService.findExpiredProducts(
        this.BATCH_SIZE,
        offset,
      );

      if (expiredProducts.length === 0) {
        break;
      }

      // Process batch in transaction to ensure atomicity
      const client = await this.pgPool!.connect();
      try {
        await client.query('BEGIN');
        for (const product of expiredProducts) {
          try {
            await client.query('UPDATE products SET deleted_at = NOW() WHERE id = $1', [
              product.id,
            ]);
            totalDeleted++;
          } catch (error) {
            this.logger.warn(`Failed to soft delete product ${product.id}`, error);
            // Continue with next record
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        this.logger.error('Failed to soft delete products batch', error);
        throw error;
      } finally {
        client.release();
      }

      offset += this.BATCH_SIZE;

      if (expiredProducts.length < this.BATCH_SIZE) {
        break;
      }
    }

    summary.products.deleted = totalDeleted;
    this.logger.log(`Soft deleted ${totalDeleted} expired products`);
  }

  /**
   * Cleanup expired interactions (soft delete)
   */
  private async cleanupExpiredInteractions(summary: CleanupSummary): Promise<void> {
    let offset = 0;
    let totalDeleted = 0;

    while (true) {
      const expiredInteractions = await this.dataRetentionService.findExpiredInteractions(
        this.BATCH_SIZE,
        offset,
      );

      if (expiredInteractions.length === 0) {
        break;
      }

      // Process batch in transaction to ensure atomicity
      const client = await this.pgPool!.connect();
      try {
        await client.query('BEGIN');
        for (const interaction of expiredInteractions) {
          try {
            await client.query(
              'UPDATE product_customer_interactions SET deleted_at = NOW() WHERE id = $1',
              [interaction.id],
            );
            totalDeleted++;
          } catch (error) {
            this.logger.warn(`Failed to soft delete interaction ${interaction.id}`, error);
            // Continue with next record
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        this.logger.error('Failed to soft delete interactions batch', error);
        throw error;
      } finally {
        client.release();
      }

      offset += this.BATCH_SIZE;

      if (expiredInteractions.length < this.BATCH_SIZE) {
        break;
      }
    }

    summary.interactions.deleted = totalDeleted;
    this.logger.log(`Soft deleted ${totalDeleted} expired interactions`);
  }

  /**
   * Cleanup expired audit logs (hard delete, no soft delete)
   */
  private async cleanupExpiredAuditLogs(summary: CleanupSummary): Promise<void> {
    let offset = 0;
    let totalDeleted = 0;

    while (true) {
      const expiredAuditLogs = await this.dataRetentionService.findExpiredAuditLogs(
        this.BATCH_SIZE,
        offset,
      );

      if (expiredAuditLogs.length === 0) {
        break;
      }

      // Process batch in transaction to ensure atomicity
      const client = await this.pgPool!.connect();
      try {
        await client.query('BEGIN');
        for (const auditLog of expiredAuditLogs) {
          try {
            await client.query('DELETE FROM audit_logs WHERE id = $1', [auditLog.id]);
            totalDeleted++;
          } catch (error) {
            this.logger.warn(`Failed to delete audit log ${auditLog.id}`, error);
            // Continue with next record
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        this.logger.error('Failed to delete audit logs batch', error);
        throw error;
      } finally {
        client.release();
      }

      offset += this.BATCH_SIZE;

      if (expiredAuditLogs.length < this.BATCH_SIZE) {
        break;
      }
    }

    summary.auditLogs.deleted = totalDeleted;
    this.logger.log(`Hard deleted ${totalDeleted} expired audit logs`);
  }

  /**
   * Hard delete soft-deleted records that exceed extra retention period
   */
  private async hardDeleteExpiredSoftDeletedRecords(summary: CleanupSummary): Promise<void> {
    const policy = await this.dataRetentionService.getRetentionPolicy();
    const now = new Date();

    // Hard delete customers
    await this.hardDeleteSoftDeletedRecords(
      'companies',
      policy.customerDataRetentionDays,
      summary.customers,
    );

    // Hard delete products (if not permanent)
    if (policy.productDataRetentionDays !== -1) {
      await this.hardDeleteSoftDeletedRecords(
        'products',
        policy.productDataRetentionDays,
        summary.products,
      );
    }

    // Hard delete interactions
    await this.hardDeleteSoftDeletedRecords(
      'product_customer_interactions',
      policy.interactionDataRetentionDays,
      summary.interactions,
    );
  }

  /**
   * Hard delete soft-deleted records for a specific table
   */
  private async hardDeleteSoftDeletedRecords(
    tableName: string,
    retentionDays: number,
    summaryItem: { deleted: number; hardDeleted: number },
  ): Promise<void> {
    if (!this.pgPool || retentionDays === -1) {
      return;
    }

    const hardDeleteCutoffDate = new Date();
    hardDeleteCutoffDate.setDate(
      hardDeleteCutoffDate.getDate() - retentionDays - this.EXTRA_RETENTION_DAYS,
    );

    let offset = 0;
    let totalHardDeleted = 0;

    while (true) {
      try {
        // Find soft-deleted records that exceed extra retention period
        const result = await this.pgPool.query(
          `SELECT id FROM ${tableName} 
           WHERE deleted_at < $1 AND deleted_at IS NOT NULL 
           ORDER BY deleted_at ASC LIMIT $2 OFFSET $3`,
          [hardDeleteCutoffDate, this.BATCH_SIZE, offset],
        );

        if (result.rows.length === 0) {
          break;
        }

        for (const row of result.rows) {
          try {
            // Check for foreign key constraints before hard delete
            if (tableName === 'companies') {
              // Check associations
              const associationCheck = await this.pgPool.query(
                'SELECT COUNT(*) as count FROM product_customer_associations WHERE customer_id = $1',
                [row.id],
              );
              if (parseInt(associationCheck.rows[0].count, 10) > 0) {
                this.logger.warn(
                  `Skipping hard delete of company ${row.id} - still has associations`,
                );
                continue;
              }
            } else if (tableName === 'products') {
              // Check associations and interactions
              const associationCheck = await this.pgPool.query(
                'SELECT COUNT(*) as count FROM product_customer_associations WHERE product_id = $1',
                [row.id],
              );
              const interactionCheck = await this.pgPool.query(
                'SELECT COUNT(*) as count FROM product_customer_interactions WHERE product_id = $1 AND deleted_at IS NULL',
                [row.id],
              );
              if (
                parseInt(associationCheck.rows[0].count, 10) > 0 ||
                parseInt(interactionCheck.rows[0].count, 10) > 0
              ) {
                this.logger.warn(
                  `Skipping hard delete of product ${row.id} - still has associations or interactions`,
                );
                continue;
              }
            } else if (tableName === 'product_customer_interactions') {
              // Check file attachments
              const attachmentCheck = await this.pgPool.query(
                'SELECT COUNT(*) as count FROM file_attachments WHERE interaction_id = $1 AND deleted_at IS NULL',
                [row.id],
              );
              if (parseInt(attachmentCheck.rows[0].count, 10) > 0) {
                this.logger.warn(
                  `Skipping hard delete of interaction ${row.id} - still has file attachments`,
                );
                continue;
              }
            }

            await this.pgPool.query(`DELETE FROM ${tableName} WHERE id = $1`, [row.id]);
            totalHardDeleted++;
          } catch (error) {
            this.logger.warn(`Failed to hard delete ${tableName} record ${row.id}`, error);
            // Continue with next record
          }
        }

        offset += this.BATCH_SIZE;

        if (result.rows.length < this.BATCH_SIZE) {
          break;
        }
      } catch (error) {
        this.logger.error(`Failed to query soft-deleted records from ${tableName}`, error);
        break;
      }
    }

    summaryItem.hardDeleted = totalHardDeleted;
    if (totalHardDeleted > 0) {
      this.logger.log(`Hard deleted ${totalHardDeleted} expired soft-deleted records from ${tableName}`);
    }
  }

  /**
   * Log cleanup error to audit
   */
  private async logCleanupError(dataType: string, error: unknown): Promise<void> {
    try {
      await this.auditService.log({
        action: 'DATA_RETENTION_CLEANUP_ERROR',
        entityType: 'SYSTEM',
        entityId: 'data-retention-cleanup',
        userId: 'system',
        operatorId: 'system',
        timestamp: new Date(),
        metadata: {
          dataType,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } catch (auditError) {
      this.logger.error('Failed to log cleanup error to audit', auditError);
    }
  }
}
