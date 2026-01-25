/**
 * Product Association Analysis Service
 * 
 * Provides product association analysis data
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PermissionService } from '../permission/permission.service';
import {
  ProductAssociationAnalysisResponseDto,
  ProductAssociationAnalysisItemDto,
  ConversionRateTrendResponseDto,
  ConversionRateTrendItemDto,
  ProductCategoriesResponseDto,
} from './dto/product-association-analysis.dto';
import { FrontendInteractionType } from '../interactions/dto/create-interaction.dto';
import * as redis from 'redis';

@Injectable()
export class ProductAssociationAnalysisService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductAssociationAnalysisService.name);
  private pgPool: Pool | null = null;
  private redisClient: redis.RedisClientType | null = null;
  private redisEnabled = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
  ) {
    this.initializeDatabaseConnection();
    this.initializeRedisConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, product association analysis operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductAssociationAnalysisService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Initialize Redis connection (optional)
   */
  private initializeRedisConnection(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.debug('REDIS_URL not configured, product association analysis caching will be disabled');
      return;
    }

    this.redisEnabled = true;
    try {
      this.redisClient = redis.createClient({
        url: redisUrl,
      });
      this.redisClient.on('error', (error) => {
        this.logger.warn('Redis client error', error);
        this.redisEnabled = false;
      });
      this.redisClient.connect().catch((error) => {
        this.logger.warn('Redis connection failed, caching disabled', error);
        this.redisEnabled = false;
      });
      this.logger.log('Redis client initialized for product association analysis caching');
    } catch (error) {
      this.logger.warn('Failed to initialize Redis client, caching disabled', error);
      this.redisEnabled = false;
    }
  }

  /**
   * Get product association analysis
   */
  async getProductAssociationAnalysis(
    token: string,
    categoryName?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ProductAssociationAnalysisResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Validate pagination
    if (page < 1) {
      page = 1;
    }
    if (limit < 1 || limit > 100) {
      limit = Math.min(Math.max(limit, 1), 100);
    }

    // Check cache first (if Redis is available)
    const cacheKey = `dashboard:product-association-analysis:${categoryName || 'all'}:${startDate || 'all'}:${endDate || 'all'}:${page}:${limit}`;
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached && typeof cached === 'string') {
          this.logger.debug('Returning cached product association analysis');
          const parsed = JSON.parse(cached);
          if (this.isValidAnalysisResponse(parsed)) {
            return parsed as ProductAssociationAnalysisResponseDto;
          } else {
            this.logger.warn('Cached data structure invalid, falling back to database');
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get from cache, falling back to database', error);
      }
    }

    try {
      // Get data access filter for data filtering (not access control)
      // DirectorOrAdminGuard already ensures only ADMIN/DIRECTOR can access this endpoint
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      // For ADMIN/DIRECTOR, dataFilter should be null (full access)
      // If dataFilter is not null, it means user has restricted access
      // Since DirectorOrAdminGuard already ensures only ADMIN/DIRECTOR can access,
      // we should log a warning if dataFilter is not null (shouldn't happen)
      if (dataFilter !== null) {
        this.logger.warn('Unexpected data filter for ADMIN/DIRECTOR user', { customerType: dataFilter.customerType });
        // For dashboard analysis, we require full access, so deny if filter exists
        throw new BadRequestException('您没有权限查看产品关联分析数据');
      }

      // Convert customer_type case (PermissionService returns lowercase, database stores uppercase)
      // For ADMIN/DIRECTOR, this should always be null (full access)
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      // Order types for conversion rate calculation
      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      const offset = (page - 1) * limit;

      // Build query with filters
      const query = `
        WITH product_stats AS (
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.category as category_name,
            COUNT(DISTINCT pci.customer_id) FILTER (WHERE c.customer_type = 'BUYER') as buyer_count,
            COUNT(DISTINCT pci.customer_id) FILTER (WHERE c.customer_type = 'SUPPLIER') as supplier_count,
            COUNT(DISTINCT pci.customer_id) as total_customers,
            COUNT(pci.id) as total_interactions,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_type IN ($1, $2)
            ) as order_count
          FROM products p
          LEFT JOIN interaction_products ip
            ON ip.product_id = p.id
          LEFT JOIN product_customer_interactions pci 
            ON pci.id = ip.interaction_id
            AND pci.deleted_at IS NULL
          LEFT JOIN companies c 
            ON c.id = pci.customer_id 
            AND c.deleted_at IS NULL
          WHERE p.deleted_at IS NULL
            AND ($3::text IS NULL OR c.customer_type = $3)
            AND ($4::text IS NULL OR p.category = $4)
            AND ($5::date IS NULL OR pci.interaction_date >= $5)
            AND ($6::date IS NULL OR pci.interaction_date <= $6)
          GROUP BY p.id, p.name, p.category
        )
        SELECT 
          product_id,
          product_name,
          category_name,
          buyer_count,
          supplier_count,
          total_customers,
          total_interactions,
          order_count,
          CASE 
            WHEN total_interactions > 0 
            THEN ROUND((order_count::float / total_interactions::float * 100)::numeric, 2)
            ELSE 0
          END as conversion_rate
        FROM product_stats
        ORDER BY conversion_rate DESC, total_interactions DESC
        LIMIT $7 OFFSET $8;
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        LEFT JOIN interaction_products ip ON ip.product_id = p.id
        LEFT JOIN product_customer_interactions pci 
          ON pci.id = ip.interaction_id 
          AND pci.deleted_at IS NULL
        LEFT JOIN companies c 
          ON c.id = pci.customer_id 
          AND c.deleted_at IS NULL
        WHERE p.deleted_at IS NULL
          AND ($1::text IS NULL OR c.customer_type = $1)
          AND ($2::text IS NULL OR p.category = $2)
          AND ($3::date IS NULL OR pci.interaction_date >= $3)
          AND ($4::date IS NULL OR pci.interaction_date <= $4)
      `;

      const result = await this.pgPool.query(query, [
        orderTypes[0],
        orderTypes[1],
        customerTypeFilter,
        categoryName || null,
        startDate || null,
        endDate || null,
        limit,
        offset,
      ]);

      const countResult = await this.pgPool.query(countQuery, [
        customerTypeFilter,
        categoryName || null,
        startDate || null,
        endDate || null,
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

      const products: ProductAssociationAnalysisItemDto[] = result.rows.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        categoryName: row.category_name || undefined,
        totalCustomers: parseInt(row.total_customers || '0', 10) || 0,
        buyerCount: parseInt(row.buyer_count || '0', 10) || 0,
        supplierCount: parseInt(row.supplier_count || '0', 10) || 0,
        totalInteractions: parseInt(row.total_interactions || '0', 10) || 0,
        orderCount: parseInt(row.order_count || '0', 10) || 0,
        conversionRate: parseFloat(row.conversion_rate || '0') || 0,
      }));

      const response: ProductAssociationAnalysisResponseDto = {
        products,
        total,
        page,
        limit,
      };

      // Cache result if Redis is available
      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            5 * 60, // 5 minutes
            JSON.stringify(response),
          );
          this.logger.debug('Cached product association analysis');
        } catch (cacheError) {
          this.logger.warn('Failed to cache product association analysis', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get product association analysis', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Provide more detailed error message in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取产品关联分析数据失败: ${error.message}`
        : '获取产品关联分析数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get conversion rate trend
   */
  async getConversionRateTrend(
    token: string,
    categoryName?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ConversionRateTrendResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Get data access filter for data filtering (not access control)
      // DirectorOrAdminGuard already ensures only ADMIN/DIRECTOR can access this endpoint
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      // For ADMIN/DIRECTOR, dataFilter should be null (full access)
      // If dataFilter is not null, it means user has restricted access
      // Since DirectorOrAdminGuard already ensures only ADMIN/DIRECTOR can access,
      // we should log a warning if dataFilter is not null (shouldn't happen)
      if (dataFilter !== null) {
        this.logger.warn('Unexpected data filter for ADMIN/DIRECTOR user in trend query', { customerType: dataFilter.customerType });
        // For dashboard analysis, we require full access, so deny if filter exists
        throw new BadRequestException('您没有权限查看转化率趋势数据');
      }

      // Convert customer_type case (PermissionService returns lowercase, database stores uppercase)
      // For ADMIN/DIRECTOR, this should always be null (full access)
      const customerTypeFilter = dataFilter?.customerType
        ? dataFilter.customerType.toUpperCase()
        : null;

      // Determine time grouping (week or month)
      let timeGrouping = 'month';
      let actualStartDate = startDate;
      let actualEndDate = endDate;

      if (!startDate || !endDate) {
        // Default to last 12 months if not specified
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setMonth(defaultStartDate.getMonth() - 12);
        actualStartDate = actualStartDate || defaultStartDate.toISOString().split('T')[0];
        actualEndDate = actualEndDate || defaultEndDate.toISOString().split('T')[0];
      }

      if (actualStartDate && actualEndDate) {
        const start = new Date(actualStartDate);
        const end = new Date(actualEndDate);
        
        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('无效的日期格式');
        }
        
        if (start > end) {
          throw new BadRequestException('开始日期不能晚于结束日期');
        }
        
        const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 90) {
          timeGrouping = 'week';
        }
      }

      // Order types
      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      const query = `
        WITH interaction_stats AS (
          SELECT 
            DATE_TRUNC($1::text, pci.interaction_date) as period,
            COUNT(pci.id) as total_interactions,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_type IN ($2, $3)
            ) as order_count
          FROM product_customer_interactions pci
          INNER JOIN interaction_products ip ON ip.interaction_id = pci.id
          INNER JOIN products p ON p.id = ip.product_id AND p.deleted_at IS NULL
          INNER JOIN companies c ON c.id = pci.customer_id AND c.deleted_at IS NULL
          WHERE pci.deleted_at IS NULL
            AND ($4::text IS NULL OR c.customer_type = $4)
            AND ($5::text IS NULL OR p.category = $5)
            AND ($6::date IS NULL OR pci.interaction_date >= $6)
            AND ($7::date IS NULL OR pci.interaction_date <= $7)
          GROUP BY period
        )
        SELECT 
          CASE 
            WHEN $1::text = 'week' THEN TO_CHAR(period, 'YYYY-"W"IW')
            ELSE TO_CHAR(period, 'YYYY-MM')
          END as period,
          total_interactions,
          order_count,
          CASE 
            WHEN total_interactions > 0 
            THEN ROUND((order_count::float / total_interactions::float * 100)::numeric, 2)
            ELSE 0
          END as conversion_rate
        FROM interaction_stats
        ORDER BY period ASC;
      `;

      const result = await this.pgPool.query(query, [
        timeGrouping,
        orderTypes[0],
        orderTypes[1],
        customerTypeFilter,
        categoryName || null,
        actualStartDate || null,
        actualEndDate || null,
      ]);

      const trends: ConversionRateTrendItemDto[] = result.rows.map((row) => ({
        period: row.period,
        totalInteractions: parseInt(row.total_interactions || '0', 10) || 0,
        orderCount: parseInt(row.order_count || '0', 10) || 0,
        conversionRate: parseFloat(row.conversion_rate || '0') || 0,
      }));

      return { trends };
    } catch (error) {
      this.logger.error('Failed to get conversion rate trend', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Provide more detailed error message in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取转化率趋势数据失败: ${error.message}`
        : '获取转化率趋势数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get product categories
   */
  async getProductCategories(token: string): Promise<ProductCategoriesResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Get data access filter
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        if (dataFilter.customerType === 'NONE') {
          throw new BadRequestException('您没有权限查看产品类别列表');
        }
        throw new BadRequestException('您没有权限查看产品类别列表');
      }

      // Query distinct categories from products table
      const query = `
        SELECT DISTINCT p.category
        FROM products p
        WHERE p.deleted_at IS NULL
          AND p.category IS NOT NULL
          AND p.category != ''
        ORDER BY p.category ASC;
      `;

      const result = await this.pgPool.query(query);

      const categories = result.rows
        .map((row) => row.category)
        .filter((cat) => cat && cat.trim() !== '');

      return { categories };
    } catch (error) {
      this.logger.error('Failed to get product categories', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Provide more detailed error message in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取产品类别列表失败: ${error.message}`
        : '获取产品类别列表失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Validate cached analysis response structure
   */
  private isValidAnalysisResponse(data: any): data is ProductAssociationAnalysisResponseDto {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!Array.isArray(data.products)) {
      return false;
    }

    if (typeof data.total !== 'number' || typeof data.page !== 'number' || typeof data.limit !== 'number') {
      return false;
    }

    return true;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed');
      } catch (error) {
        this.logger.error('Error closing PostgreSQL connection pool', error);
      }
    }
    if (this.redisClient) {
      try {
        if (this.redisClient.isOpen) {
          await this.redisClient.quit();
          this.logger.log('Redis client closed');
        } else {
          this.logger.debug('Redis client already closed');
        }
      } catch (error) {
        this.logger.error('Error closing Redis client', error);
      }
    }
  }
}

