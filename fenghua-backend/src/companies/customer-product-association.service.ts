/**
 * Customer Product Association Service
 * 
 * Handles queries for customer-product associations
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
import { CustomerProductAssociationDto } from './dto/customer-product-association.dto';

@Injectable()
export class CustomerProductAssociationService implements OnModuleDestroy {
  private readonly logger = new Logger(CustomerProductAssociationService.name);
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
      this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, customer-product association operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
      });
      this.logger.log('PostgreSQL connection pool initialized for CustomerProductAssociationService');
    } catch (error) {
      this.logger.error(
        'Failed to initialize PostgreSQL connection pool',
        error,
      );
    }
  }


  /**
   * Get customer products with pagination and role-based filtering
   */
  async getCustomerProducts(
    customerId: string,
    token: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ products: CustomerProductAssociationDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 验证和规范化输入参数
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
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
      await this.permissionAuditService.logPermissionViolation(token, 'PRODUCT_ASSOCIATION', customerId, 'ACCESS', null, null);
      throw new ForbiddenException('您没有权限查看产品信息');
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
        'PRODUCT_ASSOCIATION',
        customerId,
        'ACCESS',
        customerTypeFilter,
        customerType,
      );
      throw new ForbiddenException('您没有权限查看该客户关联的产品');
    }

    // 5. 查询客户关联的产品和互动数量（使用 SQL JOIN）
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        p.id,
        p.name,
        p.hs_code,
        COUNT(pci.id) as interaction_count
      FROM product_customer_interactions pci
      INNER JOIN products p ON p.id = pci.product_id
      INNER JOIN companies c ON c.id = pci.customer_id
      WHERE pci.customer_id = $1 
        AND pci.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
      GROUP BY p.id, p.name, p.hs_code
      ORDER BY interaction_count DESC
      LIMIT $3 OFFSET $4
    `;

    let result;
    let countResult;
    try {
      result = await this.pgPool.query(query, [
        customerId,
        customerTypeFilter,
        limit,
        offset,
      ]);

      // 6. 查询总数（用于分页）
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM product_customer_interactions pci
        INNER JOIN products p ON p.id = pci.product_id
        INNER JOIN companies c ON c.id = pci.customer_id
        WHERE pci.customer_id = $1 
          AND pci.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND ($2::text IS NULL OR c.customer_type = $2)
      `;

      countResult = await this.pgPool.query(countQuery, [
        customerId,
        customerTypeFilter,
      ]);
    } catch (error) {
      this.logger.error('Failed to query customer products', error);
      throw new BadRequestException('查询客户关联产品失败');
    }

    // 安全地解析 total，提供默认值
    const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

    // 7. 映射结果，安全地解析 interaction_count
    const products: CustomerProductAssociationDto[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      hsCode: row.hs_code,
      interactionCount: parseInt(row.interaction_count || '0', 10) || 0,
    }));

    return { products, total };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for CustomerProductAssociationService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}

