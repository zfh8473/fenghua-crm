/**
 * GDPR Export Processor
 * 
 * Processes GDPR export jobs using BullMQ
 * All custom code is proprietary and not open source.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { GdprExportService, GdprExportJobData, GdprExportJobResult } from './gdpr-export.service';
import { JsonExporterService } from '../export/services/json-exporter.service';
import { CsvExporterService } from '../export/services/csv-exporter.service';
import { GdprExportFormat, GdprExportRequestStatus } from './dto/gdpr-export-request.dto';
import { PermissionService } from '../permission/permission.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { CompaniesService } from '../companies/companies.service';
import { ProductsService } from '../products/products.service';
import { InteractionsService } from '../interactions/interactions.service';

@Processor('gdpr-export-queue')
@Injectable()
export class GdprExportProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(GdprExportProcessor.name);
  private readonly BATCH_SIZE = 1000; // Process 1000 records per batch
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly gdprExportService: GdprExportService,
    private readonly jsonExporter: JsonExporterService,
    private readonly csvExporter: CsvExporterService,
    private readonly permissionService: PermissionService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    private readonly companiesService: CompaniesService,
    private readonly productsService: ProductsService,
    private readonly interactionsService: InteractionsService,
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
      this.logger.warn('DATABASE_URL not configured, GDPR export processing will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5,
      });
      this.logger.log('PostgreSQL connection pool initialized for GdprExportProcessor');
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
      this.logger.log('PostgreSQL connection pool closed for GdprExportProcessor');
    }
  }

  /**
   * Process GDPR export job
   */
  async process(job: Job<GdprExportJobData, GdprExportJobResult>): Promise<GdprExportJobResult> {
    const { requestId, userId, format, token } = job.data;

    this.logger.log(`Processing GDPR export job ${job.id} for request ${requestId}, user ${userId}`);

    try {
      // Update status to PROCESSING
      await this.gdprExportService.updateRequestStatus(requestId, GdprExportRequestStatus.PROCESSING);

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

      // Collect user data
      const exportData = await this.collectUserData(userId, userRole, dataAccessFilter, token, job);

      // Update progress: 50% - Data collected
      await job.updateProgress({
        processed: exportData.totalRecords,
        total: exportData.totalRecords,
        estimatedTimeRemaining: null,
      });

      // Update status to GENERATING_FILE
      await this.gdprExportService.updateRequestStatus(requestId, GdprExportRequestStatus.GENERATING_FILE);

      // Check if user has no data
      if (exportData.allData.length === 0) {
        this.logger.warn(`No data found for user ${userId} - creating empty export file`);
        // Still create file with metadata indicating no data
      }

      // Generate file
      const fileName = this.generateFileName(userId, requestId, format);
      const filePath = this.getExportFileFullPath(fileName);

      await this.exportData(exportData.allData, format, filePath);

      // Get file size
      const fileSize = fs.statSync(filePath).size;

      // Update request with file information
      await this.gdprExportService.updateRequestStatus(requestId, GdprExportRequestStatus.COMPLETED, {
        filePath,
        fileName,
        fileSize,
        totalRecords: exportData.totalRecords,
      });

      // Log to audit
      await this.auditService.log({
        action: 'GDPR_EXPORT_COMPLETED',
        entityType: 'GDPR_EXPORT',
        entityId: requestId,
        userId,
        operatorId: userId,
        timestamp: new Date(),
        metadata: {
          format,
          fileSize,
          totalRecords: exportData.totalRecords,
        },
      });

      // Update progress: 100% - Completed
      await job.updateProgress({
        processed: exportData.totalRecords,
        total: exportData.totalRecords,
        estimatedTimeRemaining: 0,
      });

      this.logger.log(`GDPR export job ${job.id} completed: ${exportData.totalRecords} records, ${fileSize} bytes`);

      return {
        success: true,
        filePath,
        fileName,
        fileSize,
        totalRecords: exportData.totalRecords,
      };
    } catch (error) {
      this.logger.error(`GDPR export job ${job.id} failed`, error);

      // Update status to FAILED
      await this.gdprExportService.updateRequestStatus(requestId, GdprExportRequestStatus.FAILED, {
        error: error instanceof Error ? error.message : '导出失败',
      });

      // Log to audit
      await this.auditService.log({
        action: 'GDPR_EXPORT_FAILED',
        entityType: 'GDPR_EXPORT',
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
   * Collect all user-related data
   */
  private async collectUserData(
    userId: string,
    userRole: string | undefined,
    dataAccessFilter: { customerType?: string } | null,
    token: string,
    job: Job<GdprExportJobData, GdprExportJobResult>,
  ): Promise<{ allData: any[]; totalRecords: number }> {
    const allData: any[] = [];

    // 1. Collect customer records
    const customers = await this.collectCustomerData(userId, dataAccessFilter, token, job);
    allData.push(...customers);

    // 2. Collect interaction records
    const interactions = await this.collectInteractionData(userId, dataAccessFilter, token, job);
    allData.push(...interactions);

    // 3. Collect product records
    const products = await this.collectProductData(userId, token, job);
    allData.push(...products);

    // 4. Collect audit logs
    const auditLogs = await this.collectAuditLogs(userId);
    allData.push(...auditLogs);

    // Use actual array length as totalRecords (accurate count)
    const totalRecords = allData.length;

    return { allData, totalRecords };
  }

  /**
   * Collect customer data created by user (with role-based filtering)
   */
  private async collectCustomerData(
    userId: string,
    dataAccessFilter: { customerType?: string } | null,
    token: string,
    job: Job<GdprExportJobData, GdprExportJobResult>,
  ): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = this.BATCH_SIZE;

    while (true) {
      // Build query with role-based filter
      let whereClause = `WHERE created_by = $1 AND deleted_at IS NULL`;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (dataAccessFilter?.customerType) {
        whereClause += ` AND customer_type = $${paramIndex++}`;
        params.push(dataAccessFilter.customerType.toUpperCase());
      }

      if (!this.pgPool) {
        break;
      }

      const limitParamIndex = paramIndex;
      const offsetParamIndex = paramIndex + 1;
      const result = await this.pgPool.query(
        `SELECT * FROM companies ${whereClause} ORDER BY created_at DESC LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
        [...params, limit, offset],
      );

      if (result.rows.length === 0) {
        break;
      }

      allData.push(...result.rows);

      // Update progress
      await job.updateProgress({
        processed: allData.length,
        total: allData.length,
        estimatedTimeRemaining: null,
      });

      if (result.rows.length < limit) {
        break;
      }

      offset += limit;
    }

    return allData;
  }

  /**
   * Collect interaction data created by user (with role-based filtering)
   */
  private async collectInteractionData(
    userId: string,
    dataAccessFilter: { customerType?: string } | null,
    token: string,
    job: Job<GdprExportJobData, GdprExportJobResult>,
  ): Promise<any[]> {
    const allData: any[] = [];
    let offset = 0;
    const limit = this.BATCH_SIZE;

    while (true) {
      // Build query with role-based filter
      let whereClause = `WHERE pci.created_by = $1 AND pci.deleted_at IS NULL`;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (dataAccessFilter?.customerType) {
        whereClause += ` AND c.customer_type = $${paramIndex++}`;
        params.push(dataAccessFilter.customerType.toUpperCase());
      }

      if (!this.pgPool) {
        break;
      }

      const limitParamIndex = paramIndex;
      const offsetParamIndex = paramIndex + 1;
      const result = await this.pgPool.query(
        `SELECT pci.*, c.name as customer_name, c.customer_type
         FROM product_customer_interactions pci
         LEFT JOIN companies c ON pci.customer_id = c.id
         ${whereClause}
         ORDER BY pci.created_at DESC
         LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
        [...params, limit, offset],
      );

      if (result.rows.length === 0) {
        break;
      }

      allData.push(...result.rows);

      // Update progress
      await job.updateProgress({
        processed: allData.length,
        total: allData.length,
        estimatedTimeRemaining: null,
      });

      if (result.rows.length < limit) {
        break;
      }

      offset += limit;
    }

    return allData;
  }

  /**
   * Collect product data (user created, associated with user's customers, or in user's interactions)
   */
  private async collectProductData(
    userId: string,
    token: string,
    job: Job<GdprExportJobData, GdprExportJobResult>,
  ): Promise<any[]> {
    const allData: any[] = [];
    const productIds = new Set<string>();

    if (!this.pgPool) {
      return allData;
    }

    // 1. Products created by user
    const createdProducts = await this.pgPool.query(
      `SELECT * FROM products WHERE created_by = $1 AND deleted_at IS NULL`,
      [userId],
    );
    createdProducts.rows.forEach((row) => {
      productIds.add(row.id);
      allData.push({ ...row, source: 'created_by_user' });
    });

    // 2. Products associated with user's customers
    const userCustomers = await this.pgPool.query(
      `SELECT id FROM companies WHERE created_by = $1 AND deleted_at IS NULL`,
      [userId],
    );
    const customerIds = userCustomers.rows.map((row) => row.id);

    if (customerIds.length > 0) {
      const associatedProducts = await this.pgPool.query(
        `SELECT DISTINCT p.*, 'associated_with_customer' as source
         FROM products p
         INNER JOIN product_customer_associations pca ON p.id = pca.product_id
         WHERE pca.customer_id = ANY($1) AND p.deleted_at IS NULL`,
        [customerIds],
      );
      associatedProducts.rows.forEach((row) => {
        if (!productIds.has(row.id)) {
          productIds.add(row.id);
          allData.push(row);
        }
      });
    }

    // 3. Products from user's interactions
    const interactionProducts = await this.pgPool.query(
      `SELECT DISTINCT p.*, 'in_user_interactions' as source
       FROM products p
       INNER JOIN product_customer_interactions pci ON p.id = pci.product_id
       WHERE pci.created_by = $1 AND p.deleted_at IS NULL`,
      [userId],
    );
    interactionProducts.rows.forEach((row) => {
      if (!productIds.has(row.id)) {
        productIds.add(row.id);
        allData.push(row);
      }
    });

    return allData;
  }

  /**
   * Collect audit logs for user
   */
  private async collectAuditLogs(userId: string): Promise<any[]> {
    // Use AuditService.getUserAuditLogs method
    const auditLogs = await this.auditService.getUserAuditLogs(userId, 10000);
    return auditLogs.map((log) => ({
      ...log,
      source: 'audit_log',
    }));
  }

  /**
   * Export data to file
   */
  private async exportData(data: any[], format: GdprExportFormat, filePath: string): Promise<void> {
    if (format === GdprExportFormat.JSON) {
      await this.jsonExporter.exportToFile(data, filePath, {
        exportType: 'GDPR_EXPORT',
        version: '1.0',
      });
    } else if (format === GdprExportFormat.CSV) {
      // CsvExporterService doesn't accept metadata parameter
      await this.csvExporter.exportToFile(data, filePath);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate file name
   */
  private generateFileName(userId: string, requestId: string, format: GdprExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `gdpr-export-${userId}-${requestId}-${timestamp}.${format.toLowerCase()}`;
  }

  /**
   * Get full file path
   */
  private getExportFileFullPath(fileName: string): string {
    const exportDir = this.configService.get<string>('GDPR_EXPORT_STORAGE_PATH', './exports/gdpr');
    return path.join(exportDir, fileName);
  }
}
