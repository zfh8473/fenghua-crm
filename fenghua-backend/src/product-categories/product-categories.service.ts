/**
 * Product Categories Service
 * 
 * Handles product category CRUD operations
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto, CategoryWithStatsDto } from './dto/category-response.dto';

@Injectable()
export class ProductCategoriesService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductCategoriesService.name);
  private pgPool: Pool | null = null;
  private usageCountCache: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute cache

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
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
      this.logger.warn('DATABASE_URL not configured, category operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductCategoriesService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for ProductCategoriesService');
    }
  }

  /**
   * Map database row to response DTO
   */
  private mapToResponseDto(row: any): CategoryResponseDto {
    return {
      id: row.id,
      name: row.name,
      hsCode: row.hs_code,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || undefined,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }

  /**
   * Check if category name exists
   */
  async checkNameExists(name: string, excludeCategoryId?: string): Promise<boolean> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      let query = 'SELECT COUNT(*) as count FROM product_categories WHERE name = $1 AND deleted_at IS NULL';
      const params: any[] = [name];
      
      if (excludeCategoryId) {
        query += ' AND id != $2';
        params.push(excludeCategoryId);
      }

      const result = await this.pgPool.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      this.logger.error('Failed to check category name existence', error);
      throw new BadRequestException('检查类别名称是否存在失败');
    }
  }

  /**
   * Check if HS code exists
   */
  async checkHsCodeExists(hsCode: string, excludeCategoryId?: string): Promise<boolean> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      let query = 'SELECT COUNT(*) as count FROM product_categories WHERE hs_code = $1 AND deleted_at IS NULL';
      const params: any[] = [hsCode];
      
      if (excludeCategoryId) {
        query += ' AND id != $2';
        params.push(excludeCategoryId);
      }

      const result = await this.pgPool.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      this.logger.error('Failed to check HS code existence', error);
      throw new BadRequestException('检查HS编码是否存在失败');
    }
  }

  /**
   * Get usage count for a category
   */
  async getUsageCount(categoryId: string): Promise<number> {
    // Check cache first
    const cached = this.usageCountCache.get(categoryId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.count;
    }

    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const category = await this.findOne(categoryId);
      const result = await this.pgPool.query(
        `SELECT COUNT(*) as count 
         FROM products 
         WHERE category = $1 AND deleted_at IS NULL`,
        [category.name]
      );
      
      const count = parseInt(result.rows[0].count);
      this.usageCountCache.set(categoryId, { count, timestamp: now });
      return count;
    } catch (error) {
      this.logger.error('Failed to get category usage count', error);
      throw new BadRequestException('获取类别使用统计失败');
    }
  }

  /**
   * Check if category is in use
   */
  async isCategoryInUse(categoryId: string): Promise<boolean> {
    const count = await this.getUsageCount(categoryId);
    return count > 0;
  }

  /**
   * Find all categories
   */
  async findAll(includeDeleted = false): Promise<CategoryResponseDto[]> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
      const result = await this.pgPool.query(
        `SELECT * FROM product_categories ${whereClause} ORDER BY name ASC`
      );
      return result.rows.map(row => this.mapToResponseDto(row));
    } catch (error) {
      this.logger.error('Failed to find all categories', error);
      throw new BadRequestException('获取类别列表失败');
    }
  }

  /**
   * Find all categories with usage statistics
   */
  async findAllWithStats(): Promise<CategoryWithStatsDto[]> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        `SELECT 
          pc.*,
          COUNT(p.id) as product_count
         FROM product_categories pc
         LEFT JOIN products p ON p.category = pc.name AND p.deleted_at IS NULL
         WHERE pc.deleted_at IS NULL
         GROUP BY pc.id
         ORDER BY pc.name ASC`
      );
      
      return result.rows.map(row => ({
        ...this.mapToResponseDto(row),
        productCount: parseInt(row.product_count),
      }));
    } catch (error) {
      this.logger.error('Failed to find all categories with stats', error);
      throw new BadRequestException('获取类别列表（含统计）失败');
    }
  }

  /**
   * Find one category by ID
   */
  async findOne(id: string): Promise<CategoryResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        'SELECT * FROM product_categories WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('产品类别不存在');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to find category', error);
      throw new BadRequestException('获取类别信息失败');
    }
  }

  /**
   * Find category by HS code
   */
  async findByHsCode(hsCode: string): Promise<CategoryResponseDto | null> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        'SELECT * FROM product_categories WHERE hs_code = $1 AND deleted_at IS NULL',
        [hsCode]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to find category by HS code', error);
      throw new BadRequestException('根据HS编码查找类别失败');
    }
  }

  /**
   * Find category by name
   */
  async findByName(name: string): Promise<CategoryResponseDto | null> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        'SELECT * FROM product_categories WHERE name = $1 AND deleted_at IS NULL',
        [name]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to find category by name', error);
      throw new BadRequestException('根据名称查找类别失败');
    }
  }

  /**
   * Create a new category
   */
  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<CategoryResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Check name uniqueness
    const nameExists = await this.checkNameExists(createCategoryDto.name);
    if (nameExists) {
      throw new ConflictException('类别名称已存在');
    }

    // Check HS code uniqueness
    const hsCodeExists = await this.checkHsCodeExists(createCategoryDto.hsCode);
    if (hsCodeExists) {
      throw new ConflictException('HS编码已存在');
    }

    try {
      // Validate userId is a valid UUID, if not, use null
      let validUserId: string | null = userId;
      if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for created_by`);
        validUserId = null;
      }

      const result = await this.pgPool.query(
        `INSERT INTO product_categories (
          name, hs_code, description, created_by
        ) VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          createCategoryDto.name,
          createCategoryDto.hsCode,
          createCategoryDto.description || null,
          validUserId,
        ]
      );

      const category = result.rows[0];
      const categoryDto = this.mapToResponseDto(category);

      // Audit log
      try {
        await this.auditService.log({
          action: 'CREATE',
          entityType: 'PRODUCT_CATEGORY',
          entityId: categoryDto.id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            categoryName: categoryDto.name,
            hsCode: categoryDto.hsCode,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for category create', error);
      }

      return categoryDto;
    } catch (error) {
      this.logger.error('Failed to create category', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('创建产品类别失败');
    }
  }

  /**
   * Update a category
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<CategoryResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Check if category exists
    const existingCategory = await this.findOne(id);

    // Check name uniqueness (if name is being updated)
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const nameExists = await this.checkNameExists(updateCategoryDto.name, id);
      if (nameExists) {
        throw new ConflictException('类别名称已存在');
      }
    }

    // Check HS code uniqueness (if HS code is being updated)
    if (updateCategoryDto.hsCode && updateCategoryDto.hsCode !== existingCategory.hsCode) {
      const hsCodeExists = await this.checkHsCodeExists(updateCategoryDto.hsCode, id);
      if (hsCodeExists) {
        throw new ConflictException('HS编码已存在');
      }
    }

    try {
      // Validate userId
      let validUserId: string | null = userId;
      if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for updated_by`);
        validUserId = null;
      }

      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updateCategoryDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        params.push(updateCategoryDto.name);
      }
      if (updateCategoryDto.hsCode !== undefined) {
        updateFields.push(`hs_code = $${paramIndex++}`);
        params.push(updateCategoryDto.hsCode);
      }
      if (updateCategoryDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        params.push(updateCategoryDto.description || null);
      }

      if (updateFields.length === 0) {
        return existingCategory; // No changes
      }

      updateFields.push(`updated_by = $${paramIndex++}`);
      params.push(validUserId);
      params.push(id); // For WHERE clause

      const result = await this.pgPool.query(
        `UPDATE product_categories 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        params
      );

      const category = result.rows[0];
      const categoryDto = this.mapToResponseDto(category);

      // Clear cache for this category
      this.usageCountCache.delete(id);

      // Audit log
      try {
        await this.auditService.log({
          action: 'UPDATE',
          entityType: 'PRODUCT_CATEGORY',
          entityId: categoryDto.id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          oldValue: JSON.stringify(existingCategory),
          newValue: JSON.stringify(categoryDto),
          metadata: {
            categoryName: categoryDto.name,
            hsCode: categoryDto.hsCode,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for category update', error);
      }

      return categoryDto;
    } catch (error) {
      this.logger.error('Failed to update category', error);
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('更新产品类别失败');
    }
  }

  /**
   * Remove (soft delete) a category
   */
  async remove(id: string, userId: string): Promise<void> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Check if category exists
    const category = await this.findOne(id);

    // Check if category is in use
    const usageCount = await this.getUsageCount(id);
    if (usageCount > 0) {
      throw new ConflictException(
        `该类别正在被 ${usageCount} 个产品使用，无法删除。请先删除或修改使用该类别的产品。`
      );
    }

    try {
      // Validate userId
      let validUserId: string | null = userId;
      if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        this.logger.warn(`Invalid userId format (not UUID): ${userId}, using null for updated_by`);
        validUserId = null;
      }

      await this.pgPool.query(
        `UPDATE product_categories 
         SET deleted_at = NOW(), updated_by = $1 
         WHERE id = $2`,
        [validUserId, id]
      );

      // Clear cache
      this.usageCountCache.delete(id);

      // Audit log
      try {
        await this.auditService.log({
          action: 'DELETE',
          entityType: 'PRODUCT_CATEGORY',
          entityId: id,
          userId: validUserId || 'system',
          operatorId: validUserId || 'system',
          timestamp: new Date(),
          metadata: {
            categoryName: category.name,
            hsCode: category.hsCode,
          },
        });
      } catch (error) {
        this.logger.warn('Failed to log audit entry for category delete', error);
      }
    } catch (error) {
      this.logger.error('Failed to delete category', error);
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('删除产品类别失败');
    }
  }
}

