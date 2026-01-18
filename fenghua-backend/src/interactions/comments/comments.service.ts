/**
 * Comments Service
 * 
 * Handles CRUD operations for interaction record comments with role-based validation
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AuthService } from '../../auth/auth.service';
import { InteractionsService } from '../interactions.service';
import { CompaniesService } from '../../companies/companies.service';
import { PermissionService } from '../../permission/permission.service';
import { AuditService } from '../../audit/audit.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto, CommentListResponseDto } from './dto/comment-response.dto';

@Injectable()
export class CommentsService implements OnModuleDestroy {
  private readonly logger = new Logger(CommentsService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly interactionsService: InteractionsService,
    private readonly companiesService: CompaniesService,
    private readonly permissionService: PermissionService,
    private readonly auditService: AuditService,
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
      this.logger.warn('DATABASE_URL not configured, comment operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for CommentsService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Create a new comment on an interaction record
   * 
   * @param interactionId - Interaction record ID
   * @param createDto - Comment creation DTO
   * @param token - JWT token for authentication
   * @returns Created comment
   */
  async createComment(
    interactionId: string,
    createDto: CreateCommentDto,
    token: string,
  ): Promise<CommentResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Validate token and get user
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }

      // 2. Get interaction record (this already validates user access)
      const interaction = await this.interactionsService.findOne(interactionId, token);

      // 3. Get customer info to verify customer type
      const customer = await this.companiesService.findOne(interaction.customerId, token);

      // 4. Verify role-based access
      if (user.role === 'FRONTEND_SPECIALIST' && customer.customerType !== 'BUYER') {
        throw new ForbiddenException('前端专员只能评论采购商相关的互动记录');
      }
      if (user.role === 'BACKEND_SPECIALIST' && customer.customerType !== 'SUPPLIER') {
        throw new ForbiddenException('后端专员只能评论供应商相关的互动记录');
      }

      // 5. Validate comment content
      if (!createDto.content || createDto.content.trim().length === 0) {
        throw new BadRequestException('评论内容不能为空');
      }

      // 6. Sanitize comment content to prevent XSS attacks
      // Remove HTML tags and escape special characters
      const sanitizedContent = this.sanitizeContent(createDto.content.trim());

      // 7. Create comment (no transaction needed for single insert)
      const result = await this.pgPool.query(
        `INSERT INTO interaction_comments (interaction_id, user_id, content, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, interaction_id, user_id, content, created_at, updated_at, created_by, updated_by`,
        [interactionId, user.id, sanitizedContent, user.id],
      );

      if (result.rows.length === 0) {
        throw new InternalServerErrorException('创建评论失败');
      }

      const comment = result.rows[0];

      // 7. Record audit log (non-blocking)
      setImmediate(async () => {
        try {
          await this.auditService.log({
            action: 'COMMENT_CREATED',
            entityType: 'INTERACTION_COMMENT',
            entityId: comment.id,
            userId: user.id,
            operatorId: user.id,
            timestamp: new Date(),
            metadata: {
              interactionId: interactionId,
              commentLength: sanitizedContent.length,
            },
          });
        } catch (error) {
          this.logger.warn('Failed to log comment creation', error);
        }
      });

      return {
        id: comment.id,
        interactionId: comment.interaction_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        createdBy: comment.created_by,
        updatedBy: comment.updated_by,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Failed to create comment', error);
      throw new InternalServerErrorException('创建评论失败');
    }
  }

  /**
   * Get all comments for an interaction record
   * 
   * @param interactionId - Interaction record ID
   * @param token - JWT token for authentication
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @param since - ISO 8601 timestamp to fetch only comments created after this time (optional)
   * @returns Comment list with pagination
   */
  async getCommentsByInteractionId(
    interactionId: string,
    token: string,
    page: number = 1,
    limit: number = 20,
    since?: string,
  ): Promise<CommentListResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Lightweight permission check - only verify access without fetching full interaction
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }

      // Check if interaction exists and user has access (minimal query)
      const dataFilter = await this.permissionService.getDataAccessFilter(token);
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      if (dataFilter?.customerType === 'NONE') {
        throw new ForbiddenException('您没有权限查看互动记录');
      }

      // Minimal query to verify interaction exists and user has access
      const accessCheckQuery = `
        SELECT pci.id
        FROM product_customer_interactions pci
        INNER JOIN companies c ON c.id = pci.customer_id
        WHERE pci.id = $1
          AND pci.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND ($2::text IS NULL OR c.customer_type = $2)
        LIMIT 1
      `;
      const accessResult = await this.pgPool.query(accessCheckQuery, [interactionId, customerTypeFilter]);
      if (accessResult.rows.length === 0) {
        throw new NotFoundException('互动记录不存在或您没有权限查看');
      }

      // 2. Validate since parameter if provided
      if (since) {
        const sinceDate = new Date(since);
        if (isNaN(sinceDate.getTime())) {
          throw new BadRequestException('无效的时间戳格式');
        }
        
        // Validate date is not in the future
        const now = new Date();
        if (sinceDate > now) {
          throw new BadRequestException('时间戳不能是未来时间');
        }
        
        // Validate date is not too far in the past (more than 100 years ago)
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
        if (sinceDate < hundredYearsAgo) {
          throw new BadRequestException('时间戳超出合理范围');
        }
      }

      // 3. Calculate offset
      const offset = (page - 1) * limit;

      // 4. Build query with optional since parameter
      const queryParams: (string | number)[] = [interactionId];
      let paramIndex = 2;

      let commentsQuery = `
        SELECT 
          ic.id, 
          ic.interaction_id, 
          ic.user_id, 
          ic.content, 
          ic.created_at, 
          ic.updated_at, 
          ic.created_by, 
          ic.updated_by,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM interaction_comments ic
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE ic.interaction_id = $1 AND ic.deleted_at IS NULL
      `;

      // Add since filter if provided
      if (since) {
        commentsQuery += ` AND ic.created_at > $${paramIndex}`;
        queryParams.push(since);
        paramIndex++;
      }

      commentsQuery += `
        ORDER BY ic.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      // Build count query with optional since parameter
      let countQuery = `
        SELECT COUNT(*) as total
        FROM interaction_comments
        WHERE interaction_id = $1 AND deleted_at IS NULL
      `;
      const countParams: (string | number)[] = [interactionId];

      if (since) {
        countQuery += ` AND created_at > $2`;
        countParams.push(since);
      }

      const [commentsResult, countResult] = await Promise.all([
        this.pgPool.query(commentsQuery, queryParams),
        this.pgPool.query(countQuery, countParams),
      ]);

      const comments = commentsResult.rows.map((row) => {
        const createdAt = new Date(row.created_at);
        const updatedAt = new Date(row.updated_at);
        const isEdited = updatedAt.getTime() !== createdAt.getTime();
        
        return {
          id: row.id,
          interactionId: row.interaction_id,
          userId: row.user_id,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: row.created_by,
          updatedBy: row.updated_by,
          isEdited,
          userEmail: row.user_email || undefined,
          userFirstName: row.user_first_name || undefined,
          userLastName: row.user_last_name || undefined,
        };
      });

      return {
        data: comments,
        total: parseInt(countResult.rows[0].total, 10),
        page,
        limit,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Log detailed error information for debugging
      this.logger.error('Failed to get comments', {
        interactionId,
        page,
        limit,
        since,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new InternalServerErrorException(
        `获取评论列表失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * Update an existing comment
   * 
   * @param commentId - Comment ID
   * @param updateDto - Comment update DTO
   * @param token - JWT token for authentication
   * @returns Updated comment
   */
  async updateComment(
    commentId: string,
    updateDto: UpdateCommentDto,
    token: string,
  ): Promise<CommentResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Validate token and get user
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }

      // 2. Get existing comment (exclude soft-deleted)
      const commentResult = await this.pgPool.query(
        `SELECT 
          ic.id, 
          ic.interaction_id, 
          ic.user_id, 
          ic.content, 
          ic.created_at, 
          ic.updated_at, 
          ic.created_by, 
          ic.updated_by,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM interaction_comments ic
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE ic.id = $1 AND ic.deleted_at IS NULL`,
        [commentId],
      );

      if (commentResult.rows.length === 0) {
        throw new NotFoundException('评论不存在');
      }

      const comment = commentResult.rows[0];

      // 3. Verify comment owner
      const commentOwnerId = comment.user_id || comment.created_by;
      if (commentOwnerId !== user.id) {
        throw new ForbiddenException('您只能编辑自己创建的评论');
      }

      // 4. Validate updated content
      const sanitizedContent = this.sanitizeContent(updateDto.content.trim());
      if (!sanitizedContent || sanitizedContent.length === 0) {
        throw new BadRequestException('评论内容不能为空');
      }

      // 5. Store old content for audit log
      const oldContent = comment.content;

      // 6. Update comment
      const updateResult = await this.pgPool.query(
        `UPDATE interaction_comments
         SET content = $1,
             updated_at = CURRENT_TIMESTAMP,
             updated_by = $2
         WHERE id = $3 AND deleted_at IS NULL
         RETURNING 
           id, 
           interaction_id, 
           user_id, 
           content, 
           created_at, 
           updated_at, 
           created_by, 
           updated_by`,
        [sanitizedContent, user.id, commentId],
      );

      if (updateResult.rows.length === 0) {
        throw new NotFoundException('评论更新失败');
      }

      const updatedComment = updateResult.rows[0];

      // 7. Reuse user information from initial query (M2 Fix: avoid duplicate query)
      // User information was already fetched in the initial query (line 371-388)
      // No need to query again - reuse the data from the first query

      // 8. Record audit log
      try {
        await this.auditService.log({
          action: 'COMMENT_UPDATED',
          entityType: 'INTERACTION_COMMENT',
          entityId: commentId,
          oldValue: oldContent,
          newValue: sanitizedContent,
          userId: user.id,
          operatorId: user.id,
          timestamp: new Date(),
          metadata: {
            interactionId: comment.interaction_id,
            commentId: commentId,
          },
        });
      } catch (auditError) {
        // Log audit error but don't fail the request
        this.logger.error('Failed to log comment update audit', auditError);
      }

      const createdAt = new Date(updatedComment.created_at);
      const updatedAt = new Date(updatedComment.updated_at);
      const isEdited = updatedAt.getTime() !== createdAt.getTime();

      return {
        id: updatedComment.id,
        interactionId: updatedComment.interaction_id,
        userId: updatedComment.user_id,
        content: updatedComment.content,
        createdAt: updatedComment.created_at,
        updatedAt: updatedComment.updated_at,
        createdBy: updatedComment.created_by,
        updatedBy: updatedComment.updated_by,
        isEdited,
        userEmail: comment.user_email || undefined,
        userFirstName: comment.user_first_name || undefined,
        userLastName: comment.user_last_name || undefined,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Failed to update comment', error);
      throw new InternalServerErrorException('更新评论失败');
    }
  }

  /**
   * Delete a comment (soft delete)
   * 
   * @param commentId - Comment ID
   * @param token - JWT token for authentication
   * @returns Success message
   */
  async deleteComment(commentId: string, token: string): Promise<{ message: string }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Validate token and get user
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }

      // 2. Get existing comment (exclude soft-deleted)
      const commentResult = await this.pgPool.query(
        `SELECT 
          id, 
          interaction_id, 
          user_id, 
          created_by,
          content
        FROM interaction_comments
        WHERE id = $1 AND deleted_at IS NULL`,
        [commentId],
      );

      if (commentResult.rows.length === 0) {
        throw new NotFoundException('评论不存在');
      }

      const comment = commentResult.rows[0];

      // 3. Verify comment owner
      const commentOwnerId = comment.user_id || comment.created_by;
      if (commentOwnerId !== user.id) {
        throw new ForbiddenException('您只能删除自己创建的评论');
      }

      // 4. Perform soft delete
      const deleteResult = await this.pgPool.query(
        `UPDATE interaction_comments
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [commentId],
      );

      if (deleteResult.rows.length === 0) {
        throw new NotFoundException('评论删除失败');
      }

      // 5. Record audit log
      try {
        await this.auditService.log({
          action: 'COMMENT_DELETED',
          entityType: 'INTERACTION_COMMENT',
          entityId: commentId,
          oldValue: comment.content,
          newValue: null,
          userId: user.id,
          operatorId: user.id,
          timestamp: new Date(),
          metadata: {
            interactionId: comment.interaction_id,
            commentId: commentId,
            deletedAt: new Date().toISOString(),
          },
        });
      } catch (auditError) {
        // Log audit error but don't fail the request
        this.logger.error('Failed to log comment deletion audit', auditError);
      }

      return { message: '评论已删除' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Failed to delete comment', error);
      throw new InternalServerErrorException('删除评论失败');
    }
  }

  /**
   * Get a single comment by ID
   * 
   * @param commentId - Comment ID
   * @param token - JWT token for authentication
   * @returns Comment details
   */
  async getCommentById(commentId: string, token: string): Promise<CommentResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Get comment with user information
      const commentResult = await this.pgPool.query(
        `SELECT 
          ic.id, 
          ic.interaction_id, 
          ic.user_id, 
          ic.content, 
          ic.created_at, 
          ic.updated_at, 
          ic.created_by, 
          ic.updated_by,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM interaction_comments ic
        LEFT JOIN users u ON ic.user_id = u.id
        WHERE ic.id = $1 AND ic.deleted_at IS NULL`,
        [commentId],
      );

      if (commentResult.rows.length === 0) {
        throw new NotFoundException('评论不存在');
      }

      const comment = commentResult.rows[0];

      // 2. Lightweight permission check - only verify access without fetching full interaction
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }

      // Check if interaction exists and user has access (minimal query)
      const dataFilter = await this.permissionService.getDataAccessFilter(token);
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      if (dataFilter?.customerType === 'NONE') {
        throw new ForbiddenException('您没有权限查看互动记录');
      }

      // Minimal query to verify interaction exists and user has access
      const accessCheckQuery = `
        SELECT pci.id
        FROM product_customer_interactions pci
        INNER JOIN companies c ON c.id = pci.customer_id
        WHERE pci.id = $1
          AND pci.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND ($2::text IS NULL OR c.customer_type = $2)
        LIMIT 1
      `;
      const accessResult = await this.pgPool.query(accessCheckQuery, [comment.interaction_id, customerTypeFilter]);
      if (accessResult.rows.length === 0) {
        throw new NotFoundException('互动记录不存在或您没有权限查看');
      }

      const createdAt = new Date(comment.created_at);
      const updatedAt = new Date(comment.updated_at);
      const isEdited = updatedAt.getTime() !== createdAt.getTime();

      return {
        id: comment.id,
        interactionId: comment.interaction_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        createdBy: comment.created_by,
        updatedBy: comment.updated_by,
        isEdited,
        userEmail: comment.user_email || undefined,
        userFirstName: comment.user_first_name || undefined,
        userLastName: comment.user_last_name || undefined,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Failed to get comment', error);
      throw new InternalServerErrorException('获取评论详情失败');
    }
  }

  /**
   * Sanitize comment content to prevent XSS attacks
   * Removes HTML tags but preserves plain text content
   * 
   * @param content - Raw comment content
   * @returns Sanitized content (HTML tags removed, plain text preserved)
   */
  private sanitizeContent(content: string): string {
    // Remove HTML tags but preserve text content
    // This allows plain text comments while preventing HTML/script injection
    return content.replace(/<[^>]*>/g, '');
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for CommentsService');
    }
  }
}
