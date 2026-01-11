/**
 * Interactions Import Processor
 * 
 * Processes interaction import jobs using BullMQ
 * All custom code is proprietary and not open source.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { InteractionsImportService } from './interactions-import.service';
import { InteractionsService } from '../../interactions/interactions.service';
import { InteractionValidationService } from './services/validation.service';
import { ErrorReportGeneratorService } from '../customers/services/error-report-generator.service';
import { AuditService } from '../../audit/audit.service';
import { AuthService } from '../../auth/auth.service';
import { ColumnMappingDto } from '../customers/dto/mapping-preview.dto';
import { CreateInteractionDto } from '../../interactions/dto/create-interaction.dto';

export interface ImportJobData {
  fileId: string;
  filePath?: string;
  columnMappings: ColumnMappingDto[];
  userId: string;
  token: string;
}

export interface ImportJobResult {
  success: boolean;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  errors?: Array<{
    row: number;
    errors: string[];
  }>;
}

@Processor('interaction-import-queue')
@Injectable()
export class InteractionsImportProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(InteractionsImportProcessor.name);
  private readonly BATCH_SIZE = 100; // Process 100 records per batch
  private pgPool: Pool | null = null; // Dedicated pool for processor transactions

  constructor(
    private readonly configService: ConfigService,
    private readonly interactionsImportService: InteractionsImportService,
    private readonly interactionsService: InteractionsService,
    private readonly validationService: InteractionValidationService,
    private readonly errorReportGenerator: ErrorReportGeneratorService,
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
      this.logger.warn('DATABASE_URL not configured, import history will not be saved');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5, // Smaller pool for processor
      });
      this.logger.log('PostgreSQL connection pool initialized for InteractionsImportProcessor');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool for processor', error);
    }
  }

  /**
   * Cleanup database connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for InteractionsImportProcessor');
    }
  }

  async process(job: Job<ImportJobData, ImportJobResult>): Promise<ImportJobResult> {
    const { fileId, filePath: providedFilePath, columnMappings, userId, token } = job.data;

    this.logger.log(`Processing import job ${job.id} for file ${fileId}`);

    let allData: any[] = [];
    try {
      // 1. Parse file
      const filePath = providedFilePath || await this.interactionsImportService.getFilePath(fileId);
      const parser = this.interactionsImportService.getParser(filePath);
      allData = await parser.parseFile(filePath);

      this.logger.log(`Parsed ${allData.length} records from file`);

      // Update progress: 10% for parsing
      await job.updateProgress({ processed: 0, total: allData.length, estimatedTimeRemaining: null });

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ row: number; errors: string[] }> = [];
      const validRecords: CreateInteractionDto[] = [];

      // 2. Batch load reference data (customers, products, associations)
      this.logger.log('Batch loading reference data...');
      const { customersMap, productsMap, associationsSet } = await this.interactionsImportService.batchLoadReferenceData(token, userId);
      this.logger.log(`Loaded ${customersMap.size} customers, ${productsMap.size} products, ${associationsSet.size} associations`);

      // Get user info for role validation
      const user = await this.authService.validateToken(token);
      if (!user || !user.role) {
        throw new Error('无效的用户 token');
      }

      // 3. Validate and transform all records
      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];
        const rowNumber = i + 2; // Excel row number (1-based, +1 for header)

        // Transform row data using mappings
        const transformedData = this.interactionsImportService.transformRowData(row, columnMappings);

        // Validate record format
        const validationResult = this.validationService.validateRecord(transformedData, rowNumber);

        if (!validationResult.isValid) {
          failureCount++;
          errors.push({
            row: rowNumber,
            errors: validationResult.errors.map(e => `${e.field}: ${e.message}`),
          });
          continue;
        }

        // Resolve customer ID
        const customerResult = this.interactionsImportService.resolveCustomerId(transformedData, customersMap);
        if (customerResult.error) {
          failureCount++;
          errors.push({
            row: rowNumber,
            errors: [`customerId: ${customerResult.error}`],
          });
          continue;
        }

        // Validate role permission
        const customer = Array.from(customersMap.values()).find(c => c.id === customerResult.customerId);
        if (customer) {
          if (user.role === 'FRONTEND_SPECIALIST' && customer.customerType !== 'BUYER') {
            failureCount++;
            errors.push({
              row: rowNumber,
              errors: ['customerId: 前端专员只能导入采购商类型的客户互动记录'],
            });
            continue;
          }
          if (user.role === 'BACKEND_SPECIALIST' && customer.customerType !== 'SUPPLIER') {
            failureCount++;
            errors.push({
              row: rowNumber,
              errors: ['customerId: 后端专员只能导入供应商类型的客户互动记录'],
            });
            continue;
          }
        }

        // Resolve product IDs
        const productResult = this.interactionsImportService.resolveProductIds(transformedData, productsMap);
        if (productResult.error) {
          failureCount++;
          errors.push({
            row: rowNumber,
            errors: [`productIds: ${productResult.error}`],
          });
          continue;
        }

        // Validate associations exist for all products
        if (productResult.productIds && customerResult.customerId) {
          const missingAssociations: string[] = [];
          for (const productId of productResult.productIds) {
            const associationKey = `${customerResult.customerId}-${productId}`;
            if (!associationsSet.has(associationKey)) {
              missingAssociations.push(productId);
            }
          }

          if (missingAssociations.length > 0) {
            failureCount++;
            errors.push({
              row: rowNumber,
              errors: [`关联关系: 以下产品与客户之间必须已有关联，请先创建关联: ${missingAssociations.join(', ')}`],
            });
            continue;
          }
        }

        // Create interaction DTO
        const interactionDto: CreateInteractionDto = {
          productIds: productResult.productIds!,
          customerId: customerResult.customerId!,
          interactionType: validationResult.cleanedData!.interactionType!,
          interactionDate: validationResult.cleanedData!.interactionDate!,
          description: validationResult.cleanedData!.description,
          status: validationResult.cleanedData!.status,
          additionalInfo: validationResult.cleanedData!.additionalInfo,
        };

        validRecords.push(interactionDto);

        // Update progress: 50% for validation
        if ((i + 1) % 100 === 0) {
          await job.updateProgress({
            processed: i + 1,
            total: allData.length,
            estimatedTimeRemaining: null,
          });
        }
      }

      this.logger.log(`Validation completed: ${validRecords.length} valid records, ${failureCount} failed records`);

      // 4. Bulk insert valid records using InteractionsService.bulkCreate
      if (validRecords.length > 0) {
        this.logger.log(`Starting bulk insert of ${validRecords.length} interaction records using InteractionsService.bulkCreate...`);
        
        try {
          // Use InteractionsService.bulkCreate which handles SAVEPOINT internally
          // Process records in batches to avoid overwhelming the database
          const BATCH_SIZE = 50; // Process 50 records per batch
          let processedCount = 0;
          
          for (let batchStart = 0; batchStart < validRecords.length; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, validRecords.length);
            const batch = validRecords.slice(batchStart, batchEnd);
            
            try {
              // Call bulkCreate which uses SAVEPOINT for partial success
              const createdInteractions = await this.interactionsService.bulkCreate(
                batch,
                userId,
                token,
              );
              
              // Count successful records (each CreateInteractionDto can create multiple interaction records)
              const batchSuccessCount = createdInteractions.length;
              successCount += batch.length; // Count DTOs, not individual interactions
              
              this.logger.log(`Batch ${batchStart / BATCH_SIZE + 1}: Created ${batchSuccessCount} interaction records from ${batch.length} DTOs`);
              
              // Update progress: 50-100% for insertion
              processedCount += batch.length;
              await job.updateProgress({
                processed: allData.length - validRecords.length + processedCount,
                total: allData.length,
                estimatedTimeRemaining: null,
              });
            } catch (batchError) {
              // If entire batch fails, mark all records in batch as failed
              this.logger.error(`Batch ${batchStart / BATCH_SIZE + 1} failed:`, batchError);
              
              for (let i = 0; i < batch.length; i++) {
                const record = batch[i];
                const originalRowIndex = validRecords.indexOf(record);
                const rowNumber = originalRowIndex >= 0 ? originalRowIndex + 2 : batchStart + i + 2;
                
                failureCount++;
                const errorMessage = batchError instanceof Error ? batchError.message : '批量插入失败';
                errors.push({
                  row: rowNumber,
                  errors: [errorMessage],
                });
              }
            }
          }
          
          this.logger.log(`Bulk insert completed: ${successCount} success, ${failureCount} failed`);
        } catch (error) {
          this.logger.error('Failed to bulk insert records', error);
          // Mark all remaining records as failed
          const remainingCount = validRecords.length - (successCount + failureCount);
          if (remainingCount > 0) {
            for (let i = successCount + failureCount; i < validRecords.length; i++) {
              failureCount++;
              errors.push({
                row: i + 2,
                errors: ['批量插入失败：系统错误'],
              });
            }
          }
          throw error;
        }
      }

      // 5. Generate error report if there are failures
      let errorReportPath: string | undefined;
      const failedRecords: Array<{ row: number; data: Record<string, any>; errors: Array<{ field: string; message: string }> }> = [];
      
      if (errors.length > 0) {
        // Convert errors to failedRecords format
        errors.forEach(error => {
          // Find original row data
          const originalRowIndex = error.row - 2; // Convert back to 0-based index
          const originalData = originalRowIndex >= 0 && originalRowIndex < allData.length 
            ? allData[originalRowIndex] 
            : {};
          
          failedRecords.push({
            row: error.row,
            data: originalData,
            errors: error.errors.map(err => {
              // Parse field:message format
              const colonIndex = err.indexOf(':');
              if (colonIndex > 0) {
                return {
                  field: err.substring(0, colonIndex).trim(),
                  message: err.substring(colonIndex + 1).trim(),
                };
              }
              return {
                field: 'general',
                message: err,
              };
            }),
          });
        });

        try {
          errorReportPath = await this.errorReportGenerator.generateErrorReport(
            job.id!,
            failedRecords,
          );
          this.logger.log(`Error report generated: ${errorReportPath}`);
        } catch (error) {
          this.logger.error('Failed to generate error report', error);
        }
      }

      // 6. Save import history
      if (this.pgPool) {
        try {
          const now = new Date();
          const fileName = await this.interactionsImportService.getFileName(fileId);
          
          // Determine final status
          let finalStatus: 'completed' | 'failed' | 'partial';
          if (failureCount === 0) {
            finalStatus = 'completed';
          } else if (successCount > 0 && failureCount > 0) {
            finalStatus = 'partial';
          } else {
            finalStatus = 'failed';
          }

          // Convert errorDetails to JSONB format
          let errorDetailsJsonb = null;
          if (failedRecords.length > 0) {
            errorDetailsJsonb = JSON.stringify({ errors: failedRecords });
          }

          await this.pgPool.query(
            `INSERT INTO import_history (
              task_id, file_name, file_id, user_id, status, total_records,
              success_count, failure_count, error_report_path, error_details, import_type, started_at, completed_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $12, $12)
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
              job.id!,
              fileName,
              fileId,
              userId,
              finalStatus,
              allData.length,
              successCount,
              failureCount,
              errorReportPath || null,
              errorDetailsJsonb,
              'INTERACTION',
              now,
              now, // completed_at is always set when job completes
            ],
          );
          this.logger.log(`Import history saved for task ${job.id} with status ${finalStatus}`);
        } catch (error) {
          this.logger.error('Failed to save import history', error);
        }
      }

      // 7. Log audit
      try {
        await this.auditService.log({
          action: 'IMPORT_INTERACTIONS',
          entityType: 'INTERACTION',
          entityId: null,
          userId,
          operatorId: userId,
          timestamp: new Date(),
          metadata: {
            totalRecords: allData.length,
            successCount,
            failureCount,
            errorReportPath,
          },
        });
      } catch (error) {
        this.logger.error('Failed to log audit', error);
      }

      this.logger.log(`Import job ${job.id} completed: ${successCount} success, ${failureCount} failed`);

      return {
        success: failureCount === 0,
        totalRecords: allData.length,
        successRecords: successCount,
        failedRecords: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(`Import job ${job.id} failed`, error);
      throw error;
    }
  }
}

