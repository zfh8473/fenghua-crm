/**
 * Product Customer Association Service
 * 
 * Handles queries for product-customer associations
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
import { ProductCustomerAssociationDto } from './dto/product-customer-association.dto';

@Injectable()
export class ProductCustomerAssociationService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductCustomerAssociationService.name);
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
      this.logger.warn('DATABASE_URL not configured, product-customer association operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductCustomerAssociationService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }


  /**
   * Get product customers with pagination and role-based filtering
   */
  async getProductCustomers(
    productId: string,
    token: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ customers: ProductCustomerAssociationDto[]; total: number }> {
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
      await this.permissionAuditService.logPermissionViolation(token, 'PRODUCT_ASSOCIATION', productId, 'ACCESS', null, null);
      throw new ForbiddenException('您没有权限查看客户信息');
    }

    // 4. 验证产品是否存在
    const productCheck = await this.pgPool.query(
      'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
      [productId],
    );
    if (productCheck.rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }

    // 5. 查询产品关联的客户和互动数量（使用 SQL JOIN）
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        c.id,
        c.name,
        c.customer_type,
        COUNT(pci.id) as interaction_count
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      WHERE pci.product_id = $1 
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
      GROUP BY c.id, c.name, c.customer_type
      ORDER BY interaction_count DESC
      LIMIT $3 OFFSET $4
    `;

    let result;
    let countResult;
    try {
      result = await this.pgPool.query(query, [
        productId,
        customerTypeFilter,
        limit,
        offset,
      ]);

      // 6. 查询总数（用于分页）
      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM product_customer_interactions pci
        INNER JOIN companies c ON c.id = pci.customer_id
        WHERE pci.product_id = $1 
          AND pci.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND ($2::text IS NULL OR c.customer_type = $2)
      `;

      countResult = await this.pgPool.query(countQuery, [
        productId,
        customerTypeFilter,
      ]);
    } catch (error) {
      this.logger.error('Failed to query product customers', error);
      throw new BadRequestException('查询产品关联客户失败');
    }

    // 安全地解析 total，提供默认值
    const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

    // 7. 映射结果，安全地解析 interaction_count
    const customers: ProductCustomerAssociationDto[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      customerType: row.customer_type,
      interactionCount: parseInt(row.interaction_count || '0', 10) || 0,
    }));

    return { customers, total };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for ProductCustomerAssociationService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}

