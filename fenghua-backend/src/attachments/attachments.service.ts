/**
 * Attachments Service
 * 
 * Handles file upload, delete, and association with interactions
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { StorageProvider } from './storage/storage.interface';
import { LocalStorageService } from './storage/local-storage.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { UpdateAttachmentMetadataDto } from './dto/update-attachment-metadata.dto';

interface AttachmentRow {
  id: string;
  interaction_id: string | null;
  product_id: string | null;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  mime_type: string | null;
  storage_provider: string;
  storage_key: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string;
  workspace_id: string;
}

@Injectable()
export class AttachmentsService implements OnModuleDestroy {
  private readonly logger = new Logger(AttachmentsService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageService: LocalStorageService,
  ) {
    this.initializeDatabaseConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    
    if (!databaseUrl) {
      this.logger.error('DATABASE_URL not configured');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.logger.log('Database connection pool initialized for AttachmentsService');
    } catch (error) {
      this.logger.error('Failed to initialize database connection pool', error);
    }
  }

  /**
   * Cleanup resources on module destroy
   */
  onModuleDestroy() {
    if (this.pgPool) {
      this.pgPool.end();
      this.logger.log('Database connection pool closed for AttachmentsService');
    }
  }

  /**
   * Extract workspace ID from JWT token payload
   * Reuses logic from ProductsService
   */
  private extractWorkspaceIdFromToken(token: string): string | null {
    try {
      // Decode JWT payload (base64url decode)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Decode payload (base64url)
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
      );

      // Extract workspace ID from payload
      const workspaceId = payload.workspaceId || payload.workspace_id;
      
      if (!workspaceId) {
        this.logger.warn('Workspace ID not found in JWT payload', { payloadKeys: Object.keys(payload) });
        return null;
      }

      return workspaceId;
    } catch (error) {
      this.logger.error('Failed to extract workspace ID from token', error);
      return null;
    }
  }

  /**
   * Get workspace ID from token
   */
  private async getWorkspaceId(token: string): Promise<string> {
    try {
      // Extract workspace ID from JWT payload
      const workspaceId = this.extractWorkspaceIdFromToken(token);
      if (workspaceId) {
        return workspaceId;
      }

      // Fallback: Use default workspace (for development/testing only)
      const defaultWorkspaceId = this.configService.get<string>('DEFAULT_WORKSPACE_ID');
      if (defaultWorkspaceId) {
        this.logger.warn('Using default workspace ID from config');
        return defaultWorkspaceId;
      }

      throw new BadRequestException('无法从 token 中获取工作空间ID');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to get workspace ID', error);
      throw new BadRequestException('获取工作空间ID失败');
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Determine file type from MIME type
   */
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'photo';
    }
    if (mimeType === 'application/pdf') {
      return 'document';
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'document';
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'document';
    }
    return 'other';
  }

  /**
   * Validate file type and size
   */
  private validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
    if (file.size > maxFileSize) {
      throw new BadRequestException('文件大小超过限制（最大 10MB）');
    }
  }

  /**
   * Get storage provider instance
   */
  private getStorageProvider(provider: string): StorageProvider {
    switch (provider) {
      case 'local':
        return this.localStorageService;
      // TODO: Add cloud storage providers when configured
      // case 'aliyun_oss':
      //   return this.aliyunOssService;
      // case 'aws_s3':
      //   return this.awsS3Service;
      // case 'cloudflare_r2':
      //   return this.cloudflareR2Service;
      default:
        // Default to local storage for development
        this.logger.warn(`Unknown storage provider: ${provider}, using local storage`);
        return this.localStorageService;
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    token: string,
  ): Promise<AttachmentResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('Database connection not available');
    }

    // 1. Validate file type and size
    this.validateFile(file);

    // 2. Get workspace ID
    const workspaceId = await this.getWorkspaceId(token);

    // 3. Generate storage key (UUID + file extension)
    const storageKey = `${randomUUID()}.${this.getFileExtension(file.originalname)}`;

    // 4. Upload to storage
    const storageProvider = this.configService.get<string>('STORAGE_PROVIDER', 'local');
    const storageService = this.getStorageProvider(storageProvider);
    const fileUrl = await storageService.upload(file.buffer, storageKey, file.mimetype);

    // 5. Save file metadata to database
    const insertQuery = `
      INSERT INTO file_attachments (
        file_name, file_url, file_size, file_type, mime_type,
        storage_provider, storage_key, workspace_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, interaction_id, product_id, file_name, file_url, file_size,
        file_type, mime_type, storage_provider, storage_key, metadata,
        created_at, updated_at, deleted_at, created_by, workspace_id
    `;

    const result = await this.pgPool.query<AttachmentRow>(insertQuery, [
      file.originalname,
      fileUrl,
      file.size,
      this.getFileType(file.mimetype),
      file.mimetype,
      storageProvider,
      storageKey,
      workspaceId,
      userId,
    ]);

    const row = result.rows[0];
    return this.toResponseDto(row);
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(attachmentId: string): Promise<AttachmentResponseDto | null> {
    if (!this.pgPool) {
      throw new BadRequestException('Database connection not available');
    }

    const query = `
      SELECT id, interaction_id, product_id, file_name, file_url, file_size,
        file_type, mime_type, storage_provider, storage_key, metadata,
        created_at, updated_at, deleted_at, created_by, workspace_id
      FROM file_attachments
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pgPool.query<AttachmentRow>(query, [attachmentId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.toResponseDto(result.rows[0]);
  }

  /**
   * Link attachment to interaction
   */
  async linkToInteraction(attachmentId: string, interactionId: string): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('Database connection not available');
    }

    // Verify attachment exists and is not already linked
    const attachment = await this.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new BadRequestException('附件不存在');
    }

    if (attachment.interactionId) {
      throw new BadRequestException('附件已关联到其他互动记录');
    }

    // Update interaction_id
    const updateQuery = `
      UPDATE file_attachments
      SET interaction_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
    `;

    await this.pgPool.query(updateQuery, [interactionId, attachmentId]);
    this.logger.log(`Linked attachment ${attachmentId} to interaction ${interactionId}`);
  }

  /**
   * Delete attachment (from storage and database)
   */
  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('Database connection not available');
    }

    // 1. Query attachment info
    const attachment = await this.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new BadRequestException('附件不存在');
    }

    // 2. Verify permissions
    if (attachment.createdBy !== userId) {
      throw new ForbiddenException('无权删除此附件');
    }

    // 3. Delete from storage
    const storageService = this.getStorageProvider(attachment.storageProvider);
    await storageService.delete(attachment.storageKey);

    // 4. Soft delete from database
    const updateQuery = `
      UPDATE file_attachments
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pgPool.query(updateQuery, [attachmentId]);
    this.logger.log(`Deleted attachment ${attachmentId}`);
  }

  /**
   * Update attachment metadata (order and annotation)
   */
  async updateMetadata(
    attachmentId: string,
    dto: UpdateAttachmentMetadataDto,
    userId: string,
  ): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('Database connection not available');
    }

    // 1. Verify attachment exists
    const attachment = await this.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new BadRequestException('附件不存在');
    }

    // 2. Build metadata object (merge with existing metadata)
    const existingMetadata = attachment.metadata || {};
    const newMetadata: Record<string, unknown> = { ...existingMetadata };
    
    if (dto.order !== undefined) {
      newMetadata.order = dto.order;
    }
    if (dto.annotation !== undefined) {
      if (dto.annotation.trim()) {
        newMetadata.annotation = dto.annotation.trim();
      } else {
        // Remove annotation if empty
        delete newMetadata.annotation;
      }
    }

    // 3. Update database
    const updateQuery = `
      UPDATE file_attachments
      SET metadata = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
    `;

    await this.pgPool.query(updateQuery, [JSON.stringify(newMetadata), attachmentId]);
    this.logger.log(`Updated metadata for attachment ${attachmentId}`);
  }

  /**
   * Convert database row to response DTO
   */
  private toResponseDto(row: AttachmentRow): AttachmentResponseDto {
    return {
      id: row.id,
      interactionId: row.interaction_id || undefined,
      productId: row.product_id || undefined,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      fileType: row.file_type,
      mimeType: row.mime_type || undefined,
      storageProvider: row.storage_provider,
      storageKey: row.storage_key,
      metadata: row.metadata || undefined,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at || undefined,
    };
  }
}

