/**
 * GDPR Export Service
 * 
 * Handles GDPR data export requests for compliance with data subject rights
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { JsonExporterService } from '../export/services/json-exporter.service';
import { CsvExporterService } from '../export/services/csv-exporter.service';
import { PermissionService } from '../permission/permission.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { CreateGdprExportRequestDto, GdprExportFormat, GdprExportRequestStatus, GdprExportRequestResponseDto, GdprExportRequestListResponseDto } from './dto/gdpr-export-request.dto';

export interface GdprExportJobData {
  requestId: string;
  userId: string;
  format: GdprExportFormat;
  token: string;
}

export interface GdprExportJobResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  totalRecords?: number;
  error?: string;
}

@Injectable()
export class GdprExportService implements OnModuleDestroy {
  private readonly logger = new Logger(GdprExportService.name);
  private pgPool: Pool | null = null;
  private readonly exportDir: string;
  private readonly DOWNLOAD_EXPIRY_DAYS = 7;

  constructor(
    private readonly configService: ConfigService,
    private readonly jsonExporter: JsonExporterService,
    private readonly csvExporter: CsvExporterService,
    private readonly permissionService: PermissionService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    @InjectQueue('gdpr-export-queue') private readonly gdprExportQueue: Queue<GdprExportJobData, GdprExportJobResult>,
  ) {
    this.initializeDatabaseConnection();
    const isVercel = process.env.VERCEL === '1' || process.env.DEPLOYMENT_PLATFORM === 'vercel';
    this.exportDir = isVercel
      ? '/tmp/exports/gdpr'
      : this.configService.get<string>('GDPR_EXPORT_STORAGE_PATH', './exports/gdpr');
    this.ensureExportDirExists(isVercel);
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, GDPR export operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5,
      });
      this.logger.log('PostgreSQL connection pool initialized for GdprExportService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Ensure export directory exists
   * @param isVercel - on Vercel, do not throw on mkdir failure
   */
  private ensureExportDirExists(isVercel = false): void {
    try {
      if (!fs.existsSync(this.exportDir)) {
        fs.mkdirSync(this.exportDir, { recursive: true });
        this.logger.log(`Created GDPR export directory: ${this.exportDir}`);
      }
    } catch (e) {
      if (isVercel) {
        this.logger.warn(`Could not create GDPR export dir ${this.exportDir}: ${(e as Error)?.message}`);
      } else {
        throw e;
      }
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for GdprExportService');
    }
  }

  /**
   * Create a GDPR export request
   */
  async createExportRequest(
    request: CreateGdprExportRequestDto,
    userId: string,
    token: string,
  ): Promise<GdprExportRequestResponseDto> {
    // Validate user token
    const user = await this.authService.validateToken(token);
    if (!user || !user.id || user.id !== userId) {
      throw new BadRequestException('无效的用户 token');
    }

    // Generate secure download token
    const downloadToken = randomUUID();

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.DOWNLOAD_EXPIRY_DAYS);

    // Create export request record
    const requestId = randomUUID();
    const requestedAt = new Date();

    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      await this.pgPool.query(
        `INSERT INTO gdpr_export_requests
         (id, user_id, request_type, status, download_token, requested_at, expires_at, file_format)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          requestId,
          userId,
          'GDPR_EXPORT',
          GdprExportRequestStatus.PENDING,
          downloadToken,
          requestedAt,
          expiresAt,
          request.format,
        ],
      );

      // Log to audit
      await this.auditService.log({
        action: 'GDPR_EXPORT_REQUEST',
        entityType: 'GDPR_EXPORT',
        entityId: requestId,
        userId,
        operatorId: userId,
        timestamp: requestedAt,
        metadata: {
          format: request.format,
        },
      });

      // Add job to queue
      await this.gdprExportQueue.add(
        'gdpr-export-job',
        {
          requestId,
          userId,
          format: request.format,
          token,
        },
        {
          jobId: requestId,
        },
      );

      // Update status to QUEUED
      await this.updateRequestStatus(requestId, GdprExportRequestStatus.QUEUED);

      this.logger.log(`Created GDPR export request ${requestId} for user ${userId}`);

      return {
        id: requestId,
        userId,
        requestType: 'GDPR_EXPORT',
        status: GdprExportRequestStatus.QUEUED,
        requestedAt,
        expiresAt,
        fileFormat: request.format,
      };
    } catch (error) {
      this.logger.error(`Failed to create GDPR export request: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new BadRequestException('创建导出请求失败');
    }
  }

  /**
   * Get export request by ID (with user ownership validation)
   */
  async getExportRequest(requestId: string, userId: string): Promise<GdprExportRequestResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT * FROM gdpr_export_requests
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [requestId, userId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('导出请求不存在或无权访问');
      }

      return this.mapRowToResponseDto(result.rows[0], true); // Include token for single request detail
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get export request: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new BadRequestException('查询导出请求失败');
    }
  }

  /**
   * Get user's export request list
   */
  async getExportRequestList(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<GdprExportRequestListResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT * FROM gdpr_export_requests
         WHERE user_id = $1 AND deleted_at IS NULL
         ORDER BY requested_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );

      const countResult = await this.pgPool.query(
        `SELECT COUNT(*) as total FROM gdpr_export_requests
         WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId],
      );

      const total = parseInt(countResult.rows[0].total, 10);

      return {
        data: result.rows.map((row) => this.mapRowToResponseDto(row, false)), // Don't include token in list
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`Failed to get export request list for user ${userId}: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        userId,
        limit,
        offset,
      });
      
      // Include the actual error message in the response for debugging
      throw new BadRequestException(
        `查询导出请求列表失败: ${errorMessage}`
      );
    }
  }

  /**
   * Update export request status
   */
  async updateRequestStatus(
    requestId: string,
    status: GdprExportRequestStatus,
    metadata?: { filePath?: string; fileName?: string; fileSize?: number; totalRecords?: number; error?: string },
  ): Promise<void> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping status update');
      return;
    }

    try {
      // Get existing metadata if needed
      let existingMetadata: any = null;
      if (status === GdprExportRequestStatus.COMPLETED && metadata?.totalRecords !== undefined) {
        const existingResult = await this.pgPool.query(
          `SELECT metadata FROM gdpr_export_requests WHERE id = $1`,
          [requestId],
        );
        existingMetadata = existingResult.rows[0]?.metadata || {};
      } else if (status === GdprExportRequestStatus.FAILED && metadata?.error) {
        const existingResult = await this.pgPool.query(
          `SELECT metadata FROM gdpr_export_requests WHERE id = $1`,
          [requestId],
        );
        existingMetadata = existingResult.rows[0]?.metadata || {};
      }

      const updateFields: string[] = ['status = $2'];
      const updateValues: any[] = [requestId, status];
      let paramIndex = 3;

      if (status === GdprExportRequestStatus.COMPLETED && metadata) {
        updateFields.push(`completed_at = NOW()`);
        if (metadata.filePath) {
          updateFields.push(`file_path = $${paramIndex++}`);
          updateValues.push(metadata.filePath);
        }
        if (metadata.fileName) {
          updateFields.push(`download_url = $${paramIndex++}`);
          updateValues.push(`/gdpr/export-requests/${requestId}/download`);
        }
        if (metadata.fileSize !== undefined) {
          updateFields.push(`file_size = $${paramIndex++}`);
          updateValues.push(metadata.fileSize);
        }
        if (metadata.totalRecords !== undefined && existingMetadata !== null) {
          existingMetadata.totalRecords = metadata.totalRecords;
          updateFields.push(`metadata = $${paramIndex++}`);
          updateValues.push(JSON.stringify(existingMetadata));
        }
      } else if (status === GdprExportRequestStatus.FAILED && metadata?.error && existingMetadata !== null) {
        existingMetadata.error = metadata.error;
        updateFields.push(`metadata = $${paramIndex++}`);
        updateValues.push(JSON.stringify(existingMetadata));
      }

      await this.pgPool.query(
        `UPDATE gdpr_export_requests SET ${updateFields.join(', ')} WHERE id = $1`,
        updateValues,
      );

      this.logger.log(`Updated export request ${requestId} status to ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update export request status: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }

  /**
   * Get export file path for download (with validation)
   */
  async getExportFilePath(requestId: string, userId: string, downloadToken: string): Promise<string> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT file_path, download_token, expires_at, user_id FROM gdpr_export_requests
         WHERE id = $1 AND deleted_at IS NULL`,
        [requestId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('导出请求不存在');
      }

      const request = result.rows[0];

      // Validate user ownership
      if (request.user_id !== userId) {
        throw new NotFoundException('无权访问此导出文件');
      }

      // Validate download token
      if (request.download_token !== downloadToken) {
        throw new BadRequestException('无效的下载令牌');
      }

      // Validate expiration
      const expiresAt = new Date(request.expires_at);
      if (expiresAt < new Date()) {
        throw new BadRequestException('下载链接已过期');
      }

      // Validate file exists
      if (!request.file_path || !fs.existsSync(request.file_path)) {
        throw new NotFoundException('导出文件不存在');
      }

      return request.file_path;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to get export file path: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new BadRequestException('获取导出文件路径失败');
    }
  }

  /**
   * Map database row to response DTO
   * @param includeToken - Whether to include downloadToken (only for single request detail)
   */
  private mapRowToResponseDto(row: any, includeToken: boolean = false): GdprExportRequestResponseDto {
    const dto: GdprExportRequestResponseDto = {
      id: row.id,
      userId: row.user_id,
      requestType: row.request_type,
      status: row.status as GdprExportRequestStatus,
      requestedAt: row.requested_at,
      completedAt: row.completed_at,
      expiresAt: row.expires_at,
      downloadUrl: row.download_url,
      fileFormat: row.file_format as GdprExportFormat,
      fileSize: row.file_size,
      metadata: row.metadata,
    };

    // Only include downloadToken for single request detail (not in list)
    if (includeToken && row.download_token) {
      dto.downloadToken = row.download_token;
    }

    return dto;
  }

  /**
   * Clean up expired export files
   */
  async cleanupExpiredFiles(): Promise<void> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping cleanup');
      return;
    }

    try {
      const result = await this.pgPool.query(
        `SELECT id, file_path FROM gdpr_export_requests
         WHERE expires_at < NOW() AND deleted_at IS NULL`,
      );

      for (const row of result.rows) {
        // Delete file if exists
        if (row.file_path && fs.existsSync(row.file_path)) {
          try {
            fs.unlinkSync(row.file_path);
            this.logger.log(`Deleted expired export file: ${row.file_path}`);
          } catch (error) {
            this.logger.warn(`Failed to delete expired file: ${row.file_path}`, error);
          }
        }

        // Mark request as deleted
        await this.pgPool.query(
          `UPDATE gdpr_export_requests SET deleted_at = NOW() WHERE id = $1`,
          [row.id],
        );
      }

      this.logger.log(`Cleaned up ${result.rows.length} expired export files`);
    } catch (error) {
      this.logger.error(`Failed to cleanup expired files: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
}
