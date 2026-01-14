/**
 * GDPR Deletion Service
 * 
 * Handles GDPR data deletion requests for compliance with data subject rights (Article 17 - Right to be forgotten)
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
import { randomUUID } from 'crypto';
import { PermissionService } from '../permission/permission.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { 
  CreateGdprDeletionRequestDto, 
  GdprDeletionRequestStatus, 
  GdprDeletionRequestResponseDto, 
  GdprDeletionRequestListResponseDto,
  DeletionSummary,
} from './dto/gdpr-deletion-request.dto';

export interface GdprDeletionJobData {
  requestId: string;
  userId: string;
  token: string;
}

export interface GdprDeletionJobResult {
  success: boolean;
  deletionSummary?: DeletionSummary;
  error?: string;
}

@Injectable()
export class GdprDeletionService implements OnModuleDestroy {
  private readonly logger = new Logger(GdprDeletionService.name);
  private pgPool: Pool | null = null;
  private readonly DEFAULT_RETENTION_DAYS = 2555; // 7 years

  constructor(
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    @InjectQueue('gdpr-deletion-queue') private readonly gdprDeletionQueue: Queue<GdprDeletionJobData, GdprDeletionJobResult>,
  ) {
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
      this.logger.warn('DATABASE_URL not configured, GDPR deletion operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5,
      });
      this.logger.log('PostgreSQL connection pool initialized for GdprDeletionService');
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
      this.logger.log('PostgreSQL connection pool closed for GdprDeletionService');
    }
  }

  /**
   * Get data retention days from system_settings table
   */
  private async getDataRetentionDays(): Promise<number> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, using default retention days');
      return this.DEFAULT_RETENTION_DAYS;
    }

    try {
      const result = await this.pgPool.query(
        `SELECT value FROM system_settings WHERE key = 'dataRetentionDays' LIMIT 1`,
      );

      if (result.rows.length > 0) {
        const value = parseInt(result.rows[0].value, 10);
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }

      this.logger.warn('dataRetentionDays not found in system_settings, using default');
      return this.DEFAULT_RETENTION_DAYS;
    } catch (error) {
      this.logger.warn(`Failed to read dataRetentionDays from system_settings: ${error instanceof Error ? error.message : String(error)}, using default`);
      return this.DEFAULT_RETENTION_DAYS;
    }
  }

  /**
   * Create a GDPR deletion request
   * 
   * Validates user confirmation and creates a deletion request record.
   * The actual deletion is processed asynchronously via Bull Queue.
   * 
   * @param request - Deletion request DTO containing confirmation string
   * @param userId - User ID requesting deletion
   * @param token - JWT token for authentication and permission checking
   * @returns Deletion request response DTO with request ID and status
   * @throws BadRequestException if confirmation is invalid or user token is invalid
   * @throws BadRequestException if database connection is not initialized
   */
  async createDeletionRequest(
    request: CreateGdprDeletionRequestDto,
    userId: string,
    token: string,
  ): Promise<GdprDeletionRequestResponseDto> {
    // Validate confirmation (case-insensitive for English, trim whitespace)
    const trimmedConfirmation = request.confirmation.trim();
    const normalizedConfirmation = trimmedConfirmation.toUpperCase();
    const isValidConfirmation = 
      trimmedConfirmation === '确认删除' || 
      normalizedConfirmation === 'DELETE';
    
    if (!isValidConfirmation) {
      throw new BadRequestException('必须输入"确认删除"或"DELETE"以确认删除操作');
    }

    // Validate user token
    const user = await this.authService.validateToken(token);
    if (!user || !user.id || user.id !== userId) {
      throw new BadRequestException('无效的用户 token');
    }

    // Create deletion request record
    const requestId = randomUUID();
    const requestedAt = new Date();

    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      await this.pgPool.query(
        `INSERT INTO gdpr_deletion_requests
         (id, user_id, request_type, status, requested_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          requestId,
          userId,
          'GDPR_DELETION',
          GdprDeletionRequestStatus.PENDING,
          requestedAt,
        ],
      );

      // Log to audit
      await this.auditService.log({
        action: 'GDPR_DELETION_REQUEST',
        entityType: 'GDPR_DELETION',
        entityId: requestId,
        userId,
        operatorId: userId,
        timestamp: requestedAt,
        metadata: {
          confirmation: request.confirmation,
        },
      });

      // Add job to queue
      await this.gdprDeletionQueue.add(
        'gdpr-deletion-job',
        {
          requestId,
          userId,
          token,
        },
        {
          jobId: requestId,
        },
      );

      // Update status to QUEUED
      await this.updateRequestStatus(requestId, GdprDeletionRequestStatus.QUEUED);

      this.logger.log(`Created GDPR deletion request ${requestId} for user ${userId}`);

      return {
        id: requestId,
        userId,
        requestType: 'GDPR_DELETION',
        status: GdprDeletionRequestStatus.QUEUED,
        requestedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create GDPR deletion request: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new BadRequestException('创建删除请求失败');
    }
  }

  /**
   * Get deletion request by ID (with user ownership validation)
   * 
   * Retrieves a single deletion request, ensuring the user can only access their own requests.
   * 
   * @param requestId - UUID of the deletion request
   * @param userId - User ID for ownership validation
   * @returns Deletion request response DTO
   * @throws NotFoundException if request doesn't exist or user doesn't own it
   * @throws BadRequestException if database connection is not initialized
   */
  async getDeletionRequest(requestId: string, userId: string): Promise<GdprDeletionRequestResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT * FROM gdpr_deletion_requests
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [requestId, userId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('删除请求不存在或无权访问');
      }

      return this.mapRowToResponseDto(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get deletion request: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new BadRequestException('查询删除请求失败');
    }
  }

  /**
   * Get user's deletion request list
   * 
   * Retrieves paginated list of deletion requests for the authenticated user.
   * 
   * @param userId - User ID for filtering requests
   * @param limit - Maximum number of records to return (default: 50)
   * @param offset - Number of records to skip (default: 0)
   * @returns Paginated list of deletion requests
   * @throws BadRequestException if database connection is not initialized
   */
  async getDeletionRequestList(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<GdprDeletionRequestListResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT * FROM gdpr_deletion_requests
         WHERE user_id = $1 AND deleted_at IS NULL
         ORDER BY requested_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );

      const countResult = await this.pgPool.query(
        `SELECT COUNT(*) as total FROM gdpr_deletion_requests
         WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId],
      );

      const total = parseInt(countResult.rows[0].total, 10);

      return {
        data: result.rows.map((row) => this.mapRowToResponseDto(row)),
        total,
        limit,
        page: Math.floor(offset / limit) + 1,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`Failed to get deletion request list for user ${userId}: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        userId,
        limit,
        offset,
      });
      
      throw new BadRequestException(
        `查询删除请求列表失败: ${errorMessage}`
      );
    }
  }

  /**
   * Update deletion request status
   * 
   * Updates the status of a deletion request and optionally stores deletion summary or error information.
   * Automatically sets completed_at timestamp when status is COMPLETED or PARTIALLY_COMPLETED.
   * 
   * @param requestId - UUID of the deletion request
   * @param status - New status (PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, PARTIALLY_COMPLETED)
   * @param metadata - Optional metadata containing deletionSummary or error message
   * @returns Promise that resolves when status is updated
   */
  async updateRequestStatus(
    requestId: string,
    status: GdprDeletionRequestStatus,
    metadata?: { deletionSummary?: DeletionSummary; error?: string },
  ): Promise<void> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping status update');
      return;
    }

    try {
      const updateFields: string[] = ['status = $2'];
      const updateValues: any[] = [requestId, status];
      let paramIndex = 3;

      if (status === GdprDeletionRequestStatus.COMPLETED || status === GdprDeletionRequestStatus.PARTIALLY_COMPLETED) {
        updateFields.push(`completed_at = NOW()`);
        if (metadata?.deletionSummary) {
          updateFields.push(`deletion_summary = $${paramIndex++}`);
          updateValues.push(JSON.stringify(metadata.deletionSummary));
        }
      }

      if (metadata) {
        const existingResult = await this.pgPool.query(
          `SELECT metadata FROM gdpr_deletion_requests WHERE id = $1`,
          [requestId],
        );
        const existingMetadata = existingResult.rows[0]?.metadata || {};
        
        if (metadata.deletionSummary) {
          existingMetadata.deletionSummary = metadata.deletionSummary;
        }
        if (metadata.error) {
          existingMetadata.error = metadata.error;
        }

        updateFields.push(`metadata = $${paramIndex++}`);
        updateValues.push(JSON.stringify(existingMetadata));
      }

      await this.pgPool.query(
        `UPDATE gdpr_deletion_requests SET ${updateFields.join(', ')} WHERE id = $1`,
        updateValues,
      );

      this.logger.log(`Updated deletion request ${requestId} status to ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update deletion request status: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }

  /**
   * Map database row to response DTO
   */
  private mapRowToResponseDto(row: any): GdprDeletionRequestResponseDto {
    return {
      id: row.id,
      userId: row.user_id,
      requestType: row.request_type,
      status: row.status as GdprDeletionRequestStatus,
      requestedAt: row.requested_at,
      completedAt: row.completed_at,
      deletionSummary: row.deletion_summary ? JSON.parse(JSON.stringify(row.deletion_summary)) : undefined,
      metadata: row.metadata,
    };
  }

  /**
   * Get data retention days (public method for processor)
   */
  async getRetentionDays(): Promise<number> {
    return this.getDataRetentionDays();
  }
}
