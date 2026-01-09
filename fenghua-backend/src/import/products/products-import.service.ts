/**
 * Products Import Service
 * 
 * Handles product data import operations
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { ExcelParserService } from '../customers/services/excel-parser.service';
import { CsvParserService } from '../customers/services/csv-parser.service';
import { ProductMappingService } from './services/mapping.service';
import { ProductValidationService } from './services/validation.service';
import { ProductCategoriesService } from '../../product-categories/product-categories.service';
import { UploadFileResponseDto } from '../customers/dto/upload-file.dto';
import { MappingPreviewResponseDto, ColumnMappingDto } from '../customers/dto/mapping-preview.dto';
import { ValidationResultDto, ValidationErrorDetailDto, DataCleaningSuggestionDto, DuplicateDetectionDto } from '../customers/dto/validation-result.dto';
import { ImportResultDto } from '../customers/dto/import-result.dto';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { ImportJobData, ImportJobResult } from './products-import.processor';

const VALIDATION_BATCH_SIZE = 1000; // Process 1000 records at a time for validation

@Injectable()
export class ProductsImportService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductsImportService.name);
  private pgPool: Pool | null = null;
  private readonly tempDir: string;
  private readonly fileMetadata: Map<string, { fileName: string; tempFilePath: string }> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly excelParserService: ExcelParserService,
    private readonly csvParserService: CsvParserService,
    private readonly mappingService: ProductMappingService,
    private readonly validationService: ProductValidationService,
    private readonly productCategoriesService: ProductCategoriesService,
    @InjectQueue('product-import-queue') private readonly importQueue: Queue<ImportJobData, ImportJobResult>,
  ) {
    this.initializeDatabaseConnection();
    this.tempDir = this.configService.get<string>('IMPORT_TEMP_DIR', '/tmp/imports');
    this.ensureTempDirExists();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, import operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductsImportService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Ensure temporary directory exists
   */
  private ensureTempDirExists(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      this.logger.log(`Created import temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Cleanup database connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for ProductsImportService');
    }
  }

  /**
   * Validate file format and size
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`);
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException('不支持的文件格式，仅支持 CSV、XLSX 和 XLS 格式');
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
  }

  /**
   * Upload and save file temporarily
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadFileResponseDto> {
    this.validateFile(file);

    // Generate unique file ID
    const fileId = randomUUID();
    const ext = path.extname(file.originalname);
    const tempFileName = `${fileId}${ext}`;
    const tempFilePath = path.join(this.tempDir, tempFileName);

    // Save file to temp directory
    fs.writeFileSync(tempFilePath, file.buffer);

    // Store file metadata
    this.fileMetadata.set(fileId, {
      fileName: file.originalname,
      tempFilePath,
    });

    this.logger.log(`File uploaded temporarily: ${tempFilePath}`);

    return {
      fileId,
      fileName: file.originalname,
      tempFilePath,
    };
  }

  /**
   * Helper to find a temporary file by its fileId.
   * Throws BadRequestException if file not found or expired.
   */
  private findFileByFileId(fileId: string): string {
    const metadata = this.fileMetadata.get(fileId);
    if (metadata && fs.existsSync(metadata.tempFilePath)) {
      return metadata.tempFilePath;
    }

    // Fallback to scanning directory if metadata is lost or service restarted
    const files = fs.readdirSync(this.tempDir).filter(f => f.startsWith(fileId));
    if (files.length === 0) {
      throw new BadRequestException('文件不存在或已过期');
    }
    const filePath = path.join(this.tempDir, files[0]);
    // If found by scanning, update metadata for future quick access
    if (!metadata) {
      this.fileMetadata.set(fileId, { fileName: files[0], tempFilePath: filePath });
    }
    return filePath;
  }

  /**
   * Get file path from fileId
   */
  async getFilePath(fileId: string): Promise<string> {
    return this.findFileByFileId(fileId);
  }

  /**
   * Get original file name from fileId
   */
  async getFileName(fileId: string): Promise<string> {
    const metadata = this.fileMetadata.get(fileId);
    if (metadata) {
      return metadata.fileName;
    }

    // Fallback: try to get from file system if metadata is lost
    try {
      const filePath = this.findFileByFileId(fileId);
      const fileName = path.basename(filePath);
      // Attempt to extract original name if possible, otherwise use the temp file name
      return fileName.replace(fileId, '').replace(/^[-_]/, '') || fileName;
    } catch (error) {
      this.logger.warn(`Could not retrieve original file name for ${fileId}: ${error.message}`);
      return `import-${fileId}`; // Default fallback name
    }
  }

  /**
   * Get file parser based on extension
   */
  getParser(filePath: string): ExcelParserService | CsvParserService {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.csv') {
      return this.csvParserService;
    } else {
      return this.excelParserService;
    }
  }

  /**
   * Transform row data using column mappings
   */
  transformRowData(
    row: Record<string, any>,
    columnMappings: ColumnMappingDto[],
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    for (const mapping of columnMappings) {
      if (mapping.crmField && row[mapping.excelColumn] !== undefined) {
        transformed[mapping.crmField] = row[mapping.excelColumn];
      }
    }

    return transformed;
  }

  /**
   * Validate custom mappings
   */
  private validateCustomMappings(customMappings: ColumnMappingDto[]): void {
    const validFields = [
      'name', 'hsCode', 'category', 'description', 'specifications', 'imageUrl',
    ];

    for (const mapping of customMappings) {
      if (mapping.crmField && !validFields.includes(mapping.crmField)) {
        throw new BadRequestException(
          `无效的 CRM 字段: ${mapping.crmField}。有效字段: ${validFields.join(', ')}`,
        );
      }
    }
  }

  /**
   * Get mapping preview
   */
  async getMappingPreview(
    fileId: string,
    customMappings?: ColumnMappingDto[],
  ): Promise<MappingPreviewResponseDto> {
    // Validate custom mappings if provided
    if (customMappings && customMappings.length > 0) {
      this.validateCustomMappings(customMappings);
    }

    // Find file by fileId
    const filePath = this.findFileByFileId(fileId);
    const parser = this.getParser(filePath);

    // Get columns
    const columns = await parser.getColumns(filePath);

    // Auto-map columns
    const autoMapping = this.mappingService.autoMapColumns(columns);

    // Build column mappings
    const columnMappings: ColumnMappingDto[] = columns.map(col => {
      const customMapping = customMappings?.find(m => m.excelColumn === col);
      if (customMapping) {
        return customMapping;
      }

      const mappedField = autoMapping.get(col);
      return {
        excelColumn: col,
        crmField: mappedField,
        suggestedField: mappedField,
      };
    });

    // Parse sample data (first 10 rows)
    const allData = await parser.parseFile(filePath);
    const sampleData = allData.slice(0, 10);

    return {
      columns: columnMappings,
      sampleData,
      statistics: {
        totalRows: allData.length,
        validRows: 0, // Will be calculated during validation
        invalidRows: 0,
      },
    };
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
        const hsCodeQuery = `
          SELECT id, name, hs_code
          FROM products
          WHERE hs_code = ANY($1::text[])
          AND created_by = $2
          AND deleted_at IS NULL
        `;
        const hsCodeResult = await this.pgPool.query(hsCodeQuery, [hsCodes, userId]);

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
        const nameQuery = `
          SELECT id, name, LOWER(TRIM(name)) as normalized_name
          FROM products
          WHERE LOWER(TRIM(name)) = ANY($1::text[])
          AND created_by = $2
          AND deleted_at IS NULL
        `;
        const nameResult = await this.pgPool.query(nameQuery, [names, userId]);

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
   * Validate import data
   */
  async validateImportData(
    fileId: string,
    columnMappings: ColumnMappingDto[],
    userId: string,
    token: string,
  ): Promise<ValidationResultDto> {
    // Find file
    const filePath = this.findFileByFileId(fileId);
    const parser = this.getParser(filePath);

    // Parse all data
    const allData = await parser.parseFile(filePath);

    const errors: ValidationErrorDetailDto[] = [];
    const cleaningSuggestions: DataCleaningSuggestionDto[] = [];
    const duplicates: DuplicateDetectionDto[] = [];
    let validRecordsCount = 0;

    // Step 1: Batch load all product categories (optimization: 1 query instead of N)
    const allCategories = await this.productCategoriesService.findAll();
    const categorySet = new Set(allCategories.map(cat => cat.name.toLowerCase()));

    // Step 2: Collect all records for batch duplicate check
    const recordsForDuplicateCheck: Array<{ hsCode: string; name: string; originalIndex: number }> = [];
    const transformedDataMap = new Map<number, Record<string, any>>(); // Store transformed data by original index

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      const transformedData = this.transformRowData(row, columnMappings);
      transformedDataMap.set(i, transformedData); // Store transformed data

      // Only add to duplicate check if hsCode and name are valid
      if (transformedData.hsCode && typeof transformedData.hsCode === 'string' && transformedData.hsCode.trim().length > 0 &&
          transformedData.name && typeof transformedData.name === 'string' && transformedData.name.trim().length > 0) {
        recordsForDuplicateCheck.push({
          hsCode: transformedData.hsCode,
          name: transformedData.name,
          originalIndex: i,
        });
      }
    }

    // Step 3: Perform batch duplicate check
    const duplicateCheckResults = await this.checkDuplicatesBatch(recordsForDuplicateCheck, userId);

    // Step 4: Process each record in batches for validation and populate results
    for (let i = 0; i < allData.length; i += VALIDATION_BATCH_SIZE) {
      const batch = allData.slice(i, i + VALIDATION_BATCH_SIZE);
      this.logger.log(`Processing validation batch ${Math.floor(i / VALIDATION_BATCH_SIZE) + 1}/${Math.ceil(allData.length / VALIDATION_BATCH_SIZE)}`);

      for (let j = 0; j < batch.length; j++) {
        const originalIndex = i + j;
        const row = batch[j];
        const rowNumber = originalIndex + 2; // Excel row number (1-based, +1 for header)
        const transformedData = transformedDataMap.get(originalIndex)!; // Retrieve transformed data

        // Validate record
        const validationResult = this.validationService.validateRecord(transformedData, rowNumber);

        // Generate cleaning suggestions
        const suggestions = this.validationService.generateCleaningSuggestions(transformedData, rowNumber);
        if (suggestions.length > 0) {
          cleaningSuggestions.push(
            ...suggestions.map(s => ({
              row: rowNumber,
              field: s.field,
              originalValue: String(s.originalValue),
              suggestedValue: String(s.suggestedValue),
              reason: s.reason,
            })),
          );
        }

        if (!validationResult.isValid) {
          errors.push({
            row: rowNumber,
            errors: validationResult.errors.map(e => `${e.field}: ${e.message}`),
            data: transformedData,
          });
        } else {
          // Validate category exists (using pre-loaded categorySet)
          const category = transformedData.category;
          if (category && typeof category === 'string') {
            if (!categorySet.has(category.trim().toLowerCase())) {
              errors.push({
                row: rowNumber,
                errors: [`category: 产品类别"${category}"不存在于数据库中`],
                data: transformedData,
              });
              continue; // Skip duplicate check for invalid category
            }
          }

          // Check for duplicates using the batch results
          const recordKey = `${transformedData.hsCode}|${transformedData.name}`;
          const duplicateInfo = duplicateCheckResults.get(recordKey);

          if (duplicateInfo?.exists) {
            duplicates.push({
              row: rowNumber,
              field: 'hsCode', // Assuming HS code is the primary field for duplicate detection
              value: transformedData.hsCode,
              existingCustomerId: duplicateInfo.productId, // Reusing DTO field name
              existingCustomerName: duplicateInfo.productName, // Reusing DTO field name
            });
          } else {
            validRecordsCount++;
          }
        }
      }
    }

    return {
      totalRecords: allData.length,
      validRecords: validRecordsCount,
      invalidRecords: errors.length + duplicates.length,
      errors: errors.length > 0 ? errors : undefined,
      cleaningSuggestions: cleaningSuggestions.length > 0 ? cleaningSuggestions : undefined,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      hasErrors: errors.length > 0,
      hasDuplicates: duplicates.length > 0,
      hasCleaningSuggestions: cleaningSuggestions.length > 0,
    };
  }

  /**
   * Start a product import task
   */
  async startImportTask(
    fileId: string,
    columnMappings: ColumnMappingDto[],
    userId: string,
    token: string,
  ): Promise<{ taskId: string }> {
    // Verify file exists
    this.findFileByFileId(fileId); // This will throw if file is not found

    // Add job to queue
    const job = await this.importQueue.add(
      'import-products',
      {
        fileId,
        columnMappings,
        userId,
        token,
      } as ImportJobData,
      {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds delay
        },
      },
    );

    this.logger.log(`Import task created: ${job.id} for file ${fileId}`);

    return { taskId: job.id! };
  }

  /**
   * Get import task status
   */
  async getImportTaskStatus(taskId: string): Promise<ImportResultDto> {
    const job = await this.importQueue.getJob(taskId);

    if (!job) {
      throw new BadRequestException('导入任务不存在');
    }

    const state = await job.getState();
    const progress = job.progress as number | undefined;
    const result = job.returnvalue as ImportJobResult | undefined;
    const failedReason = job.failedReason;

    let status: 'processing' | 'completed' | 'failed';
    if (state === 'completed') {
      status = 'completed';
    } else if (state === 'failed') {
      status = 'failed';
    } else {
      status = 'processing';
    }

    // Get error report path from import history
    let errorReportUrl: string | undefined;
    if (status === 'completed' || status === 'failed') {
      try {
        const history = await this.getImportHistoryByTaskId(taskId);
        if (history && history.error_report_path) {
          // Generate download URL
          const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3001');
          errorReportUrl = `${baseUrl}/api/import/products/reports/${taskId}`;
        }
      } catch (error) {
        this.logger.warn('Failed to get error report URL', error);
      }
    }

    const importResult: ImportResultDto = {
      taskId,
      status,
      totalRecords: result?.totalRecords || 0,
      successCount: result?.successCount || 0,
      failureCount: result?.failureCount || 0,
      progress: progress !== undefined ? Number(progress) : undefined,
      errorReportUrl,
      errors: result?.errors?.map(e => ({
        row: e.row,
        field: e.field,
        message: e.message,
      })),
    };

    if (failedReason) {
      importResult.errors = [
        ...(importResult.errors || []),
        {
          row: 0,
          field: 'system',
          message: failedReason,
        },
      ];
    }

    return importResult;
  }

  /**
   * Get import history by task ID
   */
  private async getImportHistoryByTaskId(taskId: string): Promise<any | null> {
    if (!this.pgPool) {
      return null;
    }

    try {
      const result = await this.pgPool.query(
        `SELECT * FROM import_history WHERE task_id = $1 AND deleted_at IS NULL LIMIT 1`,
        [taskId],
      );
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Failed to get import history by task ID', error);
      return null;
    }
  }

  /**
   * Get error report file path
   */
  async getErrorReportPath(taskId: string): Promise<string | null> {
    if (!this.pgPool) {
      return null;
    }

    try {
      const result = await this.pgPool.query(
        `SELECT error_report_path FROM import_history WHERE task_id = $1 AND deleted_at IS NULL LIMIT 1`,
        [taskId],
      );
      return result.rows[0]?.error_report_path || null;
    } catch (error) {
      this.logger.error('Failed to get error report path', error);
      return null;
    }
  }

  /**
   * Get paginated import history
   */
  async getImportHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    status?: 'processing' | 'completed' | 'failed',
  ): Promise<{ items: any[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Build query
      let query = `
        SELECT id, task_id, file_name, status, total_records, success_count, failure_count,
               error_report_path, started_at, completed_at
        FROM import_history
        WHERE user_id = $1 AND deleted_at IS NULL AND import_type = 'PRODUCT'
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.pgPool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM import_history
        WHERE user_id = $1 AND deleted_at IS NULL AND import_type = 'PRODUCT'
      `;
      const countParams: any[] = [userId];

      if (status) {
        countQuery += ` AND status = $2`;
        countParams.push(status);
      }

      const countResult = await this.pgPool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total, 10);

      return {
        items: result.rows.map(row => ({
          id: row.id,
          taskId: row.task_id,
          fileName: row.file_name,
          status: row.status,
          totalRecords: row.total_records,
          successCount: row.success_count,
          failureCount: row.failure_count,
          errorReportPath: row.error_report_path,
          startedAt: row.started_at,
          completedAt: row.completed_at,
        })),
        total,
      };
    } catch (error) {
      this.logger.error('Failed to get import history', error);
      throw new BadRequestException('获取导入历史失败');
    }
  }

  /**
   * Clean up temporary file
   */
  async cleanupTempFile(fileId: string): Promise<void> {
    try {
      const filePath = this.findFileByFileId(fileId);
      fs.unlinkSync(filePath);
      this.fileMetadata.delete(fileId); // Remove from metadata map
      this.logger.log(`Cleaned up temp file: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup temp file ${fileId}: ${error.message}`);
    }
  }
}


