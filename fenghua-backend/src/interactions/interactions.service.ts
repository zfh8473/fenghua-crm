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

      // 5. Create interaction records for all products (within transaction)
      const insertQuery = `
        INSERT INTO product_customer_interactions 
          (product_id, customer_id, interaction_type, interaction_date, description, status, additional_info, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, product_id, customer_id, interaction_type, interaction_date, description, status, additional_info, created_at, created_by
      `;
      
      const interactions = [];
      for (const productId of productIds) {
        const result = await client.query(insertQuery, [
          productId,
          createDto.customerId,
          createDto.interactionType,
          new Date(createDto.interactionDate),
          createDto.description || null,
          createDto.status || null,
          createDto.additionalInfo ? JSON.stringify(createDto.additionalInfo) : null,
          user.id,
          new Date(),
        ]);
        interactions.push(result.rows[0]);
      }

      // Use the first interaction record as the primary return value (for backward compatibility)
      const interaction = interactions[0];
      // Collect all created interaction IDs for attachment linking
      const createdInteractionIds = interactions.map((i) => i.id);

      await client.query('COMMIT');

      // 6. Record audit logs for all created interactions (non-blocking, async execution)
      setImmediate(async () => {
        try {
          // Log interaction creation for each interaction record
          for (const createdInteraction of interactions) {
            await this.auditService.log({
              action: 'INTERACTION_CREATED',
              entityType: 'INTERACTION',
              entityId: createdInteraction.id,
              userId: user.id,
              operatorId: user.id,
              timestamp: new Date(),
              metadata: {
                interactionType: createDto.interactionType,
                productId: createdInteraction.product_id,
                customerId: createdInteraction.customer_id,
                totalCreated: interactions.length,
              },
            });
          }
        } catch (error) {
          this.logger.warn('Failed to log interaction creation', error);
        }
      });

      return {
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
        // Add all created interaction IDs for attachment linking
        createdInteractionIds,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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

    // 5. Query interaction record with role-based filtering and attachments
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
      WHERE pci.id = $1
        AND pci.deleted_at IS NULL
        AND c.deleted_at IS NULL
        AND ($2::text IS NULL OR c.customer_type = $2)
      GROUP BY pci.id, pci.product_id, pci.customer_id, pci.interaction_type,
               pci.interaction_date, pci.description, pci.status, pci.additional_info,
               pci.created_at, pci.created_by, pci.updated_at, pci.updated_by,
               u.email, u.first_name, u.last_name
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

    return {
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
      updatedAt: interaction.updated_at || undefined,
      updatedBy: interaction.updated_by || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
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

      // 3. Validate current user is the creator
      if (interaction.created_by !== user.id) {
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

      // Always update updated_by and updated_at
      updateFields.push(`updated_by = $${paramIndex}`);
      updateValues.push(user.id);
      paramIndex++;

      updateFields.push(`updated_at = $${paramIndex}`);
      updateValues.push(new Date());
      paramIndex++;

      if (updateFields.length === 2) {
        // Only updated_by and updated_at were added, no actual fields to update
        await client.query('ROLLBACK');
        throw new BadRequestException('没有提供要更新的字段');
      }

      // 6. Update interaction record
      const updateQuery = `
        UPDATE product_customer_interactions
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, product_id, customer_id, interaction_type, interaction_date,
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

      return {
        id: updatedInteraction.id,
        productId: updatedInteraction.product_id,
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

      // 3. Validate current user is the creator
      if (interaction.created_by !== user.id) {
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

