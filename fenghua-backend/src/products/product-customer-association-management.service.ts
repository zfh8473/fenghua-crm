/**
 * Product Customer Association Management Service
 * 
 * Handles CRUD operations for explicit product-customer associations
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';
import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../permission/permission.service';
import { AuditService } from '../audit/audit.service';
import { ProductsService } from './products.service';
import { CompaniesService } from '../companies/companies.service';
import { AssociationType } from './constants/association-types';
import {
  CreateProductCustomerAssociationDto,
  CreateCustomerProductAssociationDto,
  ProductCustomerAssociationResponseDto,
  CustomerProductAssociationResponseDto,
} from './dto/product-customer-association-management.dto';

@Injectable()
export class ProductCustomerAssociationManagementService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductCustomerAssociationManagementService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly permissionService: PermissionService,
    private readonly auditService: AuditService,
    private readonly productsService: ProductsService,
    private readonly companiesService: CompaniesService,
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
      this.logger.warn('DATABASE_URL not configured, product-customer association management operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductCustomerAssociationManagementService');
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
        this.logger.log('PostgreSQL connection pool closed for ProductCustomerAssociationManagementService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }

  /**
   * Create a product-customer association
   * 
   * @param productId - Product ID
   * @param createDto - Association creation DTO
   * @param token - JWT token for authentication
   * @returns Created association information
   */
  async createAssociation(
    productId: string,
    createDto: CreateProductCustomerAssociationDto,
    token: string,
  ): Promise<{ id: string; productId: string; customerId: string; associationType: AssociationType }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validate user token and get user info
      let user;
      try {
        user = await this.authService.validateToken(token);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new UnauthorizedException('无效的用户 token');
      }

      if (!user || !user.id) {
        await client.query('ROLLBACK');
        throw new UnauthorizedException('无效的用户 token');
      }

      if (!user.role) {
        await client.query('ROLLBACK');
        throw new UnauthorizedException('用户角色无效');
      }

      // 2. Validate product exists and is not deleted
      const product = await this.productsService.findOne(productId, user.id, token);
      if (!product || product.status !== 'active') {
        await client.query('ROLLBACK');
        throw new BadRequestException('产品不存在或非 active 状态');
      }

      // 3. Validate customer exists and is not deleted
      const customer = await this.companiesService.findOne(createDto.customerId, token);
      if (!customer) {
        await client.query('ROLLBACK');
        throw new NotFoundException('客户不存在');
      }

      // 4. Validate customer type matches user role
      if (user.role === 'FRONTEND_SPECIALIST' && customer.customerType !== 'BUYER') {
        await client.query('ROLLBACK');
        throw new ForbiddenException('前端专员只能关联采购商类型的客户');
      }

      if (user.role === 'BACKEND_SPECIALIST' && customer.customerType !== 'SUPPLIER') {
        await client.query('ROLLBACK');
        throw new ForbiddenException('后端专员只能关联供应商类型的客户');
      }

      // 5. Validate association type matches customer type
      if (
        (createDto.associationType === AssociationType.POTENTIAL_BUYER && customer.customerType !== 'BUYER') ||
        (createDto.associationType === AssociationType.POTENTIAL_SUPPLIER && customer.customerType !== 'SUPPLIER')
      ) {
        await client.query('ROLLBACK');
        throw new BadRequestException('关联类型与客户类型不匹配');
      }

      // 6. Validate association doesn't already exist
      const existingCheck = await client.query(
        'SELECT id FROM product_customer_associations WHERE product_id = $1 AND customer_id = $2 AND deleted_at IS NULL',
        [productId, createDto.customerId],
      );

      if (existingCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new BadRequestException('关联关系已存在');
      }

      // 7. Create association
      const insertQuery = `
        INSERT INTO product_customer_associations 
          (product_id, customer_id, association_type, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, product_id, customer_id, association_type
      `;
      const result = await client.query(insertQuery, [
        productId,
        createDto.customerId,
        createDto.associationType,
        user.id,
        new Date(),
      ]);

      const association = result.rows[0];
      await client.query('COMMIT');

      // 8. Record audit log (non-blocking, async execution)
      setImmediate(async () => {
        try {
          await this.auditService.log({
            action: 'ASSOCIATION_CREATED',
            entityType: 'PRODUCT_CUSTOMER_ASSOCIATION',
            entityId: association.id,
            userId: user.id,
            operatorId: user.id,
            timestamp: new Date(),
            metadata: {
              productId,
              customerId: createDto.customerId,
              associationType: createDto.associationType,
            },
          });
        } catch (error) {
          this.logger.warn('Failed to log association creation', error);
        }
      });

      return {
        id: association.id,
        productId: association.product_id,
        customerId: association.customer_id,
        associationType: association.association_type as AssociationType,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a product-customer association (soft delete)
   * 
   * @param productId - Product ID
   * @param customerId - Customer ID
   * @param token - JWT token for authentication
   */
  async deleteAssociation(
    productId: string,
    customerId: string,
    token: string,
  ): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validate user token and get user info
      let user;
      try {
        user = await this.authService.validateToken(token);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new UnauthorizedException('无效的用户 token');
      }

      if (!user || !user.id) {
        await client.query('ROLLBACK');
        throw new UnauthorizedException('无效的用户 token');
      }

      // 2. Validate association exists and is not deleted
      const associationCheck = await client.query(
        'SELECT id, created_by FROM product_customer_associations WHERE product_id = $1 AND customer_id = $2 AND deleted_at IS NULL',
        [productId, customerId],
      );

      if (associationCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundException('关联关系不存在或已被删除');
      }

      const association = associationCheck.rows[0];

      // 3. Optional: Validate user is the creator (business rule: only creator can delete)
      // Uncomment if needed:
      // if (association.created_by !== user.id) {
      //   await client.query('ROLLBACK');
      //   throw new ForbiddenException('您只能删除自己创建的关联关系');
      // }

      // 4. Perform soft delete
      await client.query(
        'UPDATE product_customer_associations SET deleted_at = NOW(), updated_by = $1, updated_at = NOW() WHERE id = $2',
        [user.id, association.id],
      );

      await client.query('COMMIT');

      // 5. Record audit log (non-blocking, async execution)
      setImmediate(async () => {
        try {
          await this.auditService.log({
            action: 'ASSOCIATION_DELETED',
            entityType: 'PRODUCT_CUSTOMER_ASSOCIATION',
            entityId: association.id,
            userId: user.id,
            operatorId: user.id,
            timestamp: new Date(),
            metadata: {
              productId,
              customerId,
            },
          });
        } catch (error) {
          this.logger.warn('Failed to log association deletion', error);
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create association within an existing transaction
   * Used when creating associations as part of another operation (e.g., interaction creation)
   * 
   * @param client - PostgreSQL client from existing transaction
   * @param productId - Product ID
   * @param customerId - Customer ID
   * @param associationType - Association type
   * @param userId - User ID (creator)
   * @returns Association ID if created, null if already exists
   */
  async createAssociationInTransaction(
    client: PoolClient,
    productId: string,
    customerId: string,
    associationType: AssociationType,
    userId: string,
  ): Promise<string | null> {
    // Check if association already exists
    const existingCheck = await client.query(
      'SELECT id FROM product_customer_associations WHERE product_id = $1 AND customer_id = $2 AND deleted_at IS NULL',
      [productId, customerId],
    );

    if (existingCheck.rows.length > 0) {
      // Association already exists, return null
      return null;
    }

    // Create association using INSERT ... ON CONFLICT DO NOTHING
    // Note: The partial unique index idx_product_customer_associations_unique ensures uniqueness
    // for (product_id, customer_id) where deleted_at IS NULL
    // We use the index name to properly handle the partial unique index
    const insertQuery = `
      INSERT INTO product_customer_associations 
        (id, product_id, customer_id, association_type, created_by, created_at, updated_by, updated_at, deleted_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), $4, NOW(), NULL)
      ON CONFLICT ON CONSTRAINT idx_product_customer_associations_unique DO NOTHING
      RETURNING id
    `;

    const result = await client.query(insertQuery, [
      productId,
      customerId,
      associationType,
      userId,
    ]);

    // If no rows returned, conflict occurred (shouldn't happen after check, but handle it)
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].id;
  }

  /**
   * Get product associations (only explicit associations from product_customer_associations table)
   * 
   * This method queries only the `product_customer_associations` table to get manually created associations.
   * All associations must be created manually through the product management or customer management interfaces.
   * 
   * The query uses a LEFT JOIN with `product_customer_interactions` to count interaction records
   * for each association, providing visibility into engagement history.
   * 
   * Performance considerations:
   * - Single table query with LEFT JOIN is more efficient than UNION queries
   * - Indexes on product_id and customer_id are used for filtering
   * - GROUP BY ensures proper aggregation of interaction counts
   * 
   * @param productId - Product ID (UUID)
   * @param token - JWT token for authentication
   * @param page - Page number (default: 1, minimum: 1)
   * @param limit - Items per page (default: 10, minimum: 1, maximum: 100)
   * @returns Object containing:
   *   - customers: Array of customer associations with interaction counts
   *   - total: Total number of customers associated with the product (for pagination)
   * @throws {BadRequestException} If database connection is not initialized
   * @throws {ForbiddenException} If user doesn't have permission to view customer information
   * @throws {NotFoundException} If product doesn't exist
   */
  async getProductAssociations(
    productId: string,
    token: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ customers: ProductCustomerAssociationResponseDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Validate and normalize input parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    // 1. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 2. Convert customer_type case (PermissionService returns lowercase, database stores uppercase)
    const customerTypeFilter = dataFilter?.customerType
      ? dataFilter.customerType.toUpperCase()
      : null;

    // 3. Handle permission check failure
    if (dataFilter?.customerType === 'NONE') {
      throw new ForbiddenException('您没有权限查看客户信息');
    }

    // 4. Validate product exists
    const productCheck = await this.pgPool.query(
      'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
      [productId],
    );
    if (productCheck.rows.length === 0) {
      throw new NotFoundException('产品不存在');
    }

    // 5. Query product associations (only from product_customer_associations table)
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        c.id,
        c.name,
        c.customer_type,
        pca.association_type,
        pca.created_by,
        COUNT(DISTINCT pci.id) as interaction_count
      FROM product_customer_associations pca
      INNER JOIN companies c ON c.id = pca.customer_id
      LEFT JOIN interaction_products ip ON ip.product_id = pca.product_id
      LEFT JOIN product_customer_interactions pci 
        ON pci.id = ip.interaction_id 
        AND pci.customer_id = pca.customer_id 
        AND pci.deleted_at IS NULL
      WHERE pca.product_id = $1 
        AND pca.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
      GROUP BY c.id, c.name, c.customer_type, pca.association_type, pca.created_by
      ORDER BY interaction_count DESC, c.name ASC
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

      // 6. Query total count (for pagination)
      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM product_customer_associations pca
        INNER JOIN companies c ON c.id = pca.customer_id
        WHERE pca.product_id = $1 
          AND pca.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND ($2::text IS NULL OR c.customer_type = $2)
      `;

      countResult = await this.pgPool.query(countQuery, [
        productId,
        customerTypeFilter,
      ]);
    } catch (error) {
      this.logger.error('Failed to query product associations', error);
      throw new BadRequestException('查询产品关联客户失败');
    }

    // Safely parse total, provide default value
    const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

    // 7. Map results
    const customers: ProductCustomerAssociationResponseDto[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      customerType: row.customer_type,
      interactionCount: parseInt(row.interaction_count || '0', 10) || 0,
      associationType: row.association_type as AssociationType | undefined,
      createdBy: row.created_by || undefined,
    }));

    return { customers, total };
  }

  /**
   * Get customer associations (only explicit associations from product_customer_associations table)
   * 
   * This method queries only the `product_customer_associations` table to get manually created associations.
   * All associations must be created manually through the product management or customer management interfaces.
   * 
   * The query uses a LEFT JOIN with `product_customer_interactions` to count interaction records
   * for each association, providing visibility into engagement history.
   * 
   * Performance considerations:
   * - Single table query with LEFT JOIN is more efficient than UNION queries
   * - Indexes on product_id and customer_id are used for filtering
   * - GROUP BY ensures proper aggregation of interaction counts
   * 
   * @param customerId - Customer ID (UUID)
   * @param token - JWT token for authentication
   * @param page - Page number (default: 1, minimum: 1)
   * @param limit - Items per page (default: 10, minimum: 1, maximum: 100)
   * @returns Object containing:
   *   - products: Array of product associations with interaction counts
   *   - total: Total number of products associated with the customer (for pagination)
   * @throws {BadRequestException} If database connection is not initialized
   * @throws {ForbiddenException} If user doesn't have permission to view the customer or product information
   * @throws {NotFoundException} If customer doesn't exist
   */
  async getCustomerAssociations(
    customerId: string,
    token: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ products: CustomerProductAssociationResponseDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Validate and normalize input parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    // 1. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 2. Convert customer_type case
    const customerTypeFilter = dataFilter?.customerType
      ? dataFilter.customerType.toUpperCase()
      : null;

    // 3. Handle permission check failure
    if (dataFilter?.customerType === 'NONE') {
      throw new ForbiddenException('您没有权限查看产品信息');
    }

    // 4. Validate customer exists
    const customerCheck = await this.pgPool.query(
      'SELECT id, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [customerId],
    );
    if (customerCheck.rows.length === 0) {
      throw new NotFoundException('客户不存在');
    }

    const customerType = customerCheck.rows[0].customer_type;
    // Permission check: if user can only view specific customer type, validate customer type
    if (customerTypeFilter && customerType !== customerTypeFilter) {
      throw new ForbiddenException('您没有权限查看该客户关联的产品');
    }

    // 5. Query customer associations (only from product_customer_associations table)
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        p.id,
        p.name,
        p.hs_code,
        p.category,
        pca.association_type,
        pca.created_by,
        COUNT(DISTINCT pci.id) as interaction_count
      FROM product_customer_associations pca
      INNER JOIN products p ON p.id = pca.product_id
      LEFT JOIN interaction_products ip ON ip.product_id = pca.product_id
      LEFT JOIN product_customer_interactions pci 
        ON pci.id = ip.interaction_id 
        AND pci.customer_id = pca.customer_id 
        AND pci.deleted_at IS NULL
      WHERE pca.customer_id = $1 
        AND pca.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND ($2::text IS NULL OR EXISTS (
          SELECT 1 FROM companies c 
          WHERE c.id = $1 AND c.customer_type = $2 AND c.deleted_at IS NULL
        ))
      GROUP BY p.id, p.name, p.hs_code, p.category, pca.association_type, pca.created_by
      ORDER BY interaction_count DESC, p.name ASC
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

      // 6. Query total count (for pagination)
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM product_customer_associations pca
        INNER JOIN products p ON p.id = pca.product_id
        WHERE pca.customer_id = $1 
          AND pca.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND ($2::text IS NULL OR EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = $1 AND c.customer_type = $2 AND c.deleted_at IS NULL
          ))
      `;

      countResult = await this.pgPool.query(countQuery, [
        customerId,
        customerTypeFilter,
      ]);
    } catch (error) {
      this.logger.error('Failed to query customer associations', error);
      throw new BadRequestException('查询客户关联产品失败');
    }

    // Safely parse total, provide default value
    const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

    // 7. Map results
    const products: CustomerProductAssociationResponseDto[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      hsCode: row.hs_code,
      category: row.category || undefined,
      interactionCount: parseInt(row.interaction_count || '0', 10) || 0,
      associationType: row.association_type as AssociationType | undefined,
      createdBy: row.created_by || undefined,
    }));

    return { products, total };
  }

  /**
   * Create a customer-product association (reverse direction)
   * 
   * @param customerId - Customer ID
   * @param createDto - Association creation DTO
   * @param token - JWT token for authentication
   * @returns Created association information
   */
  async createCustomerProductAssociation(
    customerId: string,
    createDto: CreateCustomerProductAssociationDto,
    token: string,
  ): Promise<{ id: string; productId: string; customerId: string; associationType: AssociationType }> {
    // Reuse createAssociation with reversed parameters
    return this.createAssociation(createDto.productId, {
      customerId,
      associationType: createDto.associationType,
    }, token);
  }

  /**
   * Delete a customer-product association (reverse direction)
   * 
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @param token - JWT token for authentication
   */
  async deleteCustomerProductAssociation(
    customerId: string,
    productId: string,
    token: string,
  ): Promise<void> {
    // Reuse deleteAssociation
    return this.deleteAssociation(productId, customerId, token);
  }
}

