/**
 * Export Processor
 * 
 * Processes export jobs using BullMQ
 * All custom code is proprietary and not open source.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { ExportService, ExportJobData, ExportJobResult } from './export.service';
import { ExportDataType, ExportFormat } from './dto/export-request.dto';
import { JsonExporterService } from './services/json-exporter.service';
import { CsvExporterService } from './services/csv-exporter.service';
import { ExcelExporterService } from './services/excel-exporter.service';
import { FieldDefinitionService } from './services/field-definition.service';
import { CompaniesService } from '../companies/companies.service';
import { ProductsService } from '../products/products.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import { ExportRecord, AnyExportRecord } from './types/export-record.types';

@Processor('export-queue')
@Injectable()
export class ExportProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(ExportProcessor.name);
  private readonly BATCH_SIZE = 1000; // Process 1000 records per batch
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly exportService: ExportService,
    private readonly jsonExporter: JsonExporterService,
    private readonly csvExporter: CsvExporterService,
    private readonly excelExporter: ExcelExporterService,
    private readonly companiesService: CompaniesService,
    private readonly productsService: ProductsService,
    private readonly interactionsService: InteractionsService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly fieldDefinitionService: FieldDefinitionService,
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
      this.logger.warn('DATABASE_URL not configured, export history will not be saved');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5,
      });
      this.logger.log('PostgreSQL connection pool initialized for ExportProcessor');
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
      this.logger.log('PostgreSQL connection pool closed for ExportProcessor');
    }
  }

  async process(job: Job<ExportJobData, ExportJobResult>): Promise<ExportJobResult> {
    const { exportType, format, filters, selectedFields, userId, token } = job.data;

    this.logger.log(`Processing export job ${job.id} for type ${exportType}, format ${format}`);

    try {
      // Update progress: 0% - Starting
      await job.updateProgress({
        processed: 0,
        total: 0,
        estimatedTimeRemaining: null,
      });

      // Fetch data based on export type
      let allData: AnyExportRecord[] = [];
      let totalRecords = 0;

      switch (exportType) {
        case ExportDataType.CUSTOMER:
          ({ allData, totalRecords } = await this.fetchCustomerData(filters || {}, token, job));
          break;
        case ExportDataType.PRODUCT:
          ({ allData, totalRecords } = await this.fetchProductData(filters || {}, userId, token, job));
          break;
        case ExportDataType.INTERACTION:
          ({ allData, totalRecords } = await this.fetchInteractionData(filters || {}, token, job, userId));
          break;
        default:
          throw new Error(`Unsupported export type: ${exportType}`);
      }

      this.logger.log(`Fetched ${totalRecords} records for export`);

      // Filter fields if selectedFields is provided
      if (selectedFields && selectedFields.length > 0) {
        const filterStartTime = Date.now();
        allData = this.filterFields(allData, selectedFields, exportType);
        const filterDuration = Date.now() - filterStartTime;
        this.logger.log(
          `Filtered ${totalRecords} records to ${selectedFields.length} fields in ${filterDuration}ms: ${selectedFields.join(', ')}`,
        );
        
        // Performance warning for large datasets
        if (totalRecords > 10000 && filterDuration > 5000) {
          this.logger.warn(
            `Field filtering took ${filterDuration}ms for ${totalRecords} records. Consider optimizing for large datasets.`,
          );
        }
      }

      // Update progress: 50% - Data fetched
      await job.updateProgress({
        processed: totalRecords,
        total: totalRecords,
        estimatedTimeRemaining: null,
      });

      // Generate file
      const fileName = this.exportService.generateFileName(exportType, format);
      const filePath = this.exportService.getExportFileFullPath(fileName);
      const fileId = job.id!;

      await this.exportData(allData, format, filePath, exportType, selectedFields);

      // Get file size
      const fileSize = fs.statSync(filePath).size;

      // Register file metadata
      this.exportService.registerExportFile(fileId, fileName, filePath, 24);

      // Save export history
      if (this.pgPool) {
        try {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          await this.pgPool.query(
            `INSERT INTO export_history
             (file_name, file_path, file_size, total_records, export_type, export_format, status, created_by, created_at, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
            [
              fileName,
              filePath,
              fileSize,
              totalRecords,
              exportType,
              format,
              'completed',
              userId,
              expiresAt,
            ],
          );
        } catch (error) {
          this.logger.error('Failed to save export history', error);
        }
      }

      // Log audit
      try {
        await this.auditService.log({
          action: 'EXPORT_DATA',
          entityType: exportType,
          entityId: null,
          userId,
          operatorId: userId,
          timestamp: new Date(),
          metadata: {
            exportType,
            format,
            totalRecords,
            fileSize,
            fileName,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for export', error);
      }

      // Update progress: 100% - Completed
      await job.updateProgress({
        processed: totalRecords,
        total: totalRecords,
        estimatedTimeRemaining: 0,
        fileId,
        fileName,
        fileSize,
      });

      this.logger.log(`Export job ${job.id} completed: ${totalRecords} records, ${fileSize} bytes`);

      return {
        success: true,
        fileId,
        fileName,
        fileSize,
        totalRecords,
      };
    } catch (error) {
      this.logger.error(`Export job ${job.id} failed`, error);

      // Update progress with error
      await job.updateProgress({
        error: error instanceof Error ? error.message : '导出失败',
      });

      // Save export history with failed status
      if (this.pgPool) {
        try {
          await this.pgPool.query(
            `INSERT INTO export_history
             (file_name, file_path, file_size, total_records, export_type, export_format, status, created_by, created_at, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
            [
              null,
              null,
              0,
              0,
              exportType,
              format,
              'failed',
              userId,
              null,
            ],
          );
        } catch (dbError) {
          this.logger.error('Failed to save export history for failed export', dbError);
        }
      }

      throw error;
    }
  }

  /**
   * Fetch customer data
   */
  private async fetchCustomerData(
    filters: Record<string, unknown>,
    token: string,
    job: Job<ExportJobData, ExportJobResult>,
  ): Promise<{ allData: ExportRecord[]; totalRecords: number }> {
    const allData: ExportRecord[] = [];
    let offset = 0;
    const limit = this.BATCH_SIZE;
    let totalRecords = 0;

    while (true) {
      const result = await this.companiesService.findAll(
        { ...filters, limit, offset },
        token,
      );

      if (result.customers.length === 0) {
        break;
      }

      allData.push(...(result.customers as unknown as ExportRecord[]));
      totalRecords = result.total;

      // Update progress
      await job.updateProgress({
        processed: allData.length,
        total: totalRecords,
        estimatedTimeRemaining: null,
      });

      if (allData.length >= totalRecords) {
        break;
      }

      offset += limit;
    }

    return { allData, totalRecords };
  }

  /**
   * Fetch product data
   */
  private async fetchProductData(
    filters: Record<string, unknown>,
    userId: string,
    token: string,
    job: Job<ExportJobData, ExportJobResult>,
  ): Promise<{ allData: ExportRecord[]; totalRecords: number }> {
    const allData: ExportRecord[] = [];
    let offset = 0;
    const limit = this.BATCH_SIZE;
    let totalRecords = 0;

    while (true) {
      const result = await this.productsService.findAll(
        { ...filters, limit, offset },
        userId,
        token,
      );

      if (result.products.length === 0) {
        break;
      }

      allData.push(...(result.products as unknown as ExportRecord[]));
      totalRecords = result.total;

      // Update progress
      await job.updateProgress({
        processed: allData.length,
        total: totalRecords,
        estimatedTimeRemaining: null,
      });

      if (allData.length >= totalRecords) {
        break;
      }

      offset += limit;
    }

    return { allData, totalRecords };
  }

  /**
   * Fetch interaction data with associated customer and product names
   */
  private async fetchInteractionData(
    filters: Record<string, unknown>,
    token: string,
    job: Job<ExportJobData, ExportJobResult>,
    userId?: string,
  ): Promise<{ allData: ExportRecord[]; totalRecords: number }> {
    const allData: ExportRecord[] = [];
    let offset = 0;
    const limit = this.BATCH_SIZE;
    let totalRecords = 0;

    while (true) {
      const result = await this.interactionsService.findAll(
        { ...filters, limit, offset },
        token,
      );

      if (result.interactions.length === 0) {
        break;
      }

      // Enrich interactions with customer and product names
      const enrichedInteractions = await Promise.all(
        result.interactions.map(async (interaction) => {
          const enriched: ExportRecord = { ...interaction };
          
          // Fetch customer name
          try {
            const customer = await this.companiesService.findOne(interaction.customerId, token);
            enriched.customerName = customer.name;
          } catch (error) {
            this.logger.warn(`Failed to fetch customer name for ${interaction.customerId}:`, error);
            enriched.customerName = null;
          }
          
          // Fetch product name (requires userId)
          if (userId) {
            try {
              const product = await this.productsService.findOne(interaction.productId, userId, token);
              enriched.productName = product.name;
            } catch (error) {
              this.logger.warn(`Failed to fetch product name for ${interaction.productId}:`, error);
              enriched.productName = null;
            }
          } else {
            enriched.productName = null;
          }
          
          return enriched;
        }),
      );

      allData.push(...enrichedInteractions);
      totalRecords = result.total;

      // Update progress
      await job.updateProgress({
        processed: allData.length,
        total: totalRecords,
        estimatedTimeRemaining: null,
      });

      if (allData.length >= totalRecords) {
        break;
      }

      offset += limit;
    }

    return { allData, totalRecords };
  }

  /**
   * Filter fields from records based on selectedFields
   * Maintains the order of selectedFields
   * Validates that selected fields are valid and logs warnings for invalid fields
   * Optimized for performance with large datasets
   */
  private filterFields(
    data: ExportRecord[],
    selectedFields: string[],
    exportType: ExportDataType,
  ): ExportRecord[] {
    if (!data || data.length === 0) {
      return data;
    }

    // Validate selected fields against available fields
    const availableFields = this.fieldDefinitionService.getAvailableFields(exportType);
    const availableFieldNames = new Set(availableFields.map(f => f.fieldName));
    const invalidFields = selectedFields.filter(field => !availableFieldNames.has(field));
    
    if (invalidFields.length > 0) {
      this.logger.warn(
        `Invalid fields selected for export (${exportType}): ${invalidFields.join(', ')}. These fields will be skipped.`,
      );
    }

    // Filter to only valid fields upfront for better performance
    const validFields = selectedFields.filter(field => availableFieldNames.has(field));
    
    // Optimize: Pre-create field accessor to avoid repeated Set lookups
    // For large datasets, use a more efficient approach
    if (data.length > 5000) {
      // For large datasets, use for...of loop for better performance
      return data.map(record => {
        const filtered: ExportRecord = {};
        // Maintain order of validFields
        for (const field of validFields) {
          if (field in record) {
            filtered[field] = record[field];
          }
        }
        return filtered;
      });
    } else {
      // For smaller datasets, use forEach
      return data.map(record => {
        const filtered: ExportRecord = {};
        // Maintain order of validFields
        validFields.forEach(field => {
          if (field in record) {
            filtered[field] = record[field];
          }
        });
        return filtered;
      });
    }
  }

  /**
   * Get field display names for selected fields
   */
  private getFieldDisplayNames(exportType: ExportDataType, selectedFields: string[]): string[] {
    const fieldDefinitions = this.fieldDefinitionService.getAvailableFields(exportType);
    const fieldMap = new Map(fieldDefinitions.map(f => [f.fieldName, f.displayName]));
    return selectedFields.map(field => fieldMap.get(field) || field);
  }

  /**
   * Export data to file based on format
   */
  private async exportData(
    data: ExportRecord[],
    format: ExportFormat,
    filePath: string,
    exportType: ExportDataType,
    selectedFields?: string[],
  ): Promise<void> {
    // Get field display names for CSV/Excel headers
    const displayNames = selectedFields && selectedFields.length > 0
      ? this.getFieldDisplayNames(exportType, selectedFields)
      : undefined;

    switch (format) {
      case ExportFormat.JSON:
        await this.jsonExporter.exportToFile(data, filePath, {
          exportType,
          version: '1.0',
        }, selectedFields);
        break;
      case ExportFormat.CSV:
        await this.csvExporter.exportToFile(data, filePath, selectedFields, displayNames);
        break;
      case ExportFormat.EXCEL:
        await this.excelExporter.exportToFile(data, filePath, exportType, selectedFields, displayNames);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

