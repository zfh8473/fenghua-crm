/**
 * GDPR Deletion Processor
 * 
 * Processes GDPR deletion jobs using BullMQ
 * All custom code is proprietary and not open source.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { GdprDeletionService, GdprDeletionJobData, GdprDeletionJobResult } from './gdpr-deletion.service';
import { GdprDeletionRequestStatus, DeletionSummary } from './dto/gdpr-deletion-request.dto';
import { PermissionService } from '../permission/permission.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

@Processor('gdpr-deletion-queue')
@Injectable()
export class GdprDeletionProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(GdprDeletionProcessor.name);
  private readonly BATCH_SIZE = 1000; // Process 1000 records per batch
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly gdprDeletionService: GdprDeletionService,
    private readonly permissionService: PermissionService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
  ) {
    super();
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
      this.logger.warn('DATABASE_URL not configured, GDPR deletion processing will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5,
      });
      this.logger.log('PostgreSQL connection pool initialized for GdprDeletionProcessor');
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
      this.logger.log('PostgreSQL connection pool closed for GdprDeletionProcessor');
    }
  }

  /**
   * Process GDPR deletion job
   * 
   * Main entry point for processing GDPR deletion requests via Bull Queue.
   * Handles the complete deletion workflow:
   * 1. Validates user and gets role-based filters
   * 2. Retrieves data retention policy
   * 3. Performs deletion of all user-related data
   * 4. Updates request status and logs to audit
   * 
   * @param job - BullMQ job containing requestId, userId, and token
   * @returns Deletion job result with success status and deletion summary
   * @throws Error if deletion fails completely (partial failures are handled gracefully)
   */
  async process(job: Job<GdprDeletionJobData, GdprDeletionJobResult>): Promise<GdprDeletionJobResult> {
    const { requestId, userId, token } = job.data;

    this.logger.log(`Processing GDPR deletion job ${job.id} for request ${requestId}, user ${userId}`);

    try {
      // Update status to PROCESSING
      await this.gdprDeletionService.updateRequestStatus(requestId, GdprDeletionRequestStatus.PROCESSING);

      // Update progress: 0% - Starting
      await job.updateProgress({
        processed: 0,
        total: 0,
        estimatedTimeRemaining: null,
      });

      // Get user role and data access filter
      const dataAccessFilter = await this.permissionService.getDataAccessFilter(token);
      const user = await this.authService.validateToken(token);
      const userRole = user?.role;

      // Get data retention days
      const retentionDays = await this.gdprDeletionService.getRetentionDays();
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - retentionDays);

      // Perform deletion
      const deletionResult = await this.deleteUserData(userId, userRole, dataAccessFilter, retentionDate, job);

      // Determine final status based on deletion summary
      const summary = deletionResult.summary;
      const hasFailures = summary.failedCount > 0;
      const hasSuccesses = summary.deletedCount + summary.anonymizedCount > 0;
      const isPartialFailure = hasFailures && hasSuccesses;

      // Update request with deletion summary
      const finalStatus = isPartialFailure 
        ? GdprDeletionRequestStatus.PARTIALLY_COMPLETED 
        : GdprDeletionRequestStatus.COMPLETED;

      await this.gdprDeletionService.updateRequestStatus(requestId, finalStatus, {
        deletionSummary: summary,
        error: isPartialFailure ? `部分删除失败：${summary.failedCount} 条记录处理失败` : undefined,
      });

      // Log to audit
      await this.auditService.log({
        action: isPartialFailure ? 'GDPR_DELETION_PARTIALLY_COMPLETED' : 'GDPR_DELETION_COMPLETED',
        entityType: 'GDPR_DELETION',
        entityId: requestId,
        userId,
        operatorId: userId,
        timestamp: new Date(),
        metadata: {
          deletionSummary: summary,
          ...(isPartialFailure && { error: `部分删除失败：${summary.failedCount} 条记录处理失败` }),
        },
      });

      // Update progress: 100% - Completed
      await job.updateProgress({
        processed: summary.totalRecords,
        total: summary.totalRecords,
        estimatedTimeRemaining: 0,
      });

      this.logger.log(`GDPR deletion job ${job.id} completed: ${summary.deletedCount} deleted, ${summary.anonymizedCount} anonymized${isPartialFailure ? `, ${summary.failedCount} failed` : ''}`);

      return {
        success: !isPartialFailure,
        deletionSummary: summary,
        ...(isPartialFailure && { error: `部分删除失败：${summary.failedCount} 条记录处理失败` }),
      };
    } catch (error) {
      this.logger.error(`GDPR deletion job ${job.id} failed`, error);

      // Update status to FAILED
      await this.gdprDeletionService.updateRequestStatus(requestId, GdprDeletionRequestStatus.FAILED, {
        error: error instanceof Error ? error.message : '删除失败',
      });

      // Log to audit
      await this.auditService.log({
        action: 'GDPR_DELETION_FAILED',
        entityType: 'GDPR_DELETION',
        entityId: requestId,
        userId,
        operatorId: userId,
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Delete all user-related data
   * 
   * Orchestrates deletion of all user-related data types:
   * 1. Customer records (with role-based filtering)
   * 2. Interaction records (with role-based filtering)
   * 3. Product associations and user-created products
   * 4. Audit logs (delete or anonymize based on retention)
   * 
   * @param userId - User ID whose data should be deleted
   * @param userRole - User role (for logging purposes)
   * @param dataAccessFilter - Role-based filter for customer types
   * @param retentionDate - Date threshold for hard vs soft delete
   * @param job - BullMQ job for progress tracking
   * @returns Deletion summary with statistics for each data type
   * @throws Error if database pool not initialized or critical deletion fails
   */
  private async deleteUserData(
    userId: string,
    userRole: string | undefined,
    dataAccessFilter: { customerType?: string } | null,
    retentionDate: Date,
    job: Job<GdprDeletionJobData, GdprDeletionJobResult>,
  ): Promise<{ summary: DeletionSummary }> {
    const summary: DeletionSummary = {
      totalRecords: 0,
      deletedCount: 0,
      anonymizedCount: 0,
      failedCount: 0,
      statistics: {},
      errors: [],
    };

    if (!this.pgPool) {
      throw new Error('Database pool not initialized');
    }

    try {
      // 1. Delete customer records
      const customerResult = await this.deleteCustomerData(userId, dataAccessFilter, retentionDate, job);
      summary.statistics.customers = customerResult;
      summary.deletedCount += customerResult.deleted;
      summary.anonymizedCount += customerResult.anonymized;
      summary.failedCount += customerResult.failed;
      summary.totalRecords += customerResult.total;

      // 2. Delete interaction records
      const interactionResult = await this.deleteInteractionData(userId, dataAccessFilter, retentionDate, job);
      summary.statistics.interactions = interactionResult;
      summary.deletedCount += interactionResult.deleted;
      summary.anonymizedCount += interactionResult.anonymized;
      summary.failedCount += interactionResult.failed;
      summary.totalRecords += interactionResult.total;

      // 3. Handle product records
      // 3a. Delete product associations (delete associations, not products themselves)
      const associationResult = await this.deleteProductAssociations(userId, dataAccessFilter, job);
      // 3b. Delete user-created products (if no other associations)
      const productResult = await this.deleteUserCreatedProducts(userId, dataAccessFilter, retentionDate, job);
      
      // Combine product results
      const combinedProductResult = {
        total: associationResult.total + productResult.total,
        deleted: associationResult.deleted + productResult.deleted,
        anonymized: associationResult.anonymized + productResult.anonymized,
        failed: associationResult.failed + productResult.failed,
      };
      
      summary.statistics.products = combinedProductResult;
      summary.deletedCount += combinedProductResult.deleted;
      summary.anonymizedCount += combinedProductResult.anonymized;
      summary.failedCount += combinedProductResult.failed;
      summary.totalRecords += combinedProductResult.total;

      // 4. Handle audit logs
      const auditLogResult = await this.deleteAuditLogs(userId, retentionDate, job);
      summary.statistics.auditLogs = auditLogResult;
      summary.deletedCount += auditLogResult.deleted;
      summary.anonymizedCount += auditLogResult.anonymized;
      summary.failedCount += auditLogResult.failed;
      summary.totalRecords += auditLogResult.total;

      // Collect errors from individual deletion methods
      const allErrors: Array<{ type: string; count: number; message: string }> = [];
      
      if (summary.statistics.customers?.failed && summary.statistics.customers.failed > 0) {
        allErrors.push({
          type: 'CUSTOMER_DELETION',
          count: summary.statistics.customers.failed,
          message: `Failed to delete ${summary.statistics.customers.failed} customer records`,
        });
      }
      
      if (summary.statistics.interactions?.failed && summary.statistics.interactions.failed > 0) {
        allErrors.push({
          type: 'INTERACTION_DELETION',
          count: summary.statistics.interactions.failed,
          message: `Failed to delete ${summary.statistics.interactions.failed} interaction records`,
        });
      }
      
      if (summary.statistics.products?.failed && summary.statistics.products.failed > 0) {
        allErrors.push({
          type: 'PRODUCT_DELETION',
          count: summary.statistics.products.failed,
          message: `Failed to delete ${summary.statistics.products.failed} product records or associations`,
        });
      }
      
      if (summary.statistics.auditLogs?.failed && summary.statistics.auditLogs.failed > 0) {
        allErrors.push({
          type: 'AUDIT_LOG_DELETION',
          count: summary.statistics.auditLogs.failed,
          message: `Failed to process ${summary.statistics.auditLogs.failed} audit log records`,
        });
      }
      
      if (allErrors.length > 0) {
        summary.errors = allErrors;
      }

      return { summary };
    } catch (error) {
      this.logger.error(`Failed to delete user data: ${error instanceof Error ? error.message : String(error)}`, error);
      if (!summary.errors) {
        summary.errors = [];
      }
      summary.errors.push({
        type: 'GENERAL',
        count: 0,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete customer data created by user (with role-based filtering)
   * 
   * Deletes or anonymizes customer records based on:
   * - Data retention policy (hard delete if beyond retention period and no associations)
   * - Association count (soft delete if has associations, anonymize if no associations but within retention)
   * 
   * @param userId - User ID whose customer data should be deleted
   * @param dataAccessFilter - Role-based filter for customer types (BUYER for frontend, SUPPLIER for backend, null for admin/director)
   * @param retentionDate - Date threshold for hard vs soft delete (calculated from dataRetentionDays)
   * @param job - BullMQ job for progress tracking
   * @returns Deletion result with counts (total, deleted, anonymized, failed)
   */
  private async deleteCustomerData(
    userId: string,
    dataAccessFilter: { customerType?: string } | null,
    retentionDate: Date,
    job: Job<GdprDeletionJobData, GdprDeletionJobResult>,
  ): Promise<{ total: number; deleted: number; anonymized: number; failed: number }> {
    const result = { total: 0, deleted: 0, anonymized: 0, failed: 0 };
    let offset = 0;
    const limit = this.BATCH_SIZE;

    if (!this.pgPool) {
      return result;
    }

    try {
      // First, count total records for accurate progress tracking
      let countWhereClause = `WHERE created_by = $1 AND deleted_at IS NULL`;
      const countParams: any[] = [userId];
      let countParamIndex = 2;

      if (dataAccessFilter?.customerType) {
        countWhereClause += ` AND customer_type = $${countParamIndex++}`;
        countParams.push(dataAccessFilter.customerType.toUpperCase());
      }

      const totalCountResult = await this.pgPool.query(
        `SELECT COUNT(*) as total FROM companies ${countWhereClause}`,
        countParams,
      );
      const totalRecords = parseInt(totalCountResult.rows[0].total, 10);

      if (totalRecords === 0) {
        return result;
      }

      while (true) {
        // Build query with role-based filter
        let whereClause = `WHERE created_by = $1 AND deleted_at IS NULL`;
        const params: any[] = [userId];
        let paramIndex = 2;

        if (dataAccessFilter?.customerType) {
          whereClause += ` AND customer_type = $${paramIndex++}`;
          params.push(dataAccessFilter.customerType.toUpperCase());
        }

        // Get batch of customers
        const limitParamIndex = paramIndex;
        const offsetParamIndex = paramIndex + 1;
        const selectResult = await this.pgPool.query(
          `SELECT id, created_at FROM companies ${whereClause} ORDER BY created_at DESC LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
          [...params, limit, offset],
        );

        if (selectResult.rows.length === 0) {
          break;
        }

        result.total += selectResult.rows.length;

        // Process each customer in transaction
        for (const customer of selectResult.rows) {
          try {
            await this.pgPool.query('BEGIN');

            // Check associations
            const associationCheck = await this.pgPool.query(
              'SELECT COUNT(*) as count FROM product_customer_associations WHERE customer_id = $1',
              [customer.id],
            );
            const interactionCheck = await this.pgPool.query(
              'SELECT COUNT(*) as count FROM product_customer_interactions WHERE customer_id = $1 AND deleted_at IS NULL',
              [customer.id],
            );
            const associationCount = parseInt(associationCheck.rows[0].count, 10) + parseInt(interactionCheck.rows[0].count, 10);

            const customerCreatedAt = new Date(customer.created_at);
            const shouldHardDelete = customerCreatedAt < retentionDate && associationCount === 0;

            if (shouldHardDelete) {
              // Hard delete
              await this.pgPool.query('DELETE FROM companies WHERE id = $1', [customer.id]);
              result.deleted++;
            } else if (associationCount > 0) {
              // Soft delete (has associations)
              await this.pgPool.query(
                'UPDATE companies SET deleted_at = NOW() WHERE id = $1',
                [customer.id],
              );
              result.deleted++;
            } else {
              // Anonymize (within retention period, no associations)
              await this.pgPool.query(
                `UPDATE companies 
                 SET name = '已匿名', email = NULL, phone = NULL, address = NULL, domainName = NULL
                 WHERE id = $1`,
                [customer.id],
              );
              result.anonymized++;
            }

            await this.pgPool.query('COMMIT');
          } catch (error) {
            await this.pgPool.query('ROLLBACK');
            result.failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to delete customer ${customer.id}: ${errorMessage}`);
          }
        }

        // Update progress with accurate total
        await job.updateProgress({
          processed: result.total,
          total: totalRecords,
          estimatedTimeRemaining: null,
        });

        if (selectResult.rows.length < limit) {
          break;
        }

        offset += limit;
      }
    } catch (error) {
      this.logger.error(`Failed to delete customer data: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }

    return result;
  }

  /**
   * Delete interaction data created by user (with role-based filtering)
   * 
   * Deletes interaction records based on:
   * - Data retention policy (hard delete if beyond retention period, soft delete if within retention)
   * - Role-based filtering (only interactions for customers matching user's role)
   * 
   * @param userId - User ID whose interaction data should be deleted
   * @param dataAccessFilter - Role-based filter for customer types
   * @param retentionDate - Date threshold for hard vs soft delete
   * @param job - BullMQ job for progress tracking
   * @returns Deletion result with counts (total, deleted, anonymized, failed)
   */
  private async deleteInteractionData(
    userId: string,
    dataAccessFilter: { customerType?: string } | null,
    retentionDate: Date,
    job: Job<GdprDeletionJobData, GdprDeletionJobResult>,
  ): Promise<{ total: number; deleted: number; anonymized: number; failed: number }> {
    const result = { total: 0, deleted: 0, anonymized: 0, failed: 0 };
    let offset = 0;
    const limit = this.BATCH_SIZE;

    if (!this.pgPool) {
      return result;
    }

    try {
      // First, count total records for accurate progress tracking
      let countWhereClause = `WHERE pci.created_by = $1 AND pci.deleted_at IS NULL`;
      const countParams: any[] = [userId];
      let countParamIndex = 2;

      if (dataAccessFilter?.customerType) {
        countWhereClause += ` AND c.customer_type = $${countParamIndex++}`;
        countParams.push(dataAccessFilter.customerType.toUpperCase());
      }

      const totalCountResult = await this.pgPool.query(
        `SELECT COUNT(*) as total
         FROM product_customer_interactions pci
         LEFT JOIN companies c ON pci.customer_id = c.id
         ${countWhereClause}`,
        countParams,
      );
      const totalRecords = parseInt(totalCountResult.rows[0].total, 10);

      if (totalRecords === 0) {
        return result;
      }

      while (true) {
        // Build query with role-based filter
        let whereClause = `WHERE pci.created_by = $1 AND pci.deleted_at IS NULL`;
        const params: any[] = [userId];
        let paramIndex = 2;

        if (dataAccessFilter?.customerType) {
          whereClause += ` AND c.customer_type = $${paramIndex++}`;
          params.push(dataAccessFilter.customerType.toUpperCase());
        }

        // Get batch of interactions
        const limitParamIndex = paramIndex;
        const offsetParamIndex = paramIndex + 1;
        const selectResult = await this.pgPool.query(
          `SELECT pci.id, pci.created_at
           FROM product_customer_interactions pci
           LEFT JOIN companies c ON pci.customer_id = c.id
           ${whereClause}
           ORDER BY pci.created_at DESC
           LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
          [...params, limit, offset],
        );

        if (selectResult.rows.length === 0) {
          break;
        }

        result.total += selectResult.rows.length;

        // Process each interaction
        for (const interaction of selectResult.rows) {
          try {
            const interactionCreatedAt = new Date(interaction.created_at);
            const shouldHardDelete = interactionCreatedAt < retentionDate;

            if (shouldHardDelete) {
              // Hard delete (beyond retention period)
              await this.pgPool.query(
                'DELETE FROM product_customer_interactions WHERE id = $1',
                [interaction.id],
              );
              result.deleted++;
            } else {
              // Soft delete (within retention period)
              await this.pgPool.query(
                'UPDATE product_customer_interactions SET deleted_at = NOW() WHERE id = $1',
                [interaction.id],
              );
              result.deleted++;
            }
          } catch (error) {
            result.failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to delete interaction ${interaction.id}: ${errorMessage}`);
          }
        }

        // Update progress with accurate total
        await job.updateProgress({
          processed: result.total,
          total: totalRecords,
          estimatedTimeRemaining: null,
        });

        if (selectResult.rows.length < limit) {
          break;
        }

        offset += limit;
      }
    } catch (error) {
      this.logger.error(`Failed to delete interaction data: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }

    return result;
  }

  /**
   * Delete product associations (not products themselves)
   * 
   * Deletes associations between user's customers and products, but keeps the products.
   * This handles:
   * - Products associated with user's customers (via product_customer_associations)
   * - Products referenced in user's interactions (handled by deleting interactions)
   * 
   * @param userId - User ID whose product associations should be deleted
   * @param dataAccessFilter - Role-based filter for customer types
   * @param job - BullMQ job for progress tracking
   * @returns Deletion result with counts
   */
  private async deleteProductAssociations(
    userId: string,
    dataAccessFilter: { customerType?: string } | null,
    job: Job<GdprDeletionJobData, GdprDeletionJobResult>,
  ): Promise<{ total: number; deleted: number; anonymized: number; failed: number }> {
    const result = { total: 0, deleted: 0, anonymized: 0, failed: 0 };

    if (!this.pgPool) {
      return result;
    }

    try {
      // Get user's customer IDs
      let customerWhereClause = `WHERE created_by = $1 AND deleted_at IS NULL`;
      const customerParams: any[] = [userId];

      if (dataAccessFilter?.customerType) {
        customerWhereClause += ` AND customer_type = $2`;
        customerParams.push(dataAccessFilter.customerType.toUpperCase());
      }

      const customerResult = await this.pgPool.query(
        `SELECT id FROM companies ${customerWhereClause}`,
        customerParams,
      );

      if (customerResult.rows.length === 0) {
        return result;
      }

      const customerIds = customerResult.rows.map((row) => row.id);

      // Delete product-customer associations
      const associationResult = await this.pgPool.query(
        `DELETE FROM product_customer_associations WHERE customer_id = ANY($1)`,
        [customerIds],
      );

      result.deleted = associationResult.rowCount || 0;
      result.total = result.deleted;
    } catch (error) {
      this.logger.error(`Failed to delete product associations: ${error instanceof Error ? error.message : String(error)}`, error);
      result.failed = result.total;
    }

    return result;
  }

  /**
   * Delete user-created products (if no other associations exist)
   * 
   * Deletes products created by the user, but only if:
   * - The product has no associations with other users' customers
   * - The product is not referenced in other users' interactions
   * 
   * @param userId - User ID whose products should be deleted
   * @param dataAccessFilter - Role-based filter (not used for products, but kept for consistency)
   * @param retentionDate - Date threshold for hard vs soft delete
   * @param job - BullMQ job for progress tracking
   * @returns Deletion result with counts
   */
  private async deleteUserCreatedProducts(
    userId: string,
    dataAccessFilter: { customerType?: string } | null,
    retentionDate: Date,
    job: Job<GdprDeletionJobData, GdprDeletionJobResult>,
  ): Promise<{ total: number; deleted: number; anonymized: number; failed: number }> {
    const result = { total: 0, deleted: 0, anonymized: 0, failed: 0 };
    let offset = 0;
    const limit = this.BATCH_SIZE;

    if (!this.pgPool) {
      return result;
    }

    try {
      // First, count total records for accurate progress tracking
      const totalCountResult = await this.pgPool.query(
        `SELECT COUNT(*) as total FROM products 
         WHERE created_by = $1 AND deleted_at IS NULL`,
        [userId],
      );
      const totalRecords = parseInt(totalCountResult.rows[0].total, 10);

      if (totalRecords === 0) {
        return result;
      }

      while (true) {
        // Get batch of user-created products
        const selectResult = await this.pgPool.query(
          `SELECT id, created_at FROM products 
           WHERE created_by = $1 AND deleted_at IS NULL 
           ORDER BY created_at DESC 
           LIMIT $2 OFFSET $3`,
          [userId, limit, offset],
        );

        if (selectResult.rows.length === 0) {
          break;
        }

        result.total += selectResult.rows.length;

        // Process each product
        for (const product of selectResult.rows) {
          try {
            await this.pgPool.query('BEGIN');

            // Check if product has associations with other users' customers
            const otherUserAssociationsCheck = await this.pgPool.query(
              `SELECT COUNT(*) as count 
               FROM product_customer_associations pca
               INNER JOIN companies c ON pca.customer_id = c.id
               WHERE pca.product_id = $1 AND c.created_by != $2 AND c.deleted_at IS NULL`,
              [product.id, userId],
            );

            // Check if product is referenced in other users' interactions
            const otherUserInteractionsCheck = await this.pgPool.query(
              `SELECT COUNT(*) as count 
               FROM product_customer_interactions pci
               INNER JOIN companies c ON pci.customer_id = c.id
               WHERE EXISTS (SELECT 1 FROM interaction_products ip WHERE ip.interaction_id = pci.id AND ip.product_id = $1) 
                 AND c.created_by != $2 AND pci.deleted_at IS NULL`,
              [product.id, userId],
            );

            const otherUserAssociations = parseInt(otherUserAssociationsCheck.rows[0].count, 10);
            const otherUserInteractions = parseInt(otherUserInteractionsCheck.rows[0].count, 10);

            // Only delete if no other users have associations or interactions
            if (otherUserAssociations === 0 && otherUserInteractions === 0) {
              const productCreatedAt = new Date(product.created_at);
              const shouldHardDelete = productCreatedAt < retentionDate;

              if (shouldHardDelete) {
                // Hard delete (beyond retention period)
                await this.pgPool.query('DELETE FROM products WHERE id = $1', [product.id]);
                result.deleted++;
              } else {
                // Soft delete (within retention period)
                await this.pgPool.query(
                  'UPDATE products SET deleted_at = NOW() WHERE id = $1',
                  [product.id],
                );
                result.deleted++;
              }
            } else {
              // Product has associations with other users, keep it
              // Just log that we're skipping it
              this.logger.debug(`Skipping product ${product.id} - has associations with other users' customers`);
            }

            await this.pgPool.query('COMMIT');
          } catch (error) {
            await this.pgPool.query('ROLLBACK');
            result.failed++;
            this.logger.warn(`Failed to delete product ${product.id}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Update progress with accurate total
        await job.updateProgress({
          processed: result.total,
          total: totalRecords,
          estimatedTimeRemaining: null,
        });

        if (selectResult.rows.length < limit) {
          break;
        }

        offset += limit;
      }
    } catch (error) {
      this.logger.error(`Failed to delete user-created products: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }

    return result;
  }

  /**
   * Delete or anonymize audit logs
   * 
   * Processes audit logs in batches to avoid memory issues and handle large volumes.
   * Uses pagination instead of hard-coded LIMIT to process all logs.
   * 
   * @param userId - User ID whose audit logs should be processed
   * @param retentionDate - Date threshold for hard vs soft delete (not used for audit logs, uses separate retention period)
   * @param job - BullMQ job for progress tracking
   * @returns Deletion result with counts
   */
  private async deleteAuditLogs(
    userId: string,
    retentionDate: Date,
    job: Job<GdprDeletionJobData, GdprDeletionJobResult>,
  ): Promise<{ total: number; deleted: number; anonymized: number; failed: number }> {
    const result = { total: 0, deleted: 0, anonymized: 0, failed: 0 };
    const auditLogRetentionDays = 365; // 1 year default
    const auditLogRetentionDate = new Date();
    auditLogRetentionDate.setDate(auditLogRetentionDate.getDate() - auditLogRetentionDays);
    let offset = 0;
    const limit = this.BATCH_SIZE;

    if (!this.pgPool) {
      return result;
    }

    try {
      // First, count total records for accurate progress tracking
      const totalCountResult = await this.pgPool.query(
        `SELECT COUNT(*) as total FROM audit_logs
         WHERE (user_id = $1 OR entity_id = $1)`,
        [userId],
      );
      const totalRecords = parseInt(totalCountResult.rows[0].total, 10);

      if (totalRecords === 0) {
        return result;
      }

      result.total = totalRecords;

      // Process audit logs in batches
      while (true) {
        const selectResult = await this.pgPool.query(
          `SELECT id, timestamp FROM audit_logs
           WHERE (user_id = $1 OR entity_id = $1)
           ORDER BY timestamp DESC
           LIMIT $2 OFFSET $3`,
          [userId, limit, offset],
        );

        if (selectResult.rows.length === 0) {
          break;
        }

        // Process each audit log
        for (const log of selectResult.rows) {
          try {
            const logTimestamp = new Date(log.timestamp);
            const shouldDelete = logTimestamp < auditLogRetentionDate;

            if (shouldDelete) {
              // Hard delete (beyond retention period)
              await this.pgPool.query('DELETE FROM audit_logs WHERE id = $1', [log.id]);
              result.deleted++;
            } else {
              // Anonymize (within retention period - remove user_id and operator_id)
              await this.pgPool.query(
                `UPDATE audit_logs SET user_id = NULL, operator_id = NULL WHERE id = $1`,
                [log.id],
              );
              result.anonymized++;
            }
          } catch (error) {
            result.failed++;
            this.logger.warn(`Failed to process audit log ${log.id}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Update progress with accurate total
        await job.updateProgress({
          processed: result.deleted + result.anonymized + result.failed,
          total: totalRecords,
          estimatedTimeRemaining: null,
        });

        if (selectResult.rows.length < limit) {
          break;
        }

        offset += limit;
      }
    } catch (error) {
      this.logger.error(`Failed to delete audit logs: ${error instanceof Error ? error.message : String(error)}`, error);
      result.failed = result.total;
    }

    return result;
  }
}
