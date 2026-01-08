/**
 * Customer Product Interaction History Service
 * 
 * Handles queries for customer-product interaction history
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PermissionService } from '../permission/permission.service';
import { PermissionAuditService } from '../permission/permission-audit.service';
import {
  CustomerProductInteractionDto,
  FileAttachmentDto,
} from './dto/customer-product-interaction-history.dto';

@Injectable()
export class CustomerProductInteractionHistoryService implements OnModuleDestroy {
  private readonly logger = new Logger(CustomerProductInteractionHistoryService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
    private readonly permissionAuditService: PermissionAuditService,
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
      this.logger.warn('DATABASE_URL not configured, customer-product interaction history operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for CustomerProductInteractionHistoryService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }


  /**
   * Get customer product interactions with pagination and role-based filtering
   */
  async getCustomerProductInteractions(
    customerId: string,
    productId: string,
    token: string,
    page: number = 1,
    limit: number = 20,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ interactions: CustomerProductInteractionDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 验证和规范化输入参数
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    // 1. 获取用户权限和数据访问过滤器
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 2. 转换 customer_type 大小写（PermissionService 返回小写，数据库存储大写）
    const customerTypeFilter = dataFilter?.customerType
      ? dataFilter.customerType.toUpperCase()
      : null;

    // 3. 处理权限检查失败
    if (dataFilter?.customerType === 'NONE') {
      // Log permission violation
      await this.permissionAuditService.logPermissionViolation(token, 'INTERACTION', `${customerId}/${productId}`, 'ACCESS', null, null);
      throw new ForbiddenException('您没有权限查看互动历史');
    }

    // 4. 验证客户是否存在
    const customerCheck = await this.pgPool.query(
      'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [customerId],
    );
    if (customerCheck.rows.length === 0) {
      throw new NotFoundException('客户不存在');
    }

    const customerType = customerCheck.rows[0].customer_type;
    // 权限检查：如果用户只能查看特定类型的客户，验证客户类型
    if (customerTypeFilter && customerType !== customerTypeFilter) {
      // Log permission violation
      await this.permissionAuditService.logPermissionViolation(
        token,
        'INTERACTION',
        `${customerId}/${productId}`,
        'ACCESS',
        customerTypeFilter,
        customerType,
      );
      throw new ForbiddenException('您没有权限查看该客户的互动历史');
    }

    // 5. 验证产品是否存在
    const productCheck = await this.pgPool.query(
      'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
      [productId],
    );
    if (productCheck.rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }

    // 6. 查询客户-产品互动历史（使用 SQL JOIN 获取附件和创建者信息）
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        pci.id,
        pci.interaction_type,
        pci.interaction_date,
        pci.description,
        pci.status,
        pci.additional_info,
        pci.created_at,
        pci.created_by,
        u.email as creator_email,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', fa.id,
              'fileName', fa.file_name,
              'fileUrl', fa.file_url,
              'fileType', fa.file_type,
              'fileSize', fa.file_size,
              'mimeType', fa.mime_type
            )
          ) FILTER (WHERE fa.id IS NOT NULL),
          '[]'::json
        ) as attachments
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      LEFT JOIN users u ON u.id = pci.created_by
      LEFT JOIN file_attachments fa ON fa.interaction_id = pci.id AND fa.deleted_at IS NULL
      WHERE pci.customer_id = $1 
        AND pci.product_id = $2
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($3::text IS NULL OR c.customer_type = $3)
      GROUP BY pci.id, pci.interaction_type, pci.interaction_date, pci.description, 
               pci.status, pci.additional_info, pci.created_at, pci.created_by,
               u.email, u.first_name, u.last_name
      ORDER BY pci.interaction_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $4 OFFSET $5
    `;

    let result;
    let countResult;
    try {
      result = await this.pgPool.query(query, [
        customerId,
        productId,
        customerTypeFilter,
        limit,
        offset,
      ]);

      // 7. 查询总数（用于分页）
      const countQuery = `
        SELECT COUNT(DISTINCT pci.id) as total
        FROM product_customer_interactions pci
        INNER JOIN companies c ON c.id = pci.customer_id
        WHERE pci.customer_id = $1 
          AND pci.product_id = $2
          AND pci.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND ($3::text IS NULL OR c.customer_type = $3)
      `;

      countResult = await this.pgPool.query(countQuery, [
        customerId,
        productId,
        customerTypeFilter,
      ]);
    } catch (error) {
      this.logger.error('Failed to query customer product interactions', error);
      throw new BadRequestException('查询客户产品互动历史失败');
    }

    // 安全地解析 total，提供默认值
    const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

    // 8. 映射结果
    const interactions: CustomerProductInteractionDto[] = result.rows.map((row) => {
      // 解析附件 JSON
      let attachments: FileAttachmentDto[] = [];
      try {
        if (row.attachments && typeof row.attachments === 'string') {
          attachments = JSON.parse(row.attachments);
        } else if (Array.isArray(row.attachments)) {
          attachments = row.attachments;
        }
      } catch (error) {
        this.logger.warn('Failed to parse attachments JSON', error);
        attachments = [];
      }

      return {
        id: row.id,
        interactionType: row.interaction_type,
        interactionDate: row.interaction_date,
        description: row.description || undefined,
        status: row.status || undefined,
        additionalInfo: row.additional_info || undefined,
        createdAt: row.created_at,
        createdBy: row.created_by || undefined,
        creator: row.creator_email || row.creator_first_name || row.creator_last_name
          ? {
              email: row.creator_email || undefined,
              firstName: row.creator_first_name || undefined,
              lastName: row.creator_last_name || undefined,
            }
          : undefined,
        attachments: attachments.map((att: any) => ({
          id: att.id,
          fileName: att.fileName || att.file_name,
          fileUrl: att.fileUrl || att.file_url,
          fileType: att.fileType || att.file_type,
          fileSize: parseInt(att.fileSize || att.file_size || '0', 10) || 0,
          mimeType: att.mimeType || att.mime_type || undefined,
        })),
      };
    });

    return { interactions, total };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for CustomerProductInteractionHistoryService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}

