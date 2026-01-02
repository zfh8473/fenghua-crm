/**
 * Customer Timeline Service
 * 
 * Service for retrieving customer timeline (all interactions for a customer)
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
import { CustomerTimelineInteractionDto } from './dto/customer-timeline.dto';

@Injectable()
export class CustomerTimelineService implements OnModuleDestroy {
  private readonly logger = new Logger(CustomerTimelineService.name);
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
    try {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        this.logger.warn('DATABASE_URL not configured, database operations will fail');
        return;
      }

      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for CustomerTimelineService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Cleanup database connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for CustomerTimelineService');
      } catch (error) {
        this.logger.error('Error closing PostgreSQL connection pool', error);
      }
    }
  }


  /**
   * Get customer timeline with pagination, sorting, date range filtering, and role-based filtering
   * 
   * Key differences from Story 3.5:
   * - Does not filter by product (queries all interactions for the customer)
   * - Includes product information (product_id, product_name, product_hs_code)
   * - Supports sortOrder parameter (asc/desc)
   * - Supports dateRange parameter (week/month/year/all)
   * - Default limit is 50 (not 20)
   */
  async getCustomerTimeline(
    customerId: string,
    token: string,
    page: number = 1,
    limit: number = 50,
    sortOrder: 'asc' | 'desc' = 'desc',
    dateRange: 'week' | 'month' | 'year' | 'all' = 'all',
  ): Promise<{ interactions: CustomerTimelineInteractionDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 验证和规范化输入参数
    if (page < 1) page = 1;
    if (limit < 1) limit = 50;
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
      await this.permissionAuditService.logPermissionViolation(token, 'TIMELINE', customerId, 'ACCESS', null, null);
      throw new ForbiddenException('您没有权限查看时间线');
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
        'TIMELINE',
        customerId,
        'ACCESS',
        customerTypeFilter,
        customerType,
      );
      throw new ForbiddenException('您没有权限查看该客户的时间线');
    }

    // 5. 计算时间范围起始日期
    let dateRangeStart: Date | null = null;
    if (dateRange === 'week') {
      dateRangeStart = new Date();
      dateRangeStart.setDate(dateRangeStart.getDate() - 7);
    } else if (dateRange === 'month') {
      dateRangeStart = new Date();
      dateRangeStart.setDate(dateRangeStart.getDate() - 30);
    } else if (dateRange === 'year') {
      dateRangeStart = new Date();
      dateRangeStart.setDate(dateRangeStart.getDate() - 365);
    }
    // dateRange === 'all' means dateRangeStart remains null

    // 6. 验证排序方向参数（防御性编程）
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      throw new BadRequestException('Invalid sortOrder parameter. Must be "asc" or "desc"');
    }

    // 7. 确定排序方向（不能参数化，必须使用字符串插值）
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // 7. 查询客户时间线（使用 SQL JOIN 获取产品信息、附件和创建者信息）
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
        p.id as product_id,
        p.name as product_name,
        p.hs_code as product_hs_code,
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
      LEFT JOIN products p ON p.id = pci.product_id AND p.deleted_at IS NULL
      LEFT JOIN users u ON u.id = pci.created_by
      LEFT JOIN file_attachments fa ON fa.interaction_id = pci.id AND fa.deleted_at IS NULL
      WHERE pci.customer_id = $1
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
        AND ($3::timestamp IS NULL OR pci.interaction_date >= $3)
      GROUP BY pci.id, pci.interaction_type, pci.interaction_date, pci.description,
               pci.status, pci.additional_info, pci.created_at, pci.created_by,
               p.id, p.name, p.hs_code,
               u.email, u.first_name, u.last_name
      ORDER BY pci.interaction_date ${orderDirection}
      LIMIT $4 OFFSET $5
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT pci.id) as total
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      WHERE pci.customer_id = $1
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
        AND ($3::timestamp IS NULL OR pci.interaction_date >= $3)
    `;

    try {
      const [result, countResult] = await Promise.all([
        this.pgPool.query(query, [
          customerId,
          customerTypeFilter,
          dateRangeStart,
          limit,
          offset,
        ]),
        this.pgPool.query(countQuery, [
          customerId,
          customerTypeFilter,
          dateRangeStart,
        ]),
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

      const interactions: CustomerTimelineInteractionDto[] = result.rows.map((row) => {
        // 解析附件 JSON
        let attachments: any[] = [];
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
          interactionDate: row.interaction_date.toISOString(),
          description: row.description,
          status: row.status,
          additionalInfo: row.additional_info,
          createdAt: row.created_at.toISOString(),
          createdBy: row.created_by,
          creatorEmail: row.creator_email,
          creatorFirstName: row.creator_first_name,
          creatorLastName: row.creator_last_name,
          productId: row.product_id,
          productName: row.product_name,
          productHsCode: row.product_hs_code,
          attachments: attachments,
        };
      });

      return { interactions, total };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        `Failed to get customer timeline for customer ${customerId}`,
        error,
      );
      throw new BadRequestException('获取客户时间线失败');
    }
  }
}

