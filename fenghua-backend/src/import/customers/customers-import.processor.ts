/**
 * Customers Import Processor
 * 
 * Processes customer import jobs using BullMQ
 * All custom code is proprietary and not open source.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { CustomersImportService } from './customers-import.service';
import { CompaniesService } from '../../companies/companies.service';
import { ValidationService } from './services/validation.service';
import { ErrorReportGeneratorService } from './services/error-report-generator.service';
import { AuditService } from '../../audit/audit.service';
import { ColumnMappingDto } from './dto/mapping-preview.dto';
import { CreateCustomerDto } from '../../companies/dto/create-customer.dto';

export interface ImportJobData {
  fileId: string;
  columnMappings: ColumnMappingDto[];
  userId: string;
  token: string;
}

export interface ImportJobResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

@Processor('customer-import-queue')
@Injectable()
export class CustomersImportProcessor extends WorkerHost {
  private readonly logger = new Logger(CustomersImportProcessor.name);
  private readonly BATCH_SIZE = 100; // Process 100 records per batch
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly customersImportService: CustomersImportService,
    private readonly companiesService: CompaniesService,
    private readonly validationService: ValidationService,
    private readonly errorReportGenerator: ErrorReportGeneratorService,
    private readonly auditService: AuditService,
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
      this.logger.warn('DATABASE_URL not configured, import history will not be saved');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for CustomersImportProcessor');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  async process(job: Job<ImportJobData, ImportJobResult>): Promise<ImportJobResult> {
    const { fileId, columnMappings, userId, token } = job.data;

    this.logger.log(`Processing import job ${job.id} for file ${fileId}`);

    let allData: any[] = [];
    try {
      // 1. Parse file
      const filePath = await this.customersImportService.getFilePath(fileId);
      const parser = this.customersImportService.getParser(filePath);
      allData = await parser.parseFile(filePath);

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ row: number; field: string; message: string }> = [];
      const validRecords: CreateCustomerDto[] = [];

      // 2. Validate and transform all records
      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];
        const rowNumber = i + 2; // Excel row number (1-based, +1 for header)

        // Transform row data using mappings
        const transformedData = this.customersImportService.transformRowData(row, columnMappings);

        // Validate record
        const validationResult = this.validationService.validateRecord(transformedData, rowNumber);

        if (!validationResult.isValid) {
          failureCount++;
          validationResult.errors.forEach(error => {
            errors.push({
              row: rowNumber,
              field: error.field,
              message: error.message,
            });
          });
        } else {
          validRecords.push(validationResult.cleanedData as CreateCustomerDto);
        }

        // Update progress
        const progress = Math.round(((i + 1) / allData.length) * 100);
        await job.updateProgress(progress);
      }

      // 3. Bulk insert valid records in batches with SAVEPOINT for partial success
      const failedRecords: Array<{ row: number; data: Record<string, any>; errors: Array<{ field: string; message: string }> }> = [];
      // Map valid records to their original row numbers in allData
      const validRecordToRowMap = new Map<number, number>(); // Map validRecord index to original row number
      
      let validIndex = 0;
      for (let i = 0; i < allData.length; i++) {
        if (validIndex >= validRecords.length) break;
        
        const row = allData[i];
        const transformed = this.customersImportService.transformRowData(row, columnMappings);
        const record = validRecords[validIndex];
        
        if (transformed.name === record.name && transformed.customerType === record.customerType) {
          validRecordToRowMap.set(validIndex, i + 2);
          validIndex++;
        }
      }

      if (this.pgPool && validRecords.length > 0) {
        const client = await this.pgPool.connect();
        try {
          await client.query('BEGIN');

          for (let i = 0; i < validRecords.length; i++) {
            const record = validRecords[i];
            const rowNumber = validRecordToRowMap.get(i) || (i + 2); // Get original row number or use fallback

            // Create savepoint for each record
            const savepointName = `sp_record_${i}`;
            await client.query(`SAVEPOINT ${savepointName}`);

            try {
              // Generate customer code if not provided
              let customerCode = record.customerCode;
              if (!customerCode || customerCode.trim() === '') {
                // Generate code using existing logic
                const prefix = record.customerType === 'BUYER' ? 'BUY' : 'SUP';
                customerCode = `${prefix}${Date.now().toString().slice(-6)}${i}`;
              }

              // Validate userId format
              let validUserId: string | null = userId;
              if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
                validUserId = null;
              }

              // Insert customer
              await client.query(
                `INSERT INTO companies (
                  name, customer_code, customer_type, domain_name, address, city, state, country, 
                  postal_code, industry, employees, website, phone, email, notes, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                [
                  record.name,
                  customerCode,
                  record.customerType,
                  record.domainName || null,
                  record.address || null,
                  record.city || null,
                  record.state || null,
                  record.country || null,
                  record.postalCode || null,
                  record.industry || null,
                  record.employees || null,
                  record.website || null,
                  record.phone || null,
                  record.email || null,
                  record.notes || null,
                  validUserId,
                ],
              );

              successCount++;
              // Release savepoint on success
              await client.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (error) {
              // Rollback to savepoint on failure
              await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
              failureCount++;
              const errorMessage = error instanceof Error ? error.message : '批量插入失败';
              errors.push({
                row: rowNumber,
                field: 'bulk_insert',
                message: errorMessage,
              });
              failedRecords.push({
                row: rowNumber,
                data: record as any,
                errors: [{ field: 'bulk_insert', message: errorMessage }],
              });
            }

            // Update progress
            const progress = Math.round(((i + 1) / validRecords.length) * 100);
            await job.updateProgress(progress);
          }

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          this.logger.error('Failed to insert records', error);
          throw error;
        } finally {
          client.release();
        }
      } else {
        // Fallback to original bulkCreate if no pool (no SAVEPOINT support)
        for (let i = 0; i < validRecords.length; i += this.BATCH_SIZE) {
          const batch = validRecords.slice(i, i + this.BATCH_SIZE);
          
          try {
            await this.companiesService.bulkCreate(batch, userId, token);
            successCount += batch.length;
          } catch (error) {
            this.logger.error(`Failed to insert batch starting at index ${i}`, error);
            failureCount += batch.length;
            // Find row numbers for failed records
            batch.forEach((record, batchIndex) => {
              let rowNumber = i + batchIndex + 2;
              for (let j = 0; j < allData.length; j++) {
                const transformed = this.customersImportService.transformRowData(allData[j], columnMappings);
                if (transformed.name === record.name && transformed.customerType === record.customerType) {
                  rowNumber = j + 2;
                  break;
                }
              }
              errors.push({
                row: rowNumber,
                field: 'bulk_insert',
                message: error instanceof Error ? error.message : '批量插入失败',
              });
              failedRecords.push({
                row: rowNumber,
                data: record as any,
                errors: [{ field: 'bulk_insert', message: error instanceof Error ? error.message : '批量插入失败' }],
              });
            });
          }

          // Update progress
          const progress = Math.round(((i + batch.length) / validRecords.length) * 100);
          await job.updateProgress(progress);
        }
      }

      // 4. Generate error report if there are failures
      let errorReportPath: string | undefined;
      if (failedRecords.length > 0) {
        try {
          errorReportPath = await this.errorReportGenerator.generateErrorReport(
            job.id!,
            failedRecords,
          );
        } catch (error) {
          this.logger.warn('Failed to generate error report', error);
        }
      }

      // 5. Save import history
      const fileName = await this.customersImportService.getFileName(fileId);
      await this.saveImportHistory(
        job.id!,
        fileName,
        fileId,
        userId,
        'completed',
        allData.length,
        successCount,
        failureCount,
        errorReportPath,
        failedRecords,
      );

      // 6. Log audit
      try {
        await this.auditService.log({
          action: 'IMPORT_CUSTOMERS',
          entityType: 'CUSTOMER',
          entityId: null,
          userId: userId || 'system',
          operatorId: userId || 'system',
          timestamp: new Date(),
          metadata: {
            taskId: job.id,
            fileName,
            totalRecords: allData.length,
            successCount,
            failureCount,
            errorReportPath,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for import', error);
      }

      const result: ImportJobResult = {
        success: failureCount === 0,
        totalRecords: allData.length,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined,
      };

      this.logger.log(
        `Import job ${job.id} completed: ${successCount} success, ${failureCount} failures`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Import job ${job.id} failed`, error);
      
      // Save failed import history
      try {
        const fileName = await this.customersImportService.getFileName(fileId);
        await this.saveImportHistory(
          job.id!,
          fileName,
          fileId,
          userId,
          'failed',
          allData?.length || 0,
          0,
          allData?.length || 0,
          undefined,
        );
      } catch (historyError) {
        this.logger.warn('Failed to save import history for failed job', historyError);
      }

      throw error;
    }
  }

  /**
   * Save import history to database
   */
  private async saveImportHistory(
    taskId: string,
    fileName: string,
    fileId: string,
    userId: string,
    status: 'processing' | 'completed' | 'failed' | 'partial',
    totalRecords: number,
    successCount: number,
    failureCount: number,
    errorReportPath?: string,
    errorDetails?: Array<{ row: number; data: Record<string, any>; errors: Array<{ field: string; message: string }> }>,
  ): Promise<void> {
    if (!this.pgPool) {
      return;
    }

    try {
      const now = new Date();
      
      // Determine final status based on success/failure counts
      let finalStatus: 'processing' | 'completed' | 'failed' | 'partial' = status;
      if (status !== 'processing') {
        if (failureCount === 0) {
          finalStatus = 'completed';
        } else if (successCount > 0 && failureCount > 0) {
          finalStatus = 'partial';
        } else {
          finalStatus = 'failed';
        }
      }

      // Convert errorDetails to JSONB format
      let errorDetailsJsonb = null;
      if (errorDetails && errorDetails.length > 0) {
        errorDetailsJsonb = JSON.stringify({ errors: errorDetails });
      }

      await this.pgPool.query(
        `INSERT INTO import_history (
          task_id, file_name, file_id, user_id, status, total_records,
          success_count, failure_count, error_report_path, error_details, import_type, started_at, completed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (task_id) DO UPDATE SET
          status = EXCLUDED.status,
          total_records = EXCLUDED.total_records,
          success_count = EXCLUDED.success_count,
          failure_count = EXCLUDED.failure_count,
          error_report_path = EXCLUDED.error_report_path,
          error_details = EXCLUDED.error_details,
          completed_at = EXCLUDED.completed_at,
          updated_at = EXCLUDED.updated_at`,
        [
          taskId,
          fileName,
          fileId,
          userId,
          finalStatus,
          totalRecords,
          successCount,
          failureCount,
          errorReportPath || null,
          errorDetailsJsonb,
          'CUSTOMER',
          now,
          finalStatus === 'processing' ? null : now,
          now,
          now,
        ],
      );
    } catch (error) {
      this.logger.error('Failed to save import history', error);
    }
  }
}

