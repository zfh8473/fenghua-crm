/**
 * Export Service
 * 
 * Main service for data export functionality
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
import { ExportRequestDto, ExportDataType, ExportFormat } from './dto/export-request.dto';
import { ExportTaskResponseDto, ExportTaskStatus, ExportHistoryResponseDto, ExportHistoryDto } from './dto/export-response.dto';
import { JsonExporterService } from './services/json-exporter.service';
import { CsvExporterService } from './services/csv-exporter.service';
import { ExcelExporterService } from './services/excel-exporter.service';
import { CompaniesService } from '../companies/companies.service';
import { ProductsService } from '../products/products.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AuthService } from '../auth/auth.service';

export interface ExportJobData {
  exportType: ExportDataType;
  format: ExportFormat;
  filters?: any;
  selectedFields?: string[]; // Optional: if empty, export all fields
  userId: string;
  token: string;
}

export interface ExportJobResult {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  totalRecords: number;
  error?: string;
}

@Injectable()
export class ExportService implements OnModuleDestroy {
  private readonly logger = new Logger(ExportService.name);
  private pgPool: Pool | null = null;
  private readonly exportDir: string;
  private readonly fileMetadata: Map<string, { fileName: string; filePath: string; createdAt: Date; expiresAt: Date }> = new Map();
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  constructor(
    private readonly configService: ConfigService,
    private readonly jsonExporter: JsonExporterService,
    private readonly csvExporter: CsvExporterService,
    private readonly excelExporter: ExcelExporterService,
    private readonly companiesService: CompaniesService,
    private readonly productsService: ProductsService,
    private readonly interactionsService: InteractionsService,
    private readonly authService: AuthService,
    @InjectQueue('export-queue') private readonly exportQueue: Queue<ExportJobData, ExportJobResult>,
  ) {
    this.initializeDatabaseConnection();
    this.exportDir = this.configService.get<string>('EXPORT_STORAGE_PATH', '/tmp/exports');
    this.ensureExportDirExists();
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
      this.logger.log('PostgreSQL connection pool initialized for ExportService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Ensure export directory exists
   */
  private ensureExportDirExists(): void {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
      this.logger.log(`Created export directory: ${this.exportDir}`);
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for ExportService');
    }
  }

  /**
   * Start export task
   */
  async startExport(
    request: ExportRequestDto,
    userId: string,
    token: string,
  ): Promise<{ taskId: string }> {
    // Validate user token
    const user = await this.authService.validateToken(token);
    if (!user || !user.id) {
      throw new BadRequestException('无效的用户 token');
    }

    // Check if user has permission (Director or Admin only)
    if (user.role !== 'DIRECTOR' && user.role !== 'ADMIN' && user.role !== 'director' && user.role !== 'admin') {
      throw new BadRequestException('只有总监和管理员可以导出数据');
    }

    // Always use async export (Bull Queue) for consistency
    // This ensures all exports are handled the same way and can be tracked
    const job = await this.exportQueue.add(
      'export-job',
      {
        exportType: request.dataType,
        format: request.format,
        filters: this.getFilters(request),
        selectedFields: request.selectedFields, // Pass selected fields to processor
        userId,
        token,
      },
      {
        jobId: randomUUID(),
      },
    );

    this.logger.log(`Started export task: ${job.id} for ${request.dataType} in ${request.format} format`);
    return { taskId: job.id! };
  }

  /**
   * Estimate record count for export
   */
  private async estimateRecordCount(
    request: ExportRequestDto,
    token: string,
    userId: string,
  ): Promise<number> {
    try {
      switch (request.dataType) {
        case ExportDataType.CUSTOMER: {
          const customerFilters = request.customerFilters || {};
          const result = await this.companiesService.findAll(
            { limit: 1, offset: 0, ...customerFilters },
            token,
          );
          return result.total;
        }
        case ExportDataType.PRODUCT: {
          const productFilters = request.productFilters || {};
          const result = await this.productsService.findAll(
            { limit: 1, offset: 0, ...productFilters },
            userId,
            token,
          );
          return result.total;
        }
        case ExportDataType.INTERACTION: {
          const interactionFilters = request.interactionFilters || {};
          const result = await this.interactionsService.findAll(
            { limit: 1, offset: 0, ...interactionFilters },
            token,
          );
          return result.total;
        }
        default:
          return 0;
      }
    } catch (error) {
      this.logger.error('Failed to estimate record count', error);
      this.logger.warn('Defaulting to async export due to estimation failure');
      return 10001; // Default to async
    }
  }

  /**
   * Get filters from request
   */
  private getFilters(request: ExportRequestDto): any {
    switch (request.dataType) {
      case ExportDataType.CUSTOMER:
        return request.customerFilters || {};
      case ExportDataType.PRODUCT:
        return request.productFilters || {};
      case ExportDataType.INTERACTION:
        return request.interactionFilters || {};
      default:
        return {};
    }
  }

  /**
   * Export data synchronously (for small datasets)
   */
  private async exportSync(
    request: ExportRequestDto,
    userId: string,
    token: string,
  ): Promise<string> {
    // This will be implemented in the processor
    // For now, create a task ID and return it
    const fileId = randomUUID();
    return fileId;
  }

  /**
   * Get export task status
   */
  async getExportTaskStatus(taskId: string): Promise<ExportTaskResponseDto> {
    try {
      const job = await this.exportQueue.getJob(taskId);
      if (!job) {
        throw new BadRequestException(`导出任务不存在: ${taskId}`);
      }

      const state = await job.getState();
      const progress = job.progress as any;

      return {
        taskId,
        status: this.mapJobStateToStatus(state),
        dataType: job.data.exportType,
        format: job.data.format,
        totalRecords: progress?.totalRecords,
        processedRecords: progress?.processedRecords,
        fileId: progress?.fileId,
        fileName: progress?.fileName,
        fileSize: progress?.fileSize,
        error: progress?.error,
        estimatedTimeRemaining: progress?.estimatedTimeRemaining,
        createdAt: new Date(job.timestamp),
        completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get export task status: ${taskId}`, error);
      throw error;
    }
  }

  /**
   * Map BullMQ job state to export task status
   */
  private mapJobStateToStatus(state: string): ExportTaskStatus {
    switch (state) {
      case 'completed':
        return ExportTaskStatus.COMPLETED;
      case 'failed':
        return ExportTaskStatus.FAILED;
      case 'active':
      case 'waiting':
        return ExportTaskStatus.PROCESSING;
      default:
        return ExportTaskStatus.PENDING;
    }
  }

  /**
   * Get export file download path
   */
  getExportFilePath(fileId: string): string | null {
    const metadata = this.fileMetadata.get(fileId);
    if (!metadata) {
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(metadata.filePath)) {
      this.logger.warn(`Export file not found: ${metadata.filePath}`);
      return null;
    }

    // Check if file has expired
    if (new Date() > metadata.expiresAt) {
      this.logger.warn(`Export file has expired: ${fileId}`);
      return null;
    }

    return metadata.filePath;
  }

  /**
   * Register export file metadata
   */
  registerExportFile(
    fileId: string,
    fileName: string,
    filePath: string,
    expiresInHours: number = 24,
  ): void {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    this.fileMetadata.set(fileId, {
      fileName,
      filePath,
      createdAt: new Date(),
      expiresAt,
    });

    this.logger.log(`Registered export file: ${fileId} -> ${filePath}`);
  }

  /**
   * Generate export file name
   */
  generateFileName(exportType: ExportDataType, format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const randomId = randomUUID().slice(0, 8);
    const extension = format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase();
    return `${exportType.toLowerCase()}-${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Get export file path
   */
  getExportFileFullPath(fileName: string): string {
    return path.join(this.exportDir, fileName);
  }

  /**
   * Get export history
   */
  async getExportHistory(
    userId: string,
    filters: {
      exportType?: ExportDataType;
      format?: ExportFormat;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<ExportHistoryResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    // Build WHERE clause
    const whereConditions: string[] = ['created_by = $1', 'deleted_at IS NULL'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.exportType) {
      whereConditions.push(`export_type = $${paramIndex}`);
      params.push(filters.exportType);
      paramIndex++;
    }

    if (filters.format) {
      whereConditions.push(`export_format = $${paramIndex}`);
      params.push(filters.format);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM export_history WHERE ${whereClause}`;
    const countResult = await this.pgPool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const query = `
      SELECT 
        id, file_name, file_path, file_size, total_records, 
        export_type, export_format, status, created_by, created_at, expires_at
      FROM export_history
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const queryParams = [...params, limit, offset];
    const result = await this.pgPool.query(query, queryParams);

    const history: ExportHistoryDto[] = result.rows.map((row) => ({
      id: row.id,
      file_name: row.file_name,
      file_path: row.file_path,
      file_size: row.file_size,
      total_records: row.total_records,
      export_type: row.export_type as ExportDataType,
      export_format: row.export_format as ExportFormat,
      status: row.status as ExportTaskStatus,
      created_by: row.created_by,
      created_at: row.created_at,
      expires_at: row.expires_at,
    }));

    return {
      history,
      total,
      limit,
      offset,
    };
  }
}

