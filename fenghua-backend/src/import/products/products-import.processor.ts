/**
 * Products Import Processor
 * 
 * Processes product import jobs using BullMQ
 * All custom code is proprietary and not open source.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { ProductsImportService } from './products-import.service';
import { ProductsService } from '../../products/products.service';
import { ProductValidationService } from './services/validation.service';
import { ProductCategoriesService } from '../../product-categories/product-categories.service';
import { ErrorReportGeneratorService } from '../customers/services/error-report-generator.service';
import { AuditService } from '../../audit/audit.service';
import { ColumnMappingDto } from '../customers/dto/mapping-preview.dto';
import { CreateProductDto } from '../../products/dto/create-product.dto';

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

@Processor('product-import-queue')
@Injectable()
export class ProductsImportProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(ProductsImportProcessor.name);
  private readonly BATCH_SIZE = 100; // Process 100 records per batch
  private pgPool: Pool | null = null; // Dedicated pool for processor transactions

  constructor(
    private readonly configService: ConfigService,
    private readonly productsImportService: ProductsImportService,
    private readonly productsService: ProductsService,
    private readonly validationService: ProductValidationService,
    private readonly productCategoriesService: ProductCategoriesService,
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
        max: 5, // Smaller pool for processor
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductsImportProcessor');
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
      this.logger.log('PostgreSQL connection pool closed for ProductsImportProcessor');
    }
  }

  async process(job: Job<ImportJobData, ImportJobResult>): Promise<ImportJobResult> {
    const { fileId, columnMappings, userId, token } = job.data;

    this.logger.log(`Processing import job ${job.id} for file ${fileId}`);

    let allData: any[] = [];
    try {
      // 1. Parse file
      const filePath = await this.productsImportService.getFilePath(fileId);
      const parser = this.productsImportService.getParser(filePath);
      allData = await parser.parseFile(filePath);

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ row: number; field: string; message: string }> = [];
      const validRecords: CreateProductDto[] = [];

      // 2. Batch load all product categories (optimization: 1 query instead of N)
      const allCategories = await this.productCategoriesService.findAll();
      const categorySet = new Set(allCategories.map(cat => cat.name.toLowerCase()));
      this.logger.log(`Loaded ${allCategories.length} product categories for validation`);

      // 3. Collect all records for batch duplicate check
      const recordsForDuplicateCheck: Array<{ hsCode: string; name: string; originalIndex: number }> = [];
      const transformedDataMap = new Map<number, Record<string, any>>(); // Store transformed data by original index

      // 4. Validate and transform all records (with batch optimizations)
      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];
        const rowNumber = i + 2; // Excel row number (1-based, +1 for header)

        // Transform row data using mappings
        const transformedData = this.productsImportService.transformRowData(row, columnMappings);
        transformedDataMap.set(i, transformedData); // Store transformed data

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
          // Validate category exists (using pre-loaded categorySet)
          const category = transformedData.category;
          if (category && typeof category === 'string') {
            if (!categorySet.has(category.trim().toLowerCase())) {
              failureCount++;
              errors.push({
                row: rowNumber,
                field: 'category',
                message: `产品类别"${category}"不存在于数据库中`,
              });
              continue; // Skip duplicate check for invalid category
            }
          }

          // Only add to duplicate check if hsCode and name are valid
          if (transformedData.hsCode && typeof transformedData.hsCode === 'string' && transformedData.hsCode.trim().length > 0 &&
              transformedData.name && typeof transformedData.name === 'string' && transformedData.name.trim().length > 0) {
            recordsForDuplicateCheck.push({
              hsCode: transformedData.hsCode,
              name: transformedData.name,
              originalIndex: i,
            });
          }

          validRecords.push(validationResult.cleanedData as CreateProductDto);
        }

        // Update progress
        const progress = Math.round(((i + 1) / allData.length) * 100);
        await job.updateProgress(progress);
      }

      // 5. Perform batch duplicate check
      const duplicateCheckResults = await this.checkDuplicatesBatch(recordsForDuplicateCheck, userId);
      this.logger.log(`Batch duplicate check completed for ${recordsForDuplicateCheck.length} records`);

      // 6. Filter out duplicates from validRecords
      const finalValidRecords: CreateProductDto[] = [];
      const validRecordToRowMap = new Map<number, number>(); // Map validRecord index to original row number
      let validIndex = 0;

      for (let i = 0; i < allData.length; i++) {
        const transformedData = transformedDataMap.get(i);
        if (!transformedData) continue;

        const recordKey = `${transformedData.hsCode}|${transformedData.name}`;
        const duplicateInfo = duplicateCheckResults.get(recordKey);

        if (duplicateInfo?.exists) {
          failureCount++;
          errors.push({
            row: i + 2,
            field: 'hsCode',
            message: `产品已存在（HS编码: ${transformedData.hsCode}，名称: ${transformedData.name}）`,
          });
        } else {
          // Find matching valid record
          const matchingValidRecord = validRecords.find(
            r => r.hsCode === transformedData.hsCode && r.name === transformedData.name
          );
          if (matchingValidRecord) {
            finalValidRecords.push(matchingValidRecord);
            validRecordToRowMap.set(validIndex, i + 2);
            validIndex++;
          }
        }
      }

      // 7. Bulk insert valid records in batches with SAVEPOINT for partial success
      const failedRecords: Array<{ row: number; data: Record<string, any>; errors: Array<{ field: string; message: string }> }> = [];

      if (this.pgPool && finalValidRecords.length > 0) {
        const client = await this.pgPool.connect();
        try {
          await client.query('BEGIN');

          for (let i = 0; i < finalValidRecords.length; i++) {
            const record = finalValidRecords[i];
            const rowNumber = validRecordToRowMap.get(i) || (i + 2); // Get original row number or use fallback

            // Create savepoint for each record
            const savepointName = `sp_record_${i}`;
            await client.query(`SAVEPOINT ${savepointName}`);

            try {
              // Validate category exists (double-check using pre-loaded categorySet)
              const category = record.category;
              if (category && typeof category === 'string') {
                if (!categorySet.has(category.trim().toLowerCase())) {
                  throw new Error(`产品类别"${category}"不存在于数据库中`);
                }
              }

              // Validate userId format
              let validUserId: string | null = userId;
              if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
                validUserId = null;
              }

              // Insert product
              await client.query(
                `INSERT INTO products (
                  name, hs_code, description, category, status, specifications, image_url, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  record.name,
                  record.hsCode,
                  record.description || null,
                  record.category,
                  'active',
                  record.specifications ? JSON.stringify(record.specifications) : null,
                  record.imageUrl || null,
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
              
              // Enhanced error handling with detailed error classification
              let errorMessage = '批量插入失败';
              let errorField = 'bulk_insert';
              
              if (error instanceof Error) {
                errorMessage = error.message;
                
                // Classify error types for better logging
                if (error.message.includes('duplicate') || error.message.includes('唯一')) {
                  errorField = 'duplicate';
                  this.logger.warn(`Duplicate product detected at row ${rowNumber}: ${error.message}`);
                } else if (error.message.includes('category') || error.message.includes('类别')) {
                  errorField = 'category';
                  this.logger.warn(`Invalid category at row ${rowNumber}: ${error.message}`);
                } else if (error.message.includes('foreign key') || error.message.includes('外键')) {
                  errorField = 'foreign_key';
                  this.logger.warn(`Foreign key constraint violation at row ${rowNumber}: ${error.message}`);
                } else {
                  this.logger.error(`Database error at row ${rowNumber}: ${error.message}`, error.stack);
                }
              } else {
                this.logger.error(`Unknown error at row ${rowNumber}`, error);
              }
              
              errors.push({
                row: rowNumber,
                field: errorField,
                message: errorMessage,
              });
              failedRecords.push({
                row: rowNumber,
                data: record as any,
                errors: [{ field: errorField, message: errorMessage }],
              });
            }

            // Update progress
            const progress = Math.round(((i + 1) / finalValidRecords.length) * 100);
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
        // Fallback to ProductsService.bulkCreate if no pool (no SAVEPOINT support)
        this.logger.warn('pgPool not available, cannot use SAVEPOINT. Falling back to bulkCreate.');
        try {
          await this.productsService.bulkCreate(finalValidRecords, userId, token);
          successCount += finalValidRecords.length;
        } catch (error) {
          this.logger.error('Failed to bulk create products', error);
          failureCount += finalValidRecords.length;
          
          // Enhanced error handling for fallback path
          const errorMessage = error instanceof Error ? error.message : '批量插入失败';
          finalValidRecords.forEach((record, index) => {
            const rowNumber = validRecordToRowMap.get(index) || (index + 2);
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
          });
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
      const fileName = await this.productsImportService.getFileName(fileId);
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
          action: 'IMPORT_PRODUCTS',
          entityType: 'PRODUCT',
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
        const fileName = await this.productsImportService.getFileName(fileId);
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
          [],
        );
      } catch (historyError) {
        this.logger.error('Failed to save import history for failed job', historyError);
      }

      throw error;
    }
  }

  /**
   * Batch check for duplicate products (optimized for large imports)
   * Returns a Map with hsCode/name as key and duplicate info as value
   */
  private async checkDuplicatesBatch(
    records: Array<{ hsCode: string; name: string }>,
    userId: string,
  ): Promise<Map<string, { exists: boolean; productId?: string; productName?: string }>> {
    const resultMap = new Map<string, { exists: boolean; productId?: string; productName?: string }>();

    if (!this.pgPool || records.length === 0) {
      // Initialize all as non-duplicates
      records.forEach(record => {
        const key = `${record.hsCode}|${record.name}`;
        resultMap.set(key, { exists: false });
      });
      return resultMap;
    }

    try {
      // Extract unique HS codes and names
      const hsCodes = Array.from(new Set(records.map(r => r.hsCode.trim())));
      const names = Array.from(new Set(records.map(r => r.name.trim().toLowerCase())));

      // Batch check by HS codes (considering created_by)
      if (hsCodes.length > 0) {
        // Validate userId format
        let validUserId: string | null = userId;
        if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          validUserId = null;
        }

        const hsCodeQuery = `
          SELECT id, name, hs_code
          FROM products
          WHERE hs_code = ANY($1::text[])
          AND created_by ${validUserId ? '= $2' : 'IS NULL'}
          AND deleted_at IS NULL
        `;
        const params = validUserId ? [hsCodes, validUserId] : [hsCodes];
        const hsCodeResult = await this.pgPool.query(hsCodeQuery, params);

        // Build map of HS code -> product info
        const hsCodeMap = new Map<string, { id: string; name: string }>();
        hsCodeResult.rows.forEach(row => {
          hsCodeMap.set(row.hs_code, { id: row.id, name: row.name });
        });

        // Check each record against the map
        records.forEach(record => {
          const duplicate = hsCodeMap.get(record.hsCode.trim());
          if (duplicate) {
            const key = `${record.hsCode}|${record.name}`;
            resultMap.set(key, {
              exists: true,
              productId: duplicate.id,
              productName: duplicate.name,
            });
          }
        });
      }

      // Batch check by names (considering created_by, only if not already found by HS code)
      if (names.length > 0) {
        // Validate userId format
        let validUserId: string | null = userId;
        if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          validUserId = null;
        }

        const nameQuery = `
          SELECT id, name, LOWER(TRIM(name)) as normalized_name
          FROM products
          WHERE LOWER(TRIM(name)) = ANY($1::text[])
          AND created_by ${validUserId ? '= $2' : 'IS NULL'}
          AND deleted_at IS NULL
        `;
        const params = validUserId ? [names, validUserId] : [names];
        const nameResult = await this.pgPool.query(nameQuery, params);

        // Build map of normalized name -> product info
        const nameMap = new Map<string, { id: string; name: string }>();
        nameResult.rows.forEach(row => {
          nameMap.set(row.normalized_name, { id: row.id, name: row.name });
        });

        // Check each record against the map (only if not already found by HS code)
        records.forEach(record => {
          const key = `${record.hsCode}|${record.name}`;
          if (!resultMap.has(key) || !resultMap.get(key)?.exists) {
            const normalizedName = record.name.trim().toLowerCase();
            const duplicate = nameMap.get(normalizedName);
            if (duplicate) {
              resultMap.set(key, {
                exists: true,
                productId: duplicate.id,
                productName: duplicate.name,
              });
            } else if (!resultMap.has(key)) {
              resultMap.set(key, { exists: false });
            }
          }
        });
      }

      // Initialize any remaining records as non-duplicates
      records.forEach(record => {
        const key = `${record.hsCode}|${record.name}`;
        if (!resultMap.has(key)) {
          resultMap.set(key, { exists: false });
        }
      });

      return resultMap;
    } catch (error) {
      this.logger.error('Failed to batch check duplicates', error);
      // On error, initialize all as non-duplicates
      records.forEach(record => {
        const key = `${record.hsCode}|${record.name}`;
        resultMap.set(key, { exists: false });
      });
      return resultMap;
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
      this.logger.warn('pgPool not initialized, cannot save import history.');
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

      const query = `
        INSERT INTO import_history (
          task_id, file_name, file_id, user_id, status, total_records,
          success_count, failure_count, error_report_path, error_details, import_type, started_at, completed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PRODUCT', $11, $12, $11, $11)
        ON CONFLICT (task_id) DO UPDATE SET
          status = EXCLUDED.status,
          total_records = EXCLUDED.total_records,
          success_count = EXCLUDED.success_count,
          failure_count = EXCLUDED.failure_count,
          error_report_path = EXCLUDED.error_report_path,
          error_details = EXCLUDED.error_details,
          completed_at = EXCLUDED.completed_at,
          updated_at = EXCLUDED.updated_at
      `;
      await this.pgPool.query(query, [
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
        now,
        finalStatus === 'processing' ? null : now,
      ]);
      this.logger.log(`Import history saved for task ${taskId} with status ${finalStatus}`);
    } catch (error) {
      this.logger.error(`Failed to save import history for task ${taskId}`, error);
    }
  }
}

