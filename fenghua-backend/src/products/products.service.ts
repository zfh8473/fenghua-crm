/**
 * Products Service
 * 
 * Handles product CRUD operations
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, ForbiddenException, UnauthorizedException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { PermissionAuditService } from '../permission/permission-audit.service';
import { ProductCategoriesService } from '../product-categories/product-categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductsService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    private readonly permissionAuditService: PermissionAuditService,
    private readonly productCategoriesService: ProductCategoriesService,
  ) {
    this.initializeDatabaseConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl = this.configService.get<string>('DATABASE_URL') || 
                       this.configService.get<string>('PG_DATABASE_URL');
    
    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, product operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductsService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }


  /**
   * Check if product has associated interactions
   */
  async hasAssociatedInteractions(productId: string): Promise<boolean> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        'SELECT COUNT(*) as count FROM product_customer_interactions WHERE product_id = $1 AND deleted_at IS NULL',
        [productId]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      this.logger.error('Failed to check associated interactions', error);
      throw new BadRequestException('检查关联互动记录失败');
    }
  }

  /**
   * Check if HS code already exists for a specific user
   * HS code uniqueness is now per user (created_by + hs_code unique constraint)
   */
  async checkHsCodeExists(hsCode: string, excludeProductId?: string, userId?: string | null): Promise<boolean> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // If userId is provided, check uniqueness per user (created_by + hs_code)
      // If userId is null/undefined, check globally (for backward compatibility, but this should not happen)
      let query = 'SELECT COUNT(*) as count FROM products WHERE hs_code = $1 AND deleted_at IS NULL';
      const params: (string | number | null)[] = [hsCode];
      let paramIndex = 2;
      
      if (userId) {
        query += ` AND created_by = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }
      
      if (excludeProductId) {
        query += ` AND id != $${paramIndex}`;
        params.push(excludeProductId);
      }

      const result = await this.pgPool.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      this.logger.error('Failed to check HS code existence', error);
      throw new BadRequestException('检查HS编码是否存在失败');
    }
  }

  /**
   * Create a new product
   */
  async create(createProductDto: CreateProductDto, userId: string): Promise<ProductResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Validate category exists
    const category = await this.productCategoriesService.findByName(createProductDto.category);
    if (!category) {
      throw new BadRequestException(`产品类别"${createProductDto.category}"不存在`);
    }

    // Validate userId is a valid UUID, if not, use null (for audit purposes)
    // TODO: Fix token exchange to get proper user UUID from Twenty CRM
    let validUserId: string | null = userId;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for created_by`);
      validUserId = null; // Use null instead of invalid UUID
    }

    // Check HS code uniqueness (per user, based on created_by + hs_code unique constraint)
    const hsCodeExists = await this.checkHsCodeExists(createProductDto.hsCode, undefined, validUserId);
    if (hsCodeExists) {
      throw new ConflictException('HS编码已存在');
    }

    try {

      const result = await this.pgPool.query(
        `INSERT INTO products (
          name, hs_code, description, category, status, specifications, image_url, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          createProductDto.name,
          createProductDto.hsCode,
          createProductDto.description || null,
          createProductDto.category,
          'active',
          createProductDto.specifications ? JSON.stringify(createProductDto.specifications) : null,
          createProductDto.imageUrl || null,
          validUserId, // Use validated userId (or null)
        ]
      );

      const product = result.rows[0];
      const productDto = this.mapToResponseDto(product);

      // Audit log
      try {
        await this.auditService.log({
          action: 'CREATE',
          entityType: 'PRODUCT',
          entityId: productDto.id,
          userId: validUserId || 'system', // Use validated userId or 'system' as fallback
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            productName: productDto.name,
            hsCode: productDto.hsCode,
            originalUserId: userId, // Store original for debugging
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for product create', error);
      }

      return productDto;
    } catch (error) {
      this.logger.error('Failed to create product', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('创建产品失败');
    }
  }

  /**
   * Find all products with pagination and filters
   * Implements data isolation based on user role:
   * - ADMIN and DIRECTOR: can see all products
   * - Other roles: can only see products they created
   */
  async findAll(query: ProductQueryDto, userId: string, token: string): Promise<{ products: ProductResponseDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    try {
      // 1. Get user information (including role) for data isolation
      const user = await this.authService.validateToken(token);
      if (!user || !user.role) {
        throw new UnauthorizedException('用户信息无效');
      }

      // 2. Build WHERE clause with data isolation
      let whereClause = 'WHERE deleted_at IS NULL';
      const params: (string | number | boolean)[] = [];
      let paramIndex = 1;
      let orderByClause = 'ORDER BY created_at DESC';

      // 3. Data isolation: Add created_by filter for non-admin/director users
      const isAdminOrDirector = user.role === 'ADMIN' || user.role === 'DIRECTOR';
      if (!isAdminOrDirector) {
        // Regular users can only see products they created
        whereClause += ` AND created_by = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }
      // Admin and Director can see all products (no created_by filter)

      // Default: only show active products unless includeInactive is true
      // But if status filter is explicitly set, use it instead
      if (query.status) {
        // If status filter is set, use it (this overrides includeInactive)
        whereClause += ` AND status = $${paramIndex}`;
        params.push(query.status);
        paramIndex++;
      } else if (!query.includeInactive) {
        // If no status filter and includeInactive is false, only show active
        whereClause += ` AND status = 'active'`;
      }
      // If includeInactive is true and no status filter, show all statuses (no additional filter)

      // Category filter
      if (query.category) {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(query.category);
        paramIndex++;
      }

      // Search by name (fuzzy search)
      if (query.name) {
        whereClause += ` AND name ILIKE $${paramIndex}`;
        params.push(`%${query.name}%`);
        paramIndex++;
        // Sort by exact match first, then partial match
        orderByClause = `ORDER BY CASE WHEN name = $${paramIndex} THEN 1 WHEN name ILIKE $${paramIndex + 1} THEN 2 ELSE 3 END, name`;
        params.push(query.name, `${query.name}%`);
        paramIndex += 2;
      }

      // Search by HS code (exact or partial match)
      if (query.hsCode) {
        whereClause += ` AND hs_code LIKE $${paramIndex}`;
        params.push(`%${query.hsCode}%`);
        paramIndex++;
        // Sort by exact match first
        orderByClause = `ORDER BY CASE WHEN hs_code = $${paramIndex} THEN 1 ELSE 2 END, hs_code`;
        params.push(query.hsCode);
        paramIndex++;
      }

      // General search (searches both name and HS code)
      if (query.search && !query.name && !query.hsCode) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR hs_code LIKE $${paramIndex + 1})`;
        params.push(`%${query.search}%`, `%${query.search}%`);
        paramIndex += 2;
        // Sort by exact match in name first, then HS code
        orderByClause = `ORDER BY CASE WHEN name = $${paramIndex} THEN 1 WHEN name ILIKE $${paramIndex + 1} THEN 2 WHEN hs_code = $${paramIndex + 2} THEN 3 ELSE 4 END, name`;
        params.push(query.search, `${query.search}%`, query.search);
        paramIndex += 3;
      }

      // 4. Count total (simplified - use same WHERE clause without ORDER BY params)
      const countParams: (string | number | boolean)[] = [];
      let countParamIndex = 1;
      let countWhereClause = 'WHERE deleted_at IS NULL';

      // Apply data isolation to count query
      if (!isAdminOrDirector) {
        countWhereClause += ` AND created_by = $${countParamIndex}`;
        countParams.push(userId);
        countParamIndex++;
      }

      if (query.status) {
        countWhereClause += ` AND status = $${countParamIndex}`;
        countParams.push(query.status);
        countParamIndex++;
      } else if (!query.includeInactive) {
        countWhereClause += ` AND status = 'active'`;
      }

      if (query.category) {
        countWhereClause += ` AND category = $${countParamIndex}`;
        countParams.push(query.category);
        countParamIndex++;
      }

      if (query.name) {
        countWhereClause += ` AND name ILIKE $${countParamIndex}`;
        countParams.push(`%${query.name}%`);
        countParamIndex++;
      } else if (query.hsCode) {
        countWhereClause += ` AND hs_code LIKE $${countParamIndex}`;
        countParams.push(`%${query.hsCode}%`);
        countParamIndex++;
      } else if (query.search) {
        countWhereClause += ` AND (name ILIKE $${countParamIndex} OR hs_code LIKE $${countParamIndex + 1})`;
        countParams.push(`%${query.search}%`, `%${query.search}%`);
        countParamIndex += 2;
      }

      const countResult = await this.pgPool.query(
        `SELECT COUNT(*) as count FROM products ${countWhereClause}`,
        countParams
      );
      const total = parseInt(countResult.rows[0].count);

      // 5. Get products with proper ORDER BY (reuse whereClause and params from above)
      // Note: We need to rebuild params for SELECT query to match ORDER BY params
      const selectParams: (string | number | boolean)[] = [];
      let selectParamIndex = 1;
      let selectWhereClause = 'WHERE deleted_at IS NULL';
      
      // Apply data isolation to select query
      if (!isAdminOrDirector) {
        selectWhereClause += ` AND created_by = $${selectParamIndex}`;
        selectParams.push(userId);
        selectParamIndex++;
      }

      // Rebuild WHERE clause for SELECT (matching count query structure)
      if (query.status) {
        selectWhereClause += ` AND status = $${selectParamIndex}`;
        selectParams.push(query.status);
        selectParamIndex++;
      } else if (!query.includeInactive) {
        selectWhereClause += ` AND status = 'active'`;
      }

      if (query.category) {
        selectWhereClause += ` AND category = $${selectParamIndex}`;
        selectParams.push(query.category);
        selectParamIndex++;
      }

      if (query.name) {
        selectWhereClause += ` AND name ILIKE $${selectParamIndex}`;
        selectParams.push(`%${query.name}%`);
        selectParamIndex++;
        orderByClause = `ORDER BY CASE WHEN name = $${selectParamIndex} THEN 1 WHEN name ILIKE $${selectParamIndex + 1} THEN 2 ELSE 3 END, name`;
        selectParams.push(query.name, `${query.name}%`);
        selectParamIndex += 2;
      } else if (query.hsCode) {
        selectWhereClause += ` AND hs_code LIKE $${selectParamIndex}`;
        selectParams.push(`%${query.hsCode}%`);
        selectParamIndex++;
        orderByClause = `ORDER BY CASE WHEN hs_code = $${selectParamIndex} THEN 1 ELSE 2 END, hs_code`;
        selectParams.push(query.hsCode);
        selectParamIndex++;
      } else if (query.search) {
        selectWhereClause += ` AND (name ILIKE $${selectParamIndex} OR hs_code LIKE $${selectParamIndex + 1})`;
        selectParams.push(`%${query.search}%`, `%${query.search}%`);
        selectParamIndex += 2;
        orderByClause = `ORDER BY CASE WHEN name = $${selectParamIndex} THEN 1 WHEN name ILIKE $${selectParamIndex + 1} THEN 2 WHEN hs_code = $${selectParamIndex + 2} THEN 3 ELSE 4 END, name`;
        selectParams.push(query.search, `${query.search}%`, query.search);
        selectParamIndex += 3;
      }

      // Get products
      const productsResult = await this.pgPool.query(
        `SELECT * FROM products ${selectWhereClause} ${orderByClause} LIMIT $${selectParamIndex} OFFSET $${selectParamIndex + 1}`,
        [...selectParams, limit, offset]
      );

      const products = productsResult.rows.map(row => this.mapToResponseDto(row));

      return { products, total };
    } catch (error) {
      this.logger.error('Failed to find products', error);
      throw new BadRequestException('查询产品列表失败');
    }
  }

  /**
   * Find one product by ID with permission check
   * Implements permission validation:
   * - ADMIN and DIRECTOR: can access all products
   * - Other roles: can only access products they created
   */
  async findOne(id: string, userId: string, token: string): Promise<ProductResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // 1. Query product
      const result = await this.pgPool.query(
        'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('产品不存在');
      }

      const product = result.rows[0];

      // 2. Permission validation
      const user = await this.authService.validateToken(token);
      if (!user || !user.role) {
        throw new UnauthorizedException('用户信息无效');
      }

      const isAdminOrDirector = user.role === 'ADMIN' || user.role === 'DIRECTOR';
      const isOwner = product.created_by === userId;

      if (!isAdminOrDirector && !isOwner) {
        // Log permission violation
        await this.permissionAuditService.logPermissionViolation(
          token,
          'PRODUCT',
          id,
          'ACCESS',
          null,
          null
        );
        throw new ForbiddenException('您没有权限访问该产品');
      }

      return this.mapToResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Failed to find product', error);
      throw new BadRequestException('查询产品失败');
    }
  }

  /**
   * Update a product
   */
  async update(id: string, updateProductDto: UpdateProductDto, userId: string, token: string): Promise<ProductResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Check if product exists and user has permission
    await this.findOne(id, userId, token);

    try {
      const updateFields: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      if (updateProductDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(updateProductDto.name);
        paramIndex++;
      }

      // Note: HS code cannot be updated per AC #5 - ignore if provided
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((updateProductDto as any).hsCode !== undefined) {
        this.logger.warn(`Attempt to update HS code for product ${id} - ignored per AC #5`);
      }

      if (updateProductDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(updateProductDto.description);
        paramIndex++;
      }

      if (updateProductDto.category !== undefined) {
        // Validate category existence
        const category = await this.productCategoriesService.findByName(updateProductDto.category);
        if (!category) {
          throw new BadRequestException(`产品类别"${updateProductDto.category}"不存在`);
        }
        updateFields.push(`category = $${paramIndex}`);
        values.push(updateProductDto.category);
        paramIndex++;
      }

      if (updateProductDto.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        values.push(updateProductDto.status);
        paramIndex++;
      }

      if (updateProductDto.specifications !== undefined) {
        updateFields.push(`specifications = $${paramIndex}`);
        values.push(JSON.stringify(updateProductDto.specifications));
        paramIndex++;
      }

      if (updateProductDto.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex}`);
        values.push(updateProductDto.imageUrl);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return this.findOne(id, userId, token);
      }

      // Validate userId is a valid UUID, if not, use null (for audit purposes)
      // TODO: Fix token exchange to get proper user UUID from Twenty CRM
      let validUserId: string | null = userId;
      if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for updated_by`);
        validUserId = null; // Use null instead of invalid UUID
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      values.push(validUserId); // Use validated userId (or null)
      paramIndex++;

      values.push(id);

      // Get old product data for audit
      const oldProduct = await this.findOne(id, userId, token);

      const result = await this.pgPool.query(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`,
        values
      );

      const updatedProduct = this.mapToResponseDto(result.rows[0]);

      // Audit log
      try {
        await this.auditService.log({
          action: 'UPDATE',
          entityType: 'PRODUCT',
          entityId: updatedProduct.id,
          oldValue: this.safeStringify(oldProduct),
          newValue: this.safeStringify(updatedProduct),
          userId: validUserId || 'system', // Use validated userId or 'system' as fallback
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            productName: updatedProduct.name,
            originalUserId: userId, // Store original for debugging
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for product update', error);
      }

      return updatedProduct;
    } catch (error) {
      this.logger.error('Failed to update product', error);
      throw new BadRequestException('更新产品失败');
    }
  }

  /**
   * Delete a product (soft delete or hard delete)
   */
  async remove(id: string, userId: string, token: string): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Check if product exists and user has permission
    const product = await this.findOne(id, userId, token);

    // Check for associated interactions
    const hasInteractions = await this.hasAssociatedInteractions(id);

    try {
      if (hasInteractions) {
        // Soft delete
        await this.pgPool.query(
          `UPDATE products SET status = 'inactive', deleted_at = NOW(), updated_by = $1 WHERE id = $2`,
          [userId, id]
        );
        this.logger.log(`Product ${id} soft deleted (has associated interactions)`);
      } else {
        // Hard delete
        await this.pgPool.query(
          'DELETE FROM products WHERE id = $1',
          [id]
        );
        this.logger.log(`Product ${id} hard deleted (no associated interactions)`);
      }

      // Audit log
      try {
        await this.auditService.log({
          action: 'DELETE',
          entityType: 'PRODUCT',
          entityId: product.id,
          oldValue: this.safeStringify(product),
          userId: userId,
          operatorId: userId,
          timestamp: new Date(),
          metadata: {
            productName: product.name,
            deleteType: hasInteractions ? 'soft' : 'hard',
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for product delete', error);
      }
    } catch (error) {
      this.logger.error('Failed to delete product', error);
      throw new BadRequestException('删除产品失败');
    }
  }

  /**
   * Safely stringify object for audit logging
   */
  private safeStringify(obj: unknown): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        // Filter out circular references and functions
        if (typeof value === 'function') {
          return '[Function]';
        }
        return value;
      });
    } catch (error) {
      this.logger.warn('Failed to stringify object for audit log', error);
      return JSON.stringify({ error: 'Failed to serialize object' });
    }
  }

  /**
   * Map database row to response DTO
   */
  private mapToResponseDto(row: any): ProductResponseDto {
    return {
      id: row.id,
      name: row.name,
      hsCode: row.hs_code,
      description: row.description,
      category: row.category,
      status: row.status,
      specifications: row.specifications ? (typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications) : undefined,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };
  }

  /**
   * Cleanup resources on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for ProductsService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}

