/**
 * Interactions Import Service
 * 
 * Handles interaction data import operations
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
import { InteractionMappingService } from './services/mapping.service';
import { InteractionValidationService } from './services/validation.service';
import { CompaniesService } from '../../companies/companies.service';
import { ProductsService } from '../../products/products.service';
import { AuthService } from '../../auth/auth.service';
import { PermissionService } from '../../permission/permission.service';
import { UploadFileResponseDto } from '../customers/dto/upload-file.dto';
import { MappingPreviewResponseDto, ColumnMappingDto } from '../customers/dto/mapping-preview.dto';
import { ValidationResultDto, ValidationErrorDetailDto, DataCleaningSuggestionDto } from '../customers/dto/validation-result.dto';
import { ImportResultDto } from '../customers/dto/import-result.dto';
import { CreateInteractionDto } from '../../interactions/dto/create-interaction.dto';
import { ImportJobData, ImportJobResult } from './interactions-import.processor';

const VALIDATION_BATCH_SIZE = 1000; // Process 1000 records at a time for validation

@Injectable()
export class InteractionsImportService implements OnModuleDestroy {
  private readonly logger = new Logger(InteractionsImportService.name);
  private pgPool: Pool | null = null;
  private readonly tempDir: string;
  private readonly fileMetadata: Map<string, { fileName: string; tempFilePath: string }> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly excelParserService: ExcelParserService,
    private readonly csvParserService: CsvParserService,
    private readonly mappingService: InteractionMappingService,
    private readonly validationService: InteractionValidationService,
    private readonly companiesService: CompaniesService,
    private readonly productsService: ProductsService,
    private readonly authService: AuthService,
    private readonly permissionService: PermissionService,
    @InjectQueue('interaction-import-queue') private readonly importQueue: Queue<ImportJobData, ImportJobResult>,
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
      this.logger.log('PostgreSQL connection pool initialized for InteractionsImportService');
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
      this.logger.log('PostgreSQL connection pool closed for InteractionsImportService');
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
      'customerName', 'customerCode', 'customerId',
      'productName', 'productHsCode', 'productIds',
      'interactionType', 'interactionDate', 'description', 'status', 'additionalInfo',
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
   * Batch load all customers, products, and associations for validation
   */
  async batchLoadReferenceData(
    token: string,
    userId: string,
  ): Promise<{
    customersMap: Map<string, { id: string; name: string; customerType: string }>;
    productsMap: Map<string, { id: string; name: string }>;
    associationsSet: Set<string>; // key: `${customerId}-${productId}`
  }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. Batch load all customers (with role-based filtering)
    const customersResult = await this.companiesService.findAll(
      { limit: 10000, offset: 0 }, // Large limit to get all customers
      token,
    );
    const customersMap = new Map<string, { id: string; name: string; customerType: string }>();
    customersResult.customers.forEach(customer => {
      // Map by name (case-insensitive)
      customersMap.set(customer.name.toLowerCase().trim(), {
        id: customer.id,
        name: customer.name,
        customerType: customer.customerType,
      });
      // Map by customer code if exists
      if (customer.customerCode) {
        customersMap.set(customer.customerCode.trim(), {
          id: customer.id,
          name: customer.name,
          customerType: customer.customerType,
        });
      }
    });

    // 2. Batch load all products (with user-based filtering)
    const productsResult = await this.productsService.findAll(
      { limit: 10000, offset: 0 }, // Large limit to get all products
      userId,
      token,
    );
    const productsMap = new Map<string, { id: string; name: string }>();
    productsResult.products.forEach(product => {
      // Map by name (case-insensitive)
      productsMap.set(product.name.toLowerCase().trim(), {
        id: product.id,
        name: product.name,
      });
      // Map by HS code
      if (product.hsCode) {
        productsMap.set(product.hsCode.trim(), {
          id: product.id,
          name: product.name,
        });
      }
    });

    // 3. Batch load all associations
    const associationsResult = await this.pgPool.query(
      `SELECT customer_id, product_id 
       FROM product_customer_associations 
       WHERE deleted_at IS NULL`,
    );
    const associationsSet = new Set<string>();
    associationsResult.rows.forEach(row => {
      associationsSet.add(`${row.customer_id}-${row.product_id}`);
    });

    return { customersMap, productsMap, associationsSet };
  }

  /**
   * Resolve customer ID from name or code
   */
  resolveCustomerId(
    data: Record<string, any>,
    customersMap: Map<string, { id: string; name: string; customerType: string }>,
  ): { customerId?: string; error?: string } {
    // Try customerId first
    if (data.customerId) {
      const customerId = String(data.customerId).trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
        // Validate customer exists in map
        const customer = Array.from(customersMap.values()).find(c => c.id === customerId);
        if (customer) {
          return { customerId };
        }
        return { error: `客户ID不存在: ${customerId}` };
      }
      return { error: `客户ID格式不正确: ${customerId}` };
    }

    // Try customerName
    if (data.customerName) {
      const customerName = String(data.customerName).trim().toLowerCase();
      const customer = customersMap.get(customerName);
      if (customer) {
        return { customerId: customer.id };
      }
      return { error: `客户名称不存在: ${data.customerName}` };
    }

    // Try customerCode
    if (data.customerCode) {
      const customerCode = String(data.customerCode).trim();
      const customer = customersMap.get(customerCode);
      if (customer) {
        return { customerId: customer.id };
      }
      return { error: `客户代码不存在: ${customerCode}` };
    }

    return { error: '客户ID、客户名称或客户代码不能为空' };
  }

  /**
   * Resolve product IDs from name, HS code, or comma/semicolon-separated string
   */
  resolveProductIds(
    data: Record<string, any>,
    productsMap: Map<string, { id: string; name: string }>,
  ): { productIds?: string[]; error?: string } {
    // Try productIds first (array or comma/semicolon-separated string)
    if (data.productIds) {
      let productIds: string[] = [];
      if (Array.isArray(data.productIds)) {
        productIds = data.productIds.map(id => String(id).trim());
      } else if (typeof data.productIds === 'string') {
        productIds = data.productIds.split(/[,;]/).map(id => id.trim()).filter(id => id.length > 0);
      }

      if (productIds.length === 0) {
        return { error: '至少需要选择一个产品' };
      }

      // Validate UUID format or resolve by name/HS code
      const resolvedIds: string[] = [];
      for (const productIdOrName of productIds) {
        // Check if it's a UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrName)) {
          const product = Array.from(productsMap.values()).find(p => p.id === productIdOrName);
          if (product) {
            resolvedIds.push(product.id);
          } else {
            return { error: `产品ID不存在: ${productIdOrName}` };
          }
        } else {
          // Try to resolve by name or HS code
          const normalized = productIdOrName.toLowerCase().trim();
          const product = productsMap.get(normalized);
          if (product) {
            resolvedIds.push(product.id);
          } else {
            return { error: `产品名称或HS编码不存在: ${productIdOrName}` };
          }
        }
      }

      return { productIds: resolvedIds };
    }

    // Try productName (single product)
    if (data.productName) {
      const productName = String(data.productName).trim().toLowerCase();
      const product = productsMap.get(productName);
      if (product) {
        return { productIds: [product.id] };
      }
      return { error: `产品名称不存在: ${data.productName}` };
    }

    // Try productHsCode (single product)
    if (data.productHsCode) {
      const productHsCode = String(data.productHsCode).trim();
      const product = productsMap.get(productHsCode);
      if (product) {
        return { productIds: [product.id] };
      }
      return { error: `产品HS编码不存在: ${data.productHsCode}` };
    }

    return { error: '产品ID、产品名称或HS编码不能为空' };
  }

  /**
   * Validate import data (with batch optimization)
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

    // Batch load reference data (customers, products, associations)
    this.logger.log('Batch loading reference data (customers, products, associations)...');
    const { customersMap, productsMap, associationsSet } = await this.batchLoadReferenceData(token, userId);
    this.logger.log(`Loaded ${customersMap.size} customers, ${productsMap.size} products, ${associationsSet.size} associations`);

    // Get user info for role validation
    const user = await this.authService.validateToken(token);
    if (!user || !user.role) {
      throw new BadRequestException('无效的用户 token');
    }

    const errors: ValidationErrorDetailDto[] = [];
    const cleaningSuggestions: DataCleaningSuggestionDto[] = [];
    let validRecordsCount = 0;

    // Process each record in batches
    for (let i = 0; i < allData.length; i += VALIDATION_BATCH_SIZE) {
      const batch = allData.slice(i, i + VALIDATION_BATCH_SIZE);
      this.logger.log(`Processing validation batch ${Math.floor(i / VALIDATION_BATCH_SIZE) + 1}/${Math.ceil(allData.length / VALIDATION_BATCH_SIZE)}`);

      for (let j = 0; j < batch.length; j++) {
        const originalIndex = i + j;
        const row = batch[j];
        const rowNumber = originalIndex + 2; // Excel row number (1-based, +1 for header)

        // Transform row data using mappings
        const transformedData = this.transformRowData(row, columnMappings);

        // Validate record format
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
          continue;
        }

        // Resolve customer ID
        const customerResult = this.resolveCustomerId(transformedData, customersMap);
        if (customerResult.error) {
          errors.push({
            row: rowNumber,
            errors: [`customerId: ${customerResult.error}`],
            data: transformedData,
          });
          continue;
        }

        // Validate role permission (customer type must match user role)
        const customer = customersMap.get(
          Array.from(customersMap.values()).find(c => c.id === customerResult.customerId)?.name.toLowerCase().trim() || '',
        );
        if (customer) {
          if (user.role === 'FRONTEND_SPECIALIST' && customer.customerType !== 'BUYER') {
            errors.push({
              row: rowNumber,
              errors: ['customerId: 前端专员只能导入采购商类型的客户互动记录'],
              data: transformedData,
            });
            continue;
          }
          if (user.role === 'BACKEND_SPECIALIST' && customer.customerType !== 'SUPPLIER') {
            errors.push({
              row: rowNumber,
              errors: ['customerId: 后端专员只能导入供应商类型的客户互动记录'],
              data: transformedData,
            });
            continue;
          }
        }

        // Resolve product IDs
        const productResult = this.resolveProductIds(transformedData, productsMap);
        if (productResult.error) {
          errors.push({
            row: rowNumber,
            errors: [`productIds: ${productResult.error}`],
            data: transformedData,
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
            errors.push({
              row: rowNumber,
              errors: [`关联关系: 以下产品与客户之间必须已有关联，请先创建关联: ${missingAssociations.join(', ')}`],
              data: transformedData,
            });
            continue;
          }
        }

        // All validations passed
        validRecordsCount++;
      }
    }

    return {
      totalRecords: allData.length,
      validRecords: validRecordsCount,
      invalidRecords: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      cleaningSuggestions: cleaningSuggestions.length > 0 ? cleaningSuggestions : undefined,
      hasErrors: errors.length > 0,
      hasDuplicates: false, // Interactions don't have duplicate detection
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
    // Validate file exists
    const filePath = this.findFileByFileId(fileId);

    // Add job to queue
    const job = await this.importQueue.add('import-interactions', {
      fileId,
      filePath,
      columnMappings,
      userId,
      token,
    } as ImportJobData);

    this.logger.log(`Import task created: ${job.id}`);

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
    const progress = job.progress as { processed: number; total: number; estimatedTimeRemaining?: number } | undefined;

    if (state === 'completed') {
      const result = job.returnvalue as ImportJobResult;
      return {
        status: 'completed',
        totalRecords: result.totalRecords,
        successCount: result.successRecords,
        failureCount: result.failedRecords,
        errors: result.errors?.map((e: any) => ({
          row: e.row || 0,
          field: e.field || 'general',
          message: Array.isArray(e.errors) ? e.errors.join('; ') : (e.message || String(e)),
        })) || [],
        taskId: job.id!,
      };
    }

    if (state === 'failed') {
      const error = job.failedReason || '导入任务失败';
      return {
        status: 'failed',
        totalRecords: progress?.total || 0,
        successCount: progress?.processed || 0,
        failureCount: (progress?.total || 0) - (progress?.processed || 0),
        errors: [{ row: 0, field: 'general', message: error }],
        taskId: job.id!,
      };
    }

    return {
      status: 'processing',
      totalRecords: progress?.total || 0,
      successCount: progress?.processed || 0,
      failureCount: 0,
      taskId: job.id!,
      progress: progress?.total ? Math.round(((progress.processed || 0) / progress.total) * 100) : 0,
    };
  }

  /**
   * Get import history
   */
  async getImportHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ items: any[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT * FROM import_history 
         WHERE created_by = $1 AND import_type = 'INTERACTION' AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );

      const countResult = await this.pgPool.query(
        `SELECT COUNT(*) as total FROM import_history 
         WHERE created_by = $1 AND import_type = 'INTERACTION' AND deleted_at IS NULL`,
        [userId],
      );

      return {
        items: result.rows,
        total: parseInt(countResult.rows[0].total, 10),
      };
    } catch (error) {
      this.logger.error('Failed to get import history', error);
      throw new BadRequestException('获取导入历史失败');
    }
  }
}

