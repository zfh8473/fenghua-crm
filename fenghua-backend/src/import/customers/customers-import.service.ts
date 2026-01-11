/**
 * Customers Import Service
 * 
 * Handles customer data import operations
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
import * as XLSX from 'xlsx';
import * as redis from 'redis';
import { ExcelParserService } from './services/excel-parser.service';
import { CsvParserService } from './services/csv-parser.service';
import { MappingService } from './services/mapping.service';
import { ValidationService } from './services/validation.service';
import { UploadFileResponseDto } from './dto/upload-file.dto';
import { MappingPreviewResponseDto, ColumnMappingDto } from './dto/mapping-preview.dto';
import { ValidationResultDto, ValidationErrorDetailDto, DataCleaningSuggestionDto, DuplicateDetectionDto } from './dto/validation-result.dto';
import { ImportResultDto } from './dto/import-result.dto';
import { CreateCustomerDto } from '../../companies/dto/create-customer.dto';
import { ImportJobData, ImportJobResult } from './customers-import.processor';

@Injectable()
export class CustomersImportService implements OnModuleDestroy {
  private readonly logger = new Logger(CustomersImportService.name);
  private pgPool: Pool | null = null;
  private redisClient: redis.RedisClientType | null = null;
  private redisEnabled = false;
  private readonly tempDir: string;
  private readonly fileMetadata: Map<string, { fileName: string; uploadedAt: Date }> = new Map();
  private readonly VALIDATION_BATCH_SIZE = 1000; // Process 1000 records at a time for validation

  constructor(
    private readonly configService: ConfigService,
    private readonly excelParserService: ExcelParserService,
    private readonly csvParserService: CsvParserService,
    private readonly mappingService: MappingService,
    private readonly validationService: ValidationService,
    @InjectQueue('customer-import-queue') private readonly importQueue: Queue<ImportJobData, ImportJobResult>,
  ) {
    this.initializeDatabaseConnection();
    this.initializeRedisConnection();
    this.tempDir = this.configService.get<string>('IMPORT_TEMP_DIR', '/tmp/imports');
    this.ensureTempDirExists();
  }

  /**
   * Initialize Redis connection (optional, for caching)
   */
  private initializeRedisConnection(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.debug('REDIS_URL not configured, error details caching will be disabled');
      return;
    }

    this.redisEnabled = true;
    try {
      this.redisClient = redis.createClient({
        url: redisUrl,
      });
      this.redisClient.on('error', (error) => {
        this.logger.warn('Redis client error', error);
        this.redisEnabled = false;
      });
      this.redisClient.connect().catch((error) => {
        this.logger.warn('Redis connection failed, caching disabled', error);
        this.redisEnabled = false;
      });
      this.logger.log('Redis client initialized for error details caching');
    } catch (error) {
      this.logger.warn('Failed to initialize Redis client, caching disabled', error);
      this.redisEnabled = false;
    }
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
      this.logger.log('PostgreSQL connection pool initialized for CustomersImportService');
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
      this.logger.log('PostgreSQL connection pool closed for CustomersImportService');
    }
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis client disconnected');
      } catch (error) {
        this.logger.warn('Error disconnecting Redis client', error);
      }
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
      uploadedAt: new Date(),
    });

    this.logger.log(`File uploaded temporarily: ${tempFilePath}`);

    return {
      fileId,
      fileName: file.originalname,
      tempFilePath,
    };
  }

  /**
   * Find file by fileId (private helper method)
   */
  private findFileByFileId(fileId: string): string {
    const files = fs.readdirSync(this.tempDir).filter(f => f.startsWith(fileId));
    if (files.length === 0) {
      throw new BadRequestException('文件不存在或已过期');
    }
    return path.join(this.tempDir, files[0]);
  }

  /**
   * Get file path by fileId
   */
  async getFilePath(fileId: string): Promise<string> {
    return this.findFileByFileId(fileId);
  }

  /**
   * Get file name by fileId (stored in memory or from file metadata)
   */
  async getFileName(fileId: string): Promise<string> {
    // Try to get from stored metadata
    const metadata = this.fileMetadata.get(fileId);
    if (metadata) {
      return metadata.fileName;
    }

    // Fallback: try to get from file system
    try {
      const filePath = this.findFileByFileId(fileId);
      const fileName = path.basename(filePath);
      // Extract original name from file if possible, otherwise use fileId
      return fileName.replace(fileId, '').replace(/^[-_]/, '') || `import-${fileId}`;
    } catch {
      return `import-${fileId}`;
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
   * Transform row data using column mappings (public for processor)
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
      'name', 'customerCode', 'customerType', 'domainName', 'address',
      'city', 'state', 'country', 'postalCode', 'industry', 'employees',
      'website', 'phone', 'email', 'notes',
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
   * Check for duplicate customers (single record)
   */
  private async checkDuplicates(
    name: string,
    customerCode?: string,
  ): Promise<{ exists: boolean; customerId?: string; customerName?: string }> {
    if (!this.pgPool) {
      return { exists: false };
    }

    try {
      // Check by name (case-insensitive, exclude soft-deleted)
      const nameQuery = `
        SELECT id, name
        FROM companies
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        AND deleted_at IS NULL
        LIMIT 1
      `;
      const nameResult = await this.pgPool.query(nameQuery, [name]);

      if (nameResult.rows.length > 0) {
        return {
          exists: true,
          customerId: nameResult.rows[0].id,
          customerName: nameResult.rows[0].name,
        };
      }

      // Check by customerCode if provided
      if (customerCode) {
        const codeQuery = `
          SELECT id, name
          FROM companies
          WHERE customer_code = $1
          AND deleted_at IS NULL
          LIMIT 1
        `;
        const codeResult = await this.pgPool.query(codeQuery, [customerCode]);

        if (codeResult.rows.length > 0) {
          return {
            exists: true,
            customerId: codeResult.rows[0].id,
            customerName: codeResult.rows[0].name,
          };
        }
      }

      return { exists: false };
    } catch (error) {
      this.logger.error('Failed to check duplicates', error);
      return { exists: false };
    }
  }

  /**
   * Batch check for duplicate customers (optimized for large imports)
   * Returns a Map with name/code as key and duplicate info as value
   */
  private async checkDuplicatesBatch(
    records: Array<{ name: string; customerCode?: string }>,
  ): Promise<Map<string, { exists: boolean; customerId?: string; customerName?: string }>> {
    const resultMap = new Map<string, { exists: boolean; customerId?: string; customerName?: string }>();

    if (!this.pgPool || records.length === 0) {
      // Initialize all as non-duplicates
      records.forEach(record => {
        const key = `${record.name}|${record.customerCode || ''}`;
        resultMap.set(key, { exists: false });
      });
      return resultMap;
    }

    try {
      // Extract unique names and customer codes
      const names = Array.from(new Set(records.map(r => r.name.trim().toLowerCase())));
      const customerCodes = Array.from(
        new Set(records.map(r => r.customerCode?.trim()).filter((code): code is string => !!code)),
      );

      // Batch check by names
      if (names.length > 0) {
        const nameQuery = `
          SELECT id, name, LOWER(TRIM(name)) as normalized_name
          FROM companies
          WHERE LOWER(TRIM(name)) = ANY($1::text[])
          AND deleted_at IS NULL
        `;
        const nameResult = await this.pgPool.query(nameQuery, [names]);

        // Build map of normalized name -> customer info
        const nameMap = new Map<string, { id: string; name: string }>();
        nameResult.rows.forEach(row => {
          nameMap.set(row.normalized_name, { id: row.id, name: row.name });
        });

        // Check each record against the map
        records.forEach(record => {
          const normalizedName = record.name.trim().toLowerCase();
          const duplicate = nameMap.get(normalizedName);
          if (duplicate) {
            const key = `${record.name}|${record.customerCode || ''}`;
            resultMap.set(key, {
              exists: true,
              customerId: duplicate.id,
              customerName: duplicate.name,
            });
          }
        });
      }

      // Batch check by customer codes
      if (customerCodes.length > 0) {
        const codeQuery = `
          SELECT id, name, customer_code
          FROM companies
          WHERE customer_code = ANY($1::text[])
          AND deleted_at IS NULL
        `;
        const codeResult = await this.pgPool.query(codeQuery, [customerCodes]);

        // Build map of customer code -> customer info
        const codeMap = new Map<string, { id: string; name: string }>();
        codeResult.rows.forEach(row => {
          codeMap.set(row.customer_code, { id: row.id, name: row.name });
        });

        // Check each record against the map (only if not already found by name)
        records.forEach(record => {
          const key = `${record.name}|${record.customerCode || ''}`;
          if (!resultMap.has(key) || !resultMap.get(key)?.exists) {
            if (record.customerCode) {
              const duplicate = codeMap.get(record.customerCode.trim());
              if (duplicate) {
                resultMap.set(key, {
                  exists: true,
                  customerId: duplicate.id,
                  customerName: duplicate.name,
                });
              } else if (!resultMap.has(key)) {
                resultMap.set(key, { exists: false });
              }
            } else if (!resultMap.has(key)) {
              resultMap.set(key, { exists: false });
            }
          }
        });
      }

      // Initialize any remaining records as non-duplicates
      records.forEach(record => {
        const key = `${record.name}|${record.customerCode || ''}`;
        if (!resultMap.has(key)) {
          resultMap.set(key, { exists: false });
        }
      });

      return resultMap;
    } catch (error) {
      this.logger.error('Failed to batch check duplicates', error);
      // On error, initialize all as non-duplicates
      records.forEach(record => {
        const key = `${record.name}|${record.customerCode || ''}`;
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
    const validRecordsData: Array<{ rowNumber: number; data: CreateCustomerDto }> = [];

    // Step 1: Validate all records and collect valid ones
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      const rowNumber = i + 2; // Excel row number (1-based, +1 for header)

      // Transform row data using mappings
      const transformedData = this.transformRowData(row, columnMappings);

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
        // Store valid record for batch duplicate check
        const cleanedData = validationResult.cleanedData as CreateCustomerDto;
        validRecordsData.push({
          rowNumber,
          data: cleanedData,
        });
      }
    }

    // Step 2: Batch check duplicates for all valid records (optimized)
    if (validRecordsData.length > 0) {
      const recordsToCheck = validRecordsData.map(vr => ({
        name: vr.data.name,
        customerCode: vr.data.customerCode,
      }));

      const duplicateMap = await this.checkDuplicatesBatch(recordsToCheck);

      // Process results
      validRecordsData.forEach(({ rowNumber, data }) => {
        const key = `${data.name}|${data.customerCode || ''}`;
        const duplicateInfo = duplicateMap.get(key);

        if (duplicateInfo?.exists) {
          duplicates.push({
            row: rowNumber,
            field: 'name',
            value: data.name,
            existingCustomerId: duplicateInfo.customerId,
            existingCustomerName: duplicateInfo.customerName,
          });
        }
      });
    }

    const validRecords = validRecordsData.length - duplicates.length;

    return {
      totalRecords: allData.length,
      validRecords,
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
   * Start import task
   */
  async startImportTask(
    fileId: string,
    columnMappings: ColumnMappingDto[],
    userId: string,
    token: string,
  ): Promise<{ taskId: string }> {
    // Verify file exists
    this.findFileByFileId(fileId);

    // Add job to queue
    const job = await this.importQueue.add(
      'import-customers',
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
        if (history && history.errorReportPath) {
          // Generate download URL
          const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3001');
          errorReportUrl = `${baseUrl}/api/import/customers/reports/${taskId}`;
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
   * Get import task detail
   */
  async getImportTaskDetail(taskId: string, userId: string): Promise<any> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT id, task_id, file_name, status, import_type, total_records, success_count, 
                failure_count, error_report_path, error_details, started_at, completed_at
         FROM import_history 
         WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL 
         LIMIT 1`,
        [taskId, userId],
      );

      if (result.rows.length === 0) {
        throw new BadRequestException('导入任务不存在');
      }

      const row = result.rows[0];
      
      // Parse error_details JSONB if exists
      let errorDetails = null;
      if (row.error_details) {
        try {
          const parsed = typeof row.error_details === 'string' 
            ? JSON.parse(row.error_details) 
            : row.error_details;
          
          if (parsed && parsed.errors && Array.isArray(parsed.errors)) {
            errorDetails = parsed.errors;
          }
        } catch (error) {
          this.logger.warn('Failed to parse error_details', error);
        }
      }

      return {
        id: row.id,
        taskId: row.task_id,
        fileName: row.file_name,
        status: row.status,
        importType: row.import_type,
        totalRecords: row.total_records,
        successCount: row.success_count,
        failureCount: row.failure_count,
        errorReportPath: row.error_report_path,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        errorDetails: errorDetails || [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to get import task detail', error);
      throw new BadRequestException('获取导入任务详情失败');
    }
  }

  /**
   * Get error details for an import task
   * Uses PostgreSQL JSONB functions for efficient pagination instead of loading all errors into memory
   * Implements Redis caching for improved performance (optional, falls back if Redis unavailable)
   */
  async getErrorDetails(
    taskId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ items: any[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Try to get from cache first (if Redis is available)
    const cacheKey = `import:errors:${taskId}:${limit}:${offset}`;
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached && typeof cached === 'string') {
          this.logger.debug(`Cache hit for error details: ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.warn('Redis cache read failed, falling back to database', error);
      }
    }

    try {
      // First verify the task belongs to the user and get total count
      const taskResult = await this.pgPool.query(
        `SELECT error_details FROM import_history 
         WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL 
         LIMIT 1`,
        [taskId, userId],
      );

      if (taskResult.rows.length === 0) {
        throw new BadRequestException('导入任务不存在');
      }

      const errorDetailsJsonb = taskResult.rows[0].error_details;
      
      if (!errorDetailsJsonb) {
        return { items: [], total: 0 };
      }

      // Use PostgreSQL JSONB functions for efficient pagination
      // This avoids loading all errors into memory
      // First get total count
      const countResult = await this.pgPool.query(
        `SELECT jsonb_array_length(error_details->'errors') as total
        FROM import_history
        WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL
        LIMIT 1`,
        [taskId, userId],
      );

      const total = countResult.rows.length > 0 
        ? parseInt(countResult.rows[0].total || '0', 10) 
        : 0;

      if (total === 0) {
        return { items: [], total: 0 };
      }

      // Get paginated errors using jsonb_array_elements with LIMIT/OFFSET
      const paginationResult = await this.pgPool.query(
        `SELECT jsonb_array_elements(error_details->'errors') as error_item
        FROM import_history
        WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL
        LIMIT $4 OFFSET $3`,
        [taskId, userId, offset, limit],
      );

      // Convert JSONB results to JavaScript array
      const items = paginationResult.rows.map(row => row.error_item);

      const result = {
        items,
        total,
      };

      // Cache the result (if Redis is available)
      if (this.redisEnabled && this.redisClient) {
        try {
          // Cache for 1 hour (3600 seconds) as error details don't change
          await this.redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
          this.logger.debug(`Cached error details: ${cacheKey}`);
        } catch (error) {
          this.logger.warn('Redis cache write failed, continuing without cache', error);
        }
      }

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to get error details', error);
      
      // Fallback to memory-based pagination if JSONB functions fail
      try {
        const taskResult = await this.pgPool.query(
          `SELECT error_details FROM import_history 
           WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL 
           LIMIT 1`,
          [taskId, userId],
        );

        if (taskResult.rows.length === 0) {
          throw new BadRequestException('导入任务不存在');
        }

        const errorDetailsJsonb = taskResult.rows[0].error_details;
        if (!errorDetailsJsonb) {
          return { items: [], total: 0 };
        }

        const parsed = typeof errorDetailsJsonb === 'string' 
          ? JSON.parse(errorDetailsJsonb) 
          : errorDetailsJsonb;

        if (!parsed || !parsed.errors || !Array.isArray(parsed.errors)) {
          return { items: [], total: 0 };
        }

        const allErrors = parsed.errors;
        const total = allErrors.length;
        const paginatedErrors = allErrors.slice(offset, offset + limit);

        return {
          items: paginatedErrors,
          total,
        };
      } catch (fallbackError) {
        this.logger.error('Fallback pagination also failed', fallbackError);
        throw new BadRequestException('获取错误详情失败');
      }
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
   * Get import history
   */
  async getImportHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    status?: 'processing' | 'completed' | 'failed' | 'partial',
    startDate?: string,
    endDate?: string,
    importType?: 'CUSTOMER' | 'PRODUCT' | 'INTERACTION',
    search?: string,
  ): Promise<{ items: any[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Build query
      let query = `
        SELECT id, task_id, file_name, status, total_records, success_count, failure_count,
               error_report_path, import_type, started_at, completed_at
        FROM import_history
        WHERE user_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (startDate) {
        query += ` AND started_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND started_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (importType) {
        query += ` AND import_type = $${paramIndex}`;
        params.push(importType);
        paramIndex++;
      }

      if (search) {
        query += ` AND (file_name ILIKE $${paramIndex} OR task_id ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ` ORDER BY started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.pgPool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM import_history
        WHERE user_id = $1 AND deleted_at IS NULL
      `;
      const countParams: any[] = [userId];
      let countParamIndex = 2;

      if (status) {
        countQuery += ` AND status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }

      if (startDate) {
        countQuery += ` AND started_at >= $${countParamIndex}`;
        countParams.push(startDate);
        countParamIndex++;
      }

      if (endDate) {
        countQuery += ` AND started_at <= $${countParamIndex}`;
        countParams.push(endDate);
        countParamIndex++;
      }

      if (importType) {
        countQuery += ` AND import_type = $${countParamIndex}`;
        countParams.push(importType);
        countParamIndex++;
      }

      if (search) {
        countQuery += ` AND (file_name ILIKE $${countParamIndex} OR task_id ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
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
          importType: row.import_type,
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
   * Retry import with failed records
   */
  async retryImport(taskId: string, userId: string, token: string): Promise<{ taskId: string }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Get original import task
      const result = await this.pgPool.query(
        `SELECT error_details, error_report_path, file_id FROM import_history 
         WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
        [taskId, userId],
      );

      if (result.rows.length === 0) {
        throw new BadRequestException('导入任务不存在');
      }

      const row = result.rows[0];
      let failedRecords: Array<{ row: number; data: Record<string, any>; errors: Array<{ field: string; message: string }> }> = [];

      // Priority 1: Extract from error_details JSONB
      if (row.error_details) {
        try {
          const parsed = typeof row.error_details === 'string' 
            ? JSON.parse(row.error_details) 
            : row.error_details;
          
          if (parsed && parsed.errors && Array.isArray(parsed.errors)) {
            failedRecords = parsed.errors;
          }
        } catch (error) {
          this.logger.warn('Failed to parse error_details, trying error report file', error);
        }
      }

      // Priority 2: Parse from error report Excel file
      if (failedRecords.length === 0 && row.error_report_path && fs.existsSync(row.error_report_path)) {
        try {
          const parser = this.getParser(row.error_report_path);
          const errorReportData = await parser.parseFile(row.error_report_path);
          
          // Extract original data columns and parse error information
          failedRecords = errorReportData.map((record: any, index: number) => {
            const originalData: Record<string, any> = {};
            Object.keys(record).forEach(key => {
              if (!key.startsWith('_')) {
                originalData[key] = record[key];
              }
            });
            
            // Parse error information from Excel columns
            const errorMessage = record._error_message || '';
            const errorFields = record._error_fields || '';
            
            // Parse errors: format is "field: message; field: message" or "field1,field2"
            const errors: Array<{ field: string; message: string }> = [];
            
            if (errorMessage) {
              // Try to parse "field: message" format
              const errorParts = errorMessage.split(';').map((part: string) => part.trim());
              errorParts.forEach((part: string) => {
                const colonIndex = part.indexOf(':');
                if (colonIndex > 0) {
                  errors.push({
                    field: part.substring(0, colonIndex).trim(),
                    message: part.substring(colonIndex + 1).trim(),
                  });
                } else if (part) {
                  // If no colon, use the field from _error_fields or 'general'
                  const field = errorFields ? errorFields.split(',')[0].trim() : 'general';
                  errors.push({
                    field,
                    message: part,
                  });
                }
              });
            }
            
            // If no errors parsed, create a default error
            if (errors.length === 0) {
              const field = errorFields ? errorFields.split(',')[0].trim() : 'general';
              errors.push({
                field,
                message: errorMessage || '导入失败',
              });
            }
            
            return {
              row: record._row_number || index + 2,
              data: originalData,
              errors,
            };
          });
        } catch (error) {
          this.logger.error('Failed to parse error report file', error);
          throw new BadRequestException('无法解析错误报告文件');
        }
      }

      if (failedRecords.length === 0) {
        throw new BadRequestException('没有找到失败记录');
      }

      // Create temporary file with failed records
      const retryFileId = randomUUID();
      const retryFilePath = path.join(this.tempDir, `${retryFileId}.xlsx`);
      
      try {
        // Write failed records to Excel file
        const workbook = XLSX.utils.book_new();
        const worksheetData = failedRecords.map(record => record.data);
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, retryFilePath);

        // Store file metadata
        this.fileMetadata.set(retryFileId, {
          fileName: `retry-${taskId}.xlsx`,
          uploadedAt: new Date(),
        });
      } catch (error) {
        // Clean up file if creation fails
        try {
          if (fs.existsSync(retryFilePath)) {
            fs.unlinkSync(retryFilePath);
          }
        } catch (cleanupError) {
          this.logger.warn('Failed to cleanup file after creation error', cleanupError);
        }
        this.logger.error('Failed to create retry file', error);
        throw new BadRequestException('创建重新导入文件失败');
      }

      // Get original column mappings (we'll use auto-mapping for retry)
      const originalFilePath = await this.getFilePath(row.file_id);
      const parser = this.getParser(originalFilePath);
      const columns = await parser.getColumns(originalFilePath);
      
      // Auto-generate column mappings (assuming standard field names)
      const columnMappings: ColumnMappingDto[] = columns.map(col => ({
        excelColumn: col,
        sourceColumn: col,
        targetField: col.toLowerCase().replace(/\s+/g, ''),
      }));

      // Start new import task
      return this.startImportTask(retryFileId, columnMappings, userId, token);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to retry import', error);
      throw new BadRequestException('重新导入失败');
    }
  }

  /**
   * Get import history statistics
   */
  async getImportHistoryStats(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    total: number;
    completed: number;
    failed: number;
    partial: number;
    processing: number;
  }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE status = 'partial') as partial,
          COUNT(*) FILTER (WHERE status = 'processing') as processing
        FROM import_history
        WHERE user_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND started_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND started_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      const result = await this.pgPool.query(query, params);
      const row = result.rows[0];

      return {
        total: parseInt(row.total, 10),
        completed: parseInt(row.completed, 10),
        failed: parseInt(row.failed, 10),
        partial: parseInt(row.partial, 10),
        processing: parseInt(row.processing, 10),
      };
    } catch (error) {
      this.logger.error('Failed to get import history stats', error);
      throw new BadRequestException('获取导入历史统计失败');
    }
  }

  /**
   * Clean up temporary file
   */
  async cleanupTempFile(fileId: string): Promise<void> {
    try {
      const filePath = this.findFileByFileId(fileId);
      try {
        fs.unlinkSync(filePath);
        this.logger.log(`Cleaned up temp file: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to cleanup temp file: ${filePath}`, error);
      }
    } catch (error) {
      // File not found, already cleaned up or never existed
      this.logger.debug(`File ${fileId} not found for cleanup, may have been already removed`);
    }
  }
}

