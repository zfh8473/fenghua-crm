/**
 * Interactions Service
 * 
 * Handles CRUD operations for interaction records with role-based validation
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AuthService } from '../auth/auth.service';
import { ProductsService } from '../products/products.service';
import { CompaniesService } from '../companies/companies.service';
import { PermissionService } from '../permission/permission.service';
import { AuditService } from '../audit/audit.service';
// Note: ProductCustomerAssociationManagementService is kept for potential future use
// but is no longer used for automatic association creation
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { InteractionResponseDto } from './dto/interaction-response.dto';
import { InteractionSearchQueryDto } from './dto/interaction-search-query.dto';

/**
 * Error codes for interaction operations (3000-3999)
 */
export enum InteractionErrorCode {
  INTERACTION_CREATE_FAILED = 3001,
  INTERACTION_INVALID_CUSTOMER_TYPE = 3002,
  INTERACTION_INVALID_PRODUCT = 3003,
  INTERACTION_MISSING_REQUIRED_FIELD = 3004,
}

@Injectable()
export class InteractionsService implements OnModuleDestroy {
  private readonly logger = new Logger(InteractionsService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly productsService: ProductsService,
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
      this.logger.warn('DATABASE_URL not configured, interaction operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for InteractionsService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Cleanup database connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for InteractionsService');
    }
  }

  /**
   * Create a new interaction record
   * 
   * **Prerequisites:**
   * - Product and customer must have an existing association in `product_customer_associations` table
   * - Association must be created manually through product management or customer management interfaces
   * 
   * **Validation:**
   * - Validates that association exists before creating interaction record
   * - If association doesn't exist, throws BadRequestException with clear error message
   * 
   * **Multi-product support:**
   * - Supports creating interactions for multiple products (productIds: string[])
   * - Creates one interaction record per product
   * - All interaction records share the same customer, interaction type, date, description, etc.
   * - All records are created within a single transaction (atomic operation)
   * 
   * @param createDto - Interaction creation DTO (supports single productId or multiple productIds)
   * @param token - JWT token for authentication
   * @returns Created interaction record(s)
   * @throws {BadRequestException} If database connection is not initialized, product/customer is invalid, customer type is invalid, or association doesn't exist
   * @throws {UnauthorizedException} If token is invalid
   * @throws {ForbiddenException} If user role doesn't match customer type
   */
  async create(
    createDto: CreateInteractionDto,
    token: string,
  ): Promise<InteractionResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Use database transaction to ensure data consistency
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validate user token and get user info
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }
      
      // Validate user has a valid role
      if (!user.role) {
        await client.query('ROLLBACK');
        throw new UnauthorizedException('用户角色无效');
      }

      // 2. Validate all products exist and are active (batch query to avoid N+1)
      const productIds = createDto.productIds;
      if (productIds.length === 0) {
        await client.query('ROLLBACK');
        throw new BadRequestException({
          message: '至少需要选择一个产品',
          code: InteractionErrorCode.INTERACTION_INVALID_PRODUCT,
        });
      }

      // Batch query all products at once
      const productsQuery = await client.query(
        'SELECT id, name, status FROM products WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL',
        [productIds],
      );

      const foundProducts = productsQuery.rows;
      const foundProductIds = new Set(foundProducts.map((p) => p.id));

      // Check if all products exist
      const missingProductIds = productIds.filter((id) => !foundProductIds.has(id));
      if (missingProductIds.length > 0) {
        await client.query('ROLLBACK');
        throw new BadRequestException({
          message: `产品不存在: ${missingProductIds.join(', ')}`,
          code: InteractionErrorCode.INTERACTION_INVALID_PRODUCT,
        });
      }

      // Check if all products are active
      const inactiveProducts = foundProducts.filter((p) => p.status !== 'active');
      if (inactiveProducts.length > 0) {
        await client.query('ROLLBACK');
        throw new BadRequestException({
          message: `以下产品非 active 状态: ${inactiveProducts.map((p) => p.name || p.id).join(', ')}`,
          code: InteractionErrorCode.INTERACTION_INVALID_PRODUCT,
        });
      }

      // 3. Validate customer exists and type matches user role
      let customer;
      try {
        customer = await this.companiesService.findOne(createDto.customerId, token);
      } catch (error: any) {
        await client.query('ROLLBACK');
        // Handle database foreign key constraint error
        if (error.code === '23503') {
          // Foreign key violation
          throw new BadRequestException({
            message: '客户不存在',
            code: InteractionErrorCode.INTERACTION_INVALID_CUSTOMER_TYPE,
          });
        }
        // Re-throw other errors
        throw error;
      }

      // Validate customer type matches user role
      if (user.role === 'FRONTEND_SPECIALIST' && customer.customerType !== 'BUYER') {
        await client.query('ROLLBACK');
        // Log permission violation (non-blocking)
        try {
          await this.permissionService.canAccess(token, 'buyer').catch(() => {
            // Log permission violation but don't block
          });
        } catch (error) {
          // Ignore permission check errors
        }
        throw new ForbiddenException({
          message: '前端专员只能选择采购商类型的客户',
          code: InteractionErrorCode.INTERACTION_INVALID_CUSTOMER_TYPE,
        });
      }

      if (user.role === 'BACKEND_SPECIALIST' && customer.customerType !== 'SUPPLIER') {
        await client.query('ROLLBACK');
        // Log permission violation (non-blocking)
        try {
          await this.permissionService.canAccess(token, 'supplier').catch(() => {
            // Log permission violation but don't block
          });
        } catch (error) {
          // Ignore permission check errors
        }
        throw new ForbiddenException({
          message: '后端专员只能选择供应商类型的客户',
          code: InteractionErrorCode.INTERACTION_INVALID_CUSTOMER_TYPE,
        });
      }

      // 4. Validate that associations exist for all products (products must be pre-associated with customer)
      for (const productId of productIds) {
        const associationCheck = await client.query(
          'SELECT id FROM product_customer_associations WHERE product_id = $1 AND customer_id = $2 AND deleted_at IS NULL',
          [productId, createDto.customerId],
        );
        
        if (associationCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          throw new BadRequestException({
            message: `产品 ${productId} 和客户之间必须已有关联，请先创建关联`,
            code: InteractionErrorCode.INTERACTION_INVALID_PRODUCT,
          });
        }
      }

      // 5. Create a single interaction record (Story 20.8: 1:N model - one interaction, multiple products)
      // Story 20.5: Include person_id in INSERT to associate interaction with contact person
      const insertQuery = `
        INSERT INTO product_customer_interactions 
          (product_id, customer_id, person_id, interaction_type, interaction_date, description, status, additional_info, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, product_id, customer_id, person_id, interaction_type, interaction_date, description, status, additional_info, created_at, created_by
      `;
      
      // Create single interaction record (product_id can be null for 1:N model)
      // Use first product_id for backward compatibility, but this will be deprecated
      // Story 20.5: Include person_id to enable contact person statistics and detail page display
      const result = await client.query(insertQuery, [
        productIds[0], // Keep first product_id for backward compatibility (will be nullable in future)
        createDto.customerId,
        createDto.personId || null, // Story 20.5: Include person ID (nullable)
        createDto.interactionType,
        new Date(createDto.interactionDate),
        createDto.description || null,
        createDto.status || null,
        createDto.additionalInfo ? JSON.stringify(createDto.additionalInfo) : null,
        user.id,
        new Date(),
      ]);
      
      const interaction = result.rows[0];
      const interactionId = interaction.id;

      // 6. Create product associations in interaction_products table (Story 20.8: 1:N model)
      if (productIds.length > 0) {
        const insertValues = productIds
          .map((productId, index) => `($1, $${index + 2}, NOW())`)
          .join(', ');
        const insertAssociationsQuery = `
          INSERT INTO interaction_products (interaction_id, product_id, created_at)
          VALUES ${insertValues}
        `;
        await client.query(insertAssociationsQuery, [interactionId, ...productIds]);
      }

      await client.query('COMMIT');

      // 7. Record audit log for interaction creation (non-blocking, async execution)
      setImmediate(async () => {
        try {
          // Log single interaction creation with all associated products
          await this.auditService.log({
            action: 'INTERACTION_CREATED',
            entityType: 'INTERACTION',
            entityId: interaction.id,
            userId: user.id,
            operatorId: user.id,
            timestamp: new Date(),
            metadata: {
              interactionType: createDto.interactionType,
              productIds: productIds, // All associated products
              customerId: interaction.customer_id,
              totalProducts: productIds.length,
            },
          });
        } catch (error) {
          this.logger.warn('Failed to log interaction creation', error);
        }
      });

      return {
        id: interaction.id,
        productId: interaction.product_id, // Keep for backward compatibility (first product)
        customerId: interaction.customer_id,
        interactionType: interaction.interaction_type,
        interactionDate: interaction.interaction_date,
        description: interaction.description,
        status: interaction.status,
        additionalInfo: interaction.additional_info
          ? (typeof interaction.additional_info === 'string'
              ? JSON.parse(interaction.additional_info)
              : interaction.additional_info)
          : undefined,
        createdAt: interaction.created_at,
        createdBy: interaction.created_by,
        // Story 20.8: Return single interaction ID (all products are associated via interaction_products table)
        createdInteractionIds: [interaction.id],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk create interaction records
   * 
   * Creates multiple interaction records in a single transaction.
   * Each CreateInteractionDto can create multiple interaction records (one per product).
   * Uses SAVEPOINT for partial success (some records succeed, some fail).
   * 
   * @param interactions - Array of CreateInteractionDto
   * @param userId - User ID creating the interactions
   * @param token - JWT token for authentication
   * @returns Array of created interaction records
   */
  async bulkCreate(
    interactions: CreateInteractionDto[],
    userId: string,
    token: string,
  ): Promise<InteractionResponseDto[]> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    if (interactions.length === 0) {
      return [];
    }

    // Validate user token
    const user = await this.authService.validateToken(token);
    if (!user || !user.id) {
      throw new UnauthorizedException('无效的用户 token');
    }

    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      const results: InteractionResponseDto[] = [];
      const insertQuery = `
        INSERT INTO product_customer_interactions 
          (product_id, customer_id, interaction_type, interaction_date, description, status, additional_info, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, product_id, customer_id, interaction_type, interaction_date, description, status, additional_info, created_at, created_by
      `;

      for (let i = 0; i < interactions.length; i++) {
        const createDto = interactions[i];
        
        // Create savepoint for each interaction group
        const savepointName = `sp_interaction_${i}`;
        await client.query(`SAVEPOINT ${savepointName}`);

        try {
          // Create interaction records for all products in this DTO
          const createdInteractions: any[] = [];
          for (const productId of createDto.productIds) {
            const result = await client.query(insertQuery, [
              productId,
              createDto.customerId,
              createDto.interactionType,
              new Date(createDto.interactionDate),
              createDto.description || null,
              createDto.status || null,
              createDto.additionalInfo ? JSON.stringify(createDto.additionalInfo) : null,
              userId,
              new Date(),
            ]);
            createdInteractions.push(result.rows[0]);
          }

          // Map to response DTOs
          for (const interaction of createdInteractions) {
            results.push({
              id: interaction.id,
              productId: interaction.product_id,
              customerId: interaction.customer_id,
              interactionType: interaction.interaction_type,
              interactionDate: interaction.interaction_date,
              description: interaction.description,
              status: interaction.status,
              additionalInfo: interaction.additional_info
                ? (typeof interaction.additional_info === 'string'
                    ? JSON.parse(interaction.additional_info)
                    : interaction.additional_info)
                : undefined,
              createdAt: interaction.created_at,
              createdBy: interaction.created_by,
            });
          }

          await client.query(`RELEASE SAVEPOINT ${savepointName}`);
        } catch (error) {
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          this.logger.error(`Failed to create interaction group ${i}:`, error);
          // Continue with next interaction group
        }
      }

      await client.query('COMMIT');

      // Log audit for bulk import
      try {
        await this.auditService.log({
          action: 'BULK_CREATE',
          entityType: 'INTERACTION',
          entityId: null,
          userId: userId || 'system',
          operatorId: userId || 'system',
          timestamp: new Date(),
          metadata: {
            count: results.length,
            totalGroups: interactions.length,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for bulk interaction create', error);
      }

      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to bulk create interactions', error);
      throw new BadRequestException('批量创建互动记录失败');
    } finally {
      client.release();
    }
  }

  /**
   * Get a single interaction record by ID with role-based permission check
   */
  /**
   * Get a single interaction record by ID
   * 
   * Validates user permissions based on role (Frontend Specialist can only view BUYER customers,
   * Backend Specialist can only view SUPPLIER customers). Includes attachments in the response.
   * 
   * @param interactionId - UUID of the interaction record
   * @param token - JWT token for authentication
   * @returns Interaction record with attachments
   * @throws {BadRequestException} If database connection is not initialized
   * @throws {UnauthorizedException} If token is invalid
   * @throws {ForbiddenException} If user doesn't have permission to view the interaction
   * @throws {NotFoundException} If interaction doesn't exist or user doesn't have permission
   */
  async findOne(interactionId: string, token: string): Promise<InteractionResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. Validate user token and get user info
    const user = await this.authService.validateToken(token);
    if (!user || !user.id) {
      throw new UnauthorizedException('无效的用户 token');
    }

    // 2. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. Convert customer_type to uppercase (PermissionService returns lowercase, database stores uppercase)
    const customerTypeFilter = dataFilter?.customerType
      ? dataFilter.customerType.toUpperCase()
      : null;

    // 4. Handle permission check failure
    if (dataFilter?.customerType === 'NONE') {
      throw new ForbiddenException('您没有权限查看互动记录');
    }

    // 5. Query interaction record with role-based filtering, attachments, and products
    // Note: We need separate aggregations for products and attachments to avoid duplicates
    const query = `
      SELECT
        pci.id,
        pci.product_id,
        pci.customer_id,
        pci.interaction_type,
        pci.interaction_date,
        pci.description,
        pci.status,
        pci.additional_info,
        pci.created_at,
        pci.created_by,
        pci.updated_at,
        pci.updated_by,
        pci.person_id,
        c.name as customer_name,
        u.email as creator_email,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COALESCE(
          (
            SELECT json_agg(
              jsonb_build_object(
                'id', p2.id,
                'name', p2.name,
                'status', p2.status
              )
            )
            FROM interaction_products ip2
            INNER JOIN products p2 ON p2.id = ip2.product_id
            WHERE ip2.interaction_id = pci.id
          ),
          '[]'::json
        ) as products,
        COALESCE(
          json_agg(
            jsonb_build_object(
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
      WHERE pci.id = $1
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
      GROUP BY pci.id, pci.product_id, pci.customer_id, pci.interaction_type,
               pci.interaction_date, pci.description, pci.status, pci.additional_info,
               pci.created_at, pci.created_by, pci.updated_at, pci.updated_by,
               pci.person_id, c.id, c.name, u.email, u.first_name, u.last_name
    `;

    const result = await this.pgPool.query(query, [interactionId, customerTypeFilter]);

    if (result.rows.length === 0) {
      throw new NotFoundException('互动记录不存在或您没有权限查看');
    }

    const interaction = result.rows[0];

    // 6. Check customer type permission if filter is set
    if (customerTypeFilter) {
      const customerTypeCheck = await this.pgPool.query(
        'SELECT customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
        [interaction.customer_id],
      );

      if (customerTypeCheck.rows.length === 0) {
        throw new NotFoundException('客户不存在');
      }

      const customerType = customerTypeCheck.rows[0].customer_type;
      if (customerType !== customerTypeFilter) {
        throw new ForbiddenException('您没有权限查看该互动记录');
      }
    }

    // Parse attachments from JSON
    let attachments: any[] = [];
    if (interaction.attachments) {
      if (typeof interaction.attachments === 'string') {
        attachments = JSON.parse(interaction.attachments);
      } else if (Array.isArray(interaction.attachments)) {
        attachments = interaction.attachments;
      }
    }

    // Parse products from JSON
    let products: any[] = [];
    if (interaction.products) {
      if (typeof interaction.products === 'string') {
        products = JSON.parse(interaction.products);
      } else if (Array.isArray(interaction.products)) {
        products = interaction.products;
      }
    }

    return {
      id: interaction.id,
      productId: interaction.product_id,
      customerId: interaction.customer_id,
      customerName: interaction.customer_name,
      interactionType: interaction.interaction_type,
      interactionDate: interaction.interaction_date,
      description: interaction.description,
      status: interaction.status,
      additionalInfo: interaction.additional_info
        ? (typeof interaction.additional_info === 'string'
            ? JSON.parse(interaction.additional_info)
            : interaction.additional_info)
        : undefined,
      createdAt: interaction.created_at,
      createdBy: interaction.created_by,
      updatedAt: interaction.updated_at || undefined,
      updatedBy: interaction.updated_by || undefined,
      personId: interaction.person_id,
      products: products.length > 0 ? products : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
  }

  /**
   * Find all interaction records with filters and pagination
   * 
   * Supports filtering by customerId, productId, interactionType, dateRange, status.
   * Applies role-based data filtering (Frontend Specialist can only see BUYER customers,
   * Backend Specialist can only see SUPPLIER customers).
   * 
   * @param filters - Query filters (customerId, productId, interactionType, startDate, endDate, status, limit, offset)
   * @param token - JWT token for authentication
   * @returns Array of interaction records and total count
   * @throws {BadRequestException} If database connection is not initialized
   * @throws {UnauthorizedException} If token is invalid
   */
  async findAll(
    filters: {
      customerId?: string;
      productId?: string;
      interactionType?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
    token: string,
  ): Promise<{ interactions: InteractionResponseDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. Validate user token and get user info
    const user = await this.authService.validateToken(token);
    if (!user || !user.id) {
      throw new UnauthorizedException('无效的用户 token');
    }

    // 2. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. Convert customer_type to uppercase (PermissionService returns lowercase, database stores uppercase)
    const customerTypeFilter = dataFilter?.customerType
      ? dataFilter.customerType.toUpperCase()
      : null;

    // 4. Handle permission check failure
    if (dataFilter?.customerType === 'NONE') {
      // User has no access, return empty result
      return { interactions: [], total: 0 };
    }

    // 5. Build WHERE clause
    const whereConditions: string[] = ['pci.deleted_at IS NULL', 'c.deleted_at IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based customer type filter
    if (customerTypeFilter) {
      whereConditions.push(`c.customer_type = $${paramIndex}`);
      params.push(customerTypeFilter);
      paramIndex++;
    }

    // Customer filter
    if (filters.customerId) {
      whereConditions.push(`pci.customer_id = $${paramIndex}`);
      params.push(filters.customerId);
      paramIndex++;
    }

    // Product filter
    if (filters.productId) {
      whereConditions.push(`EXISTS (SELECT 1 FROM interaction_products ip WHERE ip.interaction_id = pci.id AND ip.product_id = $${paramIndex})`);
      params.push(filters.productId);
      paramIndex++;
    }

    // Interaction type filter
    if (filters.interactionType) {
      whereConditions.push(`pci.interaction_type = $${paramIndex}`);
      params.push(filters.interactionType);
      paramIndex++;
    }

    // Date range filter
    if (filters.startDate) {
      whereConditions.push(`pci.interaction_date >= $${paramIndex}`);
      params.push(new Date(filters.startDate));
      paramIndex++;
    }
    if (filters.endDate) {
      whereConditions.push(`pci.interaction_date <= $${paramIndex}`);
      params.push(new Date(filters.endDate));
      paramIndex++;
    }

    // Status filter
    if (filters.status) {
      whereConditions.push(`pci.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 6. Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      ${whereClause}
    `;
    const countResult = await this.pgPool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // 7. Get paginated results
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    const query = `
      SELECT
        pci.id,
        pci.customer_id,
        pci.interaction_type,
        pci.interaction_date,
        pci.description,
        pci.status,
        pci.additional_info,
        pci.created_at,
        pci.created_by,
        pci.updated_at,
        pci.updated_by,
        pci.person_id,
        c.name as customer_name,
        u.email as creator_email,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'status', p.status
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) as products
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      LEFT JOIN users u ON u.id = pci.created_by
      LEFT JOIN people pe ON pe.id = pci.person_id AND pe.deleted_at IS NULL
      LEFT JOIN interaction_products ip ON ip.interaction_id = pci.id
      LEFT JOIN products p ON p.id = ip.product_id
      ${whereClause}
      GROUP BY pci.id, c.id, c.name, u.email, u.first_name, u.last_name, pci.person_id, pe.first_name, pe.last_name, pe.email
      ORDER BY pci.interaction_date DESC, pci.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const queryParams = [...params, limit, offset];
    const result = await this.pgPool.query(query, queryParams);

    // 8. Map to response DTOs
    const interactions: InteractionResponseDto[] = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      interactionType: row.interaction_type,
      interactionDate: row.interaction_date,
      description: row.description,
      status: row.status,
      additionalInfo: row.additional_info
        ? typeof row.additional_info === 'string'
          ? JSON.parse(row.additional_info)
          : row.additional_info
        : undefined,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      personId: row.person_id,
      personName: row.person_name || undefined,
      products: row.products || [],
    }));

    return { interactions, total };
  }

  /**
   * Search interaction records with advanced filtering
   * 
   * Supports multi-select filtering by:
   * - interactionTypes: Array of interaction types
   * - statuses: Array of interaction statuses
   * - categories: Array of product categories
   * - createdBy: Creator user ID
   * - customerId: Specific customer
   * - productId: Specific product
   * - startDate/endDate: Date range
   * 
   * Also supports sorting by various fields and pagination.
   * Applies role-based data filtering (Frontend Specialist can only see BUYER customers,
   * Backend Specialist can only see SUPPLIER customers).
   * 
   * @param searchDto - Search query DTO with filters, sorting, and pagination
   * @param token - JWT token for authentication
   * @returns Array of interaction records and total count
   * @throws {BadRequestException} If database connection is not initialized
   * @throws {UnauthorizedException} If token is invalid
   */
  async search(
    searchDto: InteractionSearchQueryDto,
    token: string,
  ): Promise<{ interactions: InteractionResponseDto[]; total: number }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // 1. Validate user token and get user info
    const user = await this.authService.validateToken(token);
    if (!user || !user.id) {
      throw new UnauthorizedException('无效的用户 token');
    }

    // 2. Get user permissions and data access filter
    const dataFilter = await this.permissionService.getDataAccessFilter(token);

    // 3. Convert customer_type to uppercase (PermissionService returns lowercase, database stores uppercase)
    const customerTypeFilter = dataFilter?.customerType
      ? dataFilter.customerType.toUpperCase()
      : null;

    // 4. Handle permission check failure
    if (dataFilter?.customerType === 'NONE') {
      // User has no access, return empty result
      return { interactions: [], total: 0 };
    }

    // 5. Build WHERE clause
    const whereConditions: string[] = ['pci.deleted_at IS NULL', 'c.deleted_at IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based customer type filter
    if (customerTypeFilter) {
      whereConditions.push(`c.customer_type = $${paramIndex}`);
      params.push(customerTypeFilter);
      paramIndex++;
    }

    // Multi-select interaction types filter
    if (searchDto.interactionTypes && searchDto.interactionTypes.length > 0) {
      whereConditions.push(`pci.interaction_type = ANY($${paramIndex}::text[])`);
      params.push(searchDto.interactionTypes);
      paramIndex++;
    }

    // Multi-select statuses filter
    if (searchDto.statuses && searchDto.statuses.length > 0) {
      whereConditions.push(`pci.status = ANY($${paramIndex}::text[])`);
      params.push(searchDto.statuses);
      paramIndex++;
    }

    // Date range filter
    if (searchDto.startDate) {
      whereConditions.push(`pci.interaction_date >= $${paramIndex}`);
      params.push(new Date(searchDto.startDate));
      paramIndex++;
    }
    if (searchDto.endDate) {
      whereConditions.push(`pci.interaction_date <= $${paramIndex}`);
      params.push(new Date(searchDto.endDate));
      paramIndex++;
    }

    // Customer filter
    if (searchDto.customerId) {
      whereConditions.push(`pci.customer_id = $${paramIndex}`);
      params.push(searchDto.customerId);
      paramIndex++;
    }

    // Product filter
    if (searchDto.productId) {
      whereConditions.push(`EXISTS (SELECT 1 FROM interaction_products ip WHERE ip.interaction_id = pci.id AND ip.product_id = $${paramIndex})`);
      params.push(searchDto.productId);
      paramIndex++;
    }

    // Product categories filter (requires JOIN with interaction_products and products table)
    if (searchDto.categories && searchDto.categories.length > 0) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM interaction_products ip
        INNER JOIN products p ON p.id = ip.product_id
        WHERE ip.interaction_id = pci.id
          AND p.category = ANY($${paramIndex}::text[])
      )`);
      params.push(searchDto.categories);
      paramIndex++;
    }

    // Creator filter
    if (searchDto.createdBy) {
      whereConditions.push(`pci.created_by = $${paramIndex}`);
      params.push(searchDto.createdBy);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 6. Build ORDER BY clause
    const sortBy = searchDto.sortBy || 'interactionDate';
    const sortOrder = searchDto.sortOrder || 'desc';
    const orderDirection = sortOrder.toUpperCase();
    
    let orderByClause = '';
    switch (sortBy) {
      case 'customerName':
        orderByClause = `ORDER BY c.name ${orderDirection}, pci.interaction_date DESC`;
        break;
      case 'productName':
        // For product name sorting, we need to use the first product name from the aggregated list
        // Since we're using json_agg, we'll sort by the first product name in the array
        orderByClause = `ORDER BY MIN(p.name) ${orderDirection}, pci.interaction_date DESC`;
        break;
      case 'productHsCode':
        orderByClause = `ORDER BY MIN(p.hs_code) ${orderDirection}, pci.interaction_date DESC`;
        break;
      case 'interactionType':
        orderByClause = `ORDER BY pci.interaction_type ${orderDirection}, pci.interaction_date DESC`;
        break;
      case 'interactionDate':
      default:
        orderByClause = `ORDER BY pci.interaction_date ${orderDirection}, pci.created_at DESC`;
        break;
    }

    // 7. Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT pci.id) as total
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      ${whereClause}
    `;
    const countResult = await this.pgPool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // 8. Get paginated results
    const limit = searchDto.limit || 20;
    const offset = searchDto.offset || 0;

    const query = `
      SELECT
        pci.id,
        pci.customer_id,
        pci.interaction_type,
        pci.interaction_date,
        pci.description,
        pci.status,
        pci.additional_info,
        pci.created_at,
        pci.created_by,
        pci.updated_at,
        pci.updated_by,
        pci.person_id,
        COALESCE(pe.first_name || ' ' || pe.last_name, pe.email, NULL) as person_name,
        c.name as customer_name,
        c.customer_type,
        u.email as creator_email,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'status', p.status
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) as products
      FROM product_customer_interactions pci
      INNER JOIN companies c ON c.id = pci.customer_id
      LEFT JOIN users u ON u.id = pci.created_by
      LEFT JOIN people pe ON pe.id = pci.person_id AND pe.deleted_at IS NULL
      LEFT JOIN interaction_products ip ON ip.interaction_id = pci.id
      LEFT JOIN products p ON p.id = ip.product_id
      ${whereClause}
      GROUP BY pci.id, c.id, c.name, c.customer_type, u.email, u.first_name, u.last_name, pci.person_id, pe.first_name, pe.last_name, pe.email
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const queryParams = [...params, limit, offset];
    const result = await this.pgPool.query(query, queryParams);

    // 9. Map to response DTOs
    const interactions: InteractionResponseDto[] = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      interactionType: row.interaction_type,
      interactionDate: row.interaction_date,
      description: row.description,
      status: row.status,
      additionalInfo: row.additional_info
        ? typeof row.additional_info === 'string'
          ? JSON.parse(row.additional_info)
          : row.additional_info
        : undefined,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      personId: row.person_id,
      personName: row.person_name || undefined,
      products: row.products || [],
    }));

    return { interactions, total };
  }

  /**
   * Update an interaction record
   * 
   * Only the creator of the interaction can update it. Validates that the interaction exists,
   * is not deleted, and the current user is the creator. Also validates that interactionDate
   * is not in the future. Only updates fields that are provided in the DTO.
   * 
   * @param interactionId - UUID of the interaction record to update
   * @param updateDto - DTO containing fields to update (description, interactionDate, status, additionalInfo)
   * @param token - JWT token for authentication
   * @returns Updated interaction record
   * @throws {BadRequestException} If database connection is not initialized, no fields to update, or interactionDate is in the future
   * @throws {UnauthorizedException} If token is invalid
   * @throws {ForbiddenException} If current user is not the creator
   * @throws {NotFoundException} If interaction doesn't exist or is deleted
   */
  async update(
    interactionId: string,
    updateDto: UpdateInteractionDto,
    token: string,
  ): Promise<InteractionResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Use database transaction to ensure data consistency
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validate user token and get user info
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }

      // 2. Validate interaction exists and is not deleted
      const interactionCheck = await client.query(
        'SELECT id, created_by FROM product_customer_interactions WHERE id = $1 AND deleted_at IS NULL',
        [interactionId],
      );

      if (interactionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundException('互动记录不存在或已被删除');
      }

      const interaction = interactionCheck.rows[0];

      // 3. Validate current user is the creator OR is admin/director
      const userRole = user.role?.toUpperCase();
      const isAdmin = userRole === 'ADMIN';
      const isDirector = userRole === 'DIRECTOR';
      const isOwner = interaction.created_by === user.id;
      
      if (!isOwner && !isAdmin && !isDirector) {
        await client.query('ROLLBACK');
        throw new ForbiddenException('您只能编辑自己创建的互动记录');
      }

      // 4. Validate interactionDate is not in the future (if provided)
      if (updateDto.interactionDate) {
        const interactionDate = new Date(updateDto.interactionDate);
        const now = new Date();
        if (interactionDate > now) {
          await client.query('ROLLBACK');
          throw new BadRequestException('互动时间不能是未来时间');
        }
      }

      // 4.5. Handle product list update if provided
      if (updateDto.productIds !== undefined) {
        // Get current customer ID for validation
        const customerCheck = await client.query(
          'SELECT customer_id FROM product_customer_interactions WHERE id = $1 AND deleted_at IS NULL',
          [interactionId],
        );
        if (customerCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          throw new NotFoundException('互动记录不存在');
        }
        const customerId = customerCheck.rows[0].customer_id;

        // Validate all products are associated with the customer
        if (updateDto.productIds.length > 0) {
          const productValidationQuery = `
            SELECT COUNT(*) as count
            FROM product_customer_associations
            WHERE customer_id = $1
              AND product_id = ANY($2::uuid[])
              AND deleted_at IS NULL
          `;
          const validationResult = await client.query(productValidationQuery, [
            customerId,
            updateDto.productIds,
          ]);
          const validCount = parseInt(validationResult.rows[0].count, 10);
          if (validCount !== updateDto.productIds.length) {
            await client.query('ROLLBACK');
            throw new BadRequestException('部分产品未与客户建立关联关系');
          }
        }

        // Delete existing product associations
        await client.query(
          'DELETE FROM interaction_products WHERE interaction_id = $1',
          [interactionId],
        );

        // Insert new product associations
        if (updateDto.productIds.length > 0) {
          const insertValues = updateDto.productIds
            .map((productId, index) => `($1, $${index + 2}, NOW())`)
            .join(', ');
          const insertQuery = `
            INSERT INTO interaction_products (interaction_id, product_id, created_at)
            VALUES ${insertValues}
          `;
          await client.query(insertQuery, [interactionId, ...updateDto.productIds]);
        }
      }

      // 5. Build update query dynamically (only update provided fields)
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateDto.interactionType !== undefined) {
        updateFields.push(`interaction_type = $${paramIndex}`);
        updateValues.push(updateDto.interactionType);
        paramIndex++;
      }

      if (updateDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(updateDto.description || null);
        paramIndex++;
      }

      if (updateDto.interactionDate !== undefined) {
        updateFields.push(`interaction_date = $${paramIndex}`);
        updateValues.push(new Date(updateDto.interactionDate));
        paramIndex++;
      }

      if (updateDto.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(updateDto.status || null);
        paramIndex++;
      }

      if (updateDto.additionalInfo !== undefined) {
        updateFields.push(`additional_info = $${paramIndex}`);
        updateValues.push(
          updateDto.additionalInfo ? JSON.stringify(updateDto.additionalInfo) : null,
        );
        paramIndex++;
      }

      // Story 20.5: Update person_id if provided
      if (updateDto.personId !== undefined) {
        updateFields.push(`person_id = $${paramIndex}`);
        updateValues.push(updateDto.personId || null);
        paramIndex++;
      }

      // Always update updated_by and updated_at
      updateFields.push(`updated_by = $${paramIndex}`);
      updateValues.push(user.id);
      paramIndex++;

      updateFields.push(`updated_at = $${paramIndex}`);
      updateValues.push(new Date());
      paramIndex++;

      if (updateFields.length === 2) {
        // Only updated_by and updated_at were added, no actual fields to update
        // But if productIds were updated, we should still proceed
        if (updateDto.productIds === undefined) {
          await client.query('ROLLBACK');
          throw new BadRequestException('没有提供要更新的字段');
        }
      }

      // 6. Update interaction record
      const updateQuery = `
        UPDATE product_customer_interactions
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, product_id, customer_id, person_id, interaction_type, interaction_date,
                  description, status, additional_info, created_at, created_by,
                  updated_at, updated_by
      `;
      updateValues.push(interactionId);

      const result = await client.query(updateQuery, updateValues);
      const updatedInteraction = result.rows[0];

      await client.query('COMMIT');

      // 7. Record audit log (non-blocking, async execution)
      setImmediate(async () => {
        try {
          await this.auditService.log({
            action: 'INTERACTION_UPDATED',
            entityType: 'INTERACTION',
            entityId: updatedInteraction.id,
            userId: user.id,
            operatorId: user.id,
            timestamp: new Date(),
            metadata: { updatedFields: Object.keys(updateDto) },
          });
        } catch (error) {
          this.logger.warn('Failed to log interaction update', error);
        }
      });

      // Fetch products for response
      const productsQuery = `
        SELECT p.id, p.name, p.status
        FROM interaction_products ip
        JOIN products p ON p.id = ip.product_id
        WHERE ip.interaction_id = $1
      `;
      const productsResult = await this.pgPool.query(productsQuery, [interactionId]);
      const products = productsResult.rows;

      return {
        id: updatedInteraction.id,
        customerId: updatedInteraction.customer_id,
        interactionType: updatedInteraction.interaction_type,
        interactionDate: updatedInteraction.interaction_date,
        description: updatedInteraction.description,
        status: updatedInteraction.status,
        additionalInfo: updatedInteraction.additional_info
          ? (typeof updatedInteraction.additional_info === 'string'
              ? JSON.parse(updatedInteraction.additional_info)
              : updatedInteraction.additional_info)
          : undefined,
        createdAt: updatedInteraction.created_at,
        createdBy: updatedInteraction.created_by,
        updatedAt: updatedInteraction.updated_at,
        updatedBy: updatedInteraction.updated_by,
        products: products,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete an interaction record (soft delete)
   * 
   * Only the creator of the interaction can delete it. Performs a soft delete by setting
   * the deleted_at timestamp. The record is retained in the database for audit purposes.
   * 
   * @param interactionId - UUID of the interaction record to delete
   * @param token - JWT token for authentication
   * @returns void
   * @throws {BadRequestException} If database connection is not initialized
   * @throws {UnauthorizedException} If token is invalid
   * @throws {ForbiddenException} If current user is not the creator
   * @throws {NotFoundException} If interaction doesn't exist or is already deleted
   */
  async delete(interactionId: string, token: string): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Use database transaction to ensure data consistency
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validate user token and get user info
      const user = await this.authService.validateToken(token);
      if (!user || !user.id) {
        throw new UnauthorizedException('无效的用户 token');
      }

      // 2. Validate interaction exists and is not deleted
      const interactionCheck = await client.query(
        'SELECT id, created_by FROM product_customer_interactions WHERE id = $1 AND deleted_at IS NULL',
        [interactionId],
      );

      if (interactionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundException('互动记录不存在或已被删除');
      }

      const interaction = interactionCheck.rows[0];

      // 3. Validate current user is the creator OR is admin/director
      const userRole = user.role?.toUpperCase();
      const isAdmin = userRole === 'ADMIN';
      const isDirector = userRole === 'DIRECTOR';
      const isOwner = interaction.created_by === user.id;
      
      if (!isOwner && !isAdmin && !isDirector) {
        await client.query('ROLLBACK');
        throw new ForbiddenException('您只能删除自己创建的互动记录');
      }

      // 4. Perform soft delete
      await client.query(
        'UPDATE product_customer_interactions SET deleted_at = NOW() WHERE id = $1',
        [interactionId],
      );

      await client.query('COMMIT');

      // 5. Record audit log (non-blocking, async execution)
      setImmediate(async () => {
        try {
          await this.auditService.log({
            action: 'INTERACTION_DELETED',
            entityType: 'INTERACTION',
            entityId: interactionId,
            userId: user.id,
            operatorId: user.id,
            timestamp: new Date(),
            metadata: {},
          });
        } catch (error) {
          this.logger.warn('Failed to log interaction deletion', error);
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

