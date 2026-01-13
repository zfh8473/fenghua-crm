/**
 * Supplier Analysis Service
 * 
 * Provides supplier analysis data including order statistics, cooperation frequency, and stability rating
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
  SupplierAnalysisQueryDto,
  SupplierAnalysisResponseDto,
  SupplierAnalysisItemDto,
  CooperationTrendResponseDto,
  CooperationTrendItemDto,
  StabilityRating,
} from './dto/supplier-analysis.dto';
import { FrontendInteractionType } from '../interactions/dto/create-interaction.dto';
import * as redis from 'redis';

@Injectable()
export class SupplierAnalysisService implements OnModuleDestroy {
  private readonly logger = new Logger(SupplierAnalysisService.name);
  private pgPool: Pool | null = null;
  private redisClient: redis.RedisClientType | null = null;
  private redisEnabled = false;

  /**
   * Helper function to safely parse numeric values from query results
   */
  private parseNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

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
      this.logger.warn('DATABASE_URL not configured, supplier analysis operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for SupplierAnalysisService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Initialize Redis connection for caching
   */
  private initializeRedisConnection(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.debug('REDIS_URL not configured, supplier analysis caching will be disabled');
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
      this.logger.log('Redis client initialized for supplier analysis caching');
    } catch (error) {
      this.logger.warn('Failed to initialize Redis client, caching disabled', error);
      this.redisEnabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for SupplierAnalysisService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis client disconnected for SupplierAnalysisService');
      } catch (error) {
        this.logger.error('Failed to disconnect Redis client', error);
      }
    }
  }

  private isValidSupplierAnalysisResponse(data: any): data is SupplierAnalysisResponseDto {
    return (
      typeof data === 'object' &&
      Array.isArray(data.suppliers) &&
      typeof data.total === 'number' &&
      typeof data.page === 'number' &&
      typeof data.limit === 'number'
    );
  }

  private isValidCooperationTrendResponse(data: any): data is CooperationTrendResponseDto {
    return (
      typeof data === 'object' &&
      Array.isArray(data.trends)
    );
  }

  /**
   * Get supplier analysis
   */
  async getSupplierAnalysis(
    token: string,
    queryDto: SupplierAnalysisQueryDto,
  ): Promise<SupplierAnalysisResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    let { startDate, endDate, categoryName, page = 1, limit = 20 } = queryDto;

    // Validate pagination
    if (page < 1) {
      page = 1;
    }
    if (limit < 1 || limit > 100) {
      limit = Math.min(Math.max(limit, 1), 100);
    }

    const cacheKey = `dashboard:supplier-analysis:${startDate || 'all'}:${endDate || 'all'}:${categoryName || 'all'}:${page}:${limit}`;
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached && typeof cached === 'string') {
          this.logger.debug('Returning cached supplier analysis');
          const parsed = JSON.parse(cached);
          if (this.isValidSupplierAnalysisResponse(parsed)) {
            return parsed;
          } else {
            this.logger.warn('Cached data structure invalid, falling back to database');
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get from cache, falling back to database', error);
      }
    }

    try {
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        this.logger.warn('User attempted to access supplier analysis with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看供应商分析数据');
      }

      // Calculate time range days for cooperation frequency
      let timeRangeDays = 0;
      let actualStartDate = startDate;
      let actualEndDate = endDate;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('无效的日期格式');
        }
        if (start > end) {
          throw new BadRequestException('开始日期不能晚于结束日期');
        }
        timeRangeDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      } else if (!startDate && !endDate) {
        // Default to last 12 months if no date range specified
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setMonth(defaultStartDate.getMonth() - 12);
        actualStartDate = defaultStartDate.toISOString().split('T')[0];
        actualEndDate = defaultEndDate.toISOString().split('T')[0];
        timeRangeDays = Math.max(1, Math.floor((defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24)));
      }

      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      const offset = (page - 1) * limit;

      // Build query with filters
      const query = `
        WITH supplier_order_stats AS (
          SELECT 
            c.id as supplier_id,
            c.name as supplier_name,
            c.created_at as supplier_created_at,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_type IN ($1, $2)
            ) as order_count,
            MIN(pci.interaction_date) FILTER (
              WHERE pci.interaction_type IN ($1, $2)
            ) as first_order_date,
            MAX(pci.interaction_date) FILTER (
              WHERE pci.interaction_type IN ($1, $2)
            ) as last_order_date,
            MAX(pci.interaction_date) as last_interaction_date,
            COALESCE(
              SUM(
                CASE 
                  WHEN pci.interaction_type IN ($1, $2)
                  THEN CAST(COALESCE(
                    (pci.additional_info->>'orderAmount')::numeric,
                    (pci.additional_info->>'amount')::numeric,
                    0
                  ) AS numeric)
                  ELSE 0
                END
              ),
              0
            ) as total_order_amount
          FROM companies c
          LEFT JOIN product_customer_interactions pci 
            ON pci.customer_id = c.id 
            AND pci.deleted_at IS NULL
            AND ($3::date IS NULL OR pci.interaction_date >= $3)
            AND ($4::date IS NULL OR pci.interaction_date <= $4)
          LEFT JOIN products p ON p.id = pci.product_id AND p.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
            AND c.customer_type = 'SUPPLIER'
            AND ($5::text IS NULL OR p.category = $5)
          GROUP BY c.id, c.name, c.created_at
        )
        SELECT 
          supplier_id,
          supplier_name,
          order_count,
          total_order_amount,
          CASE 
            -- If more than 1 order, calculate average order interval (days between orders)
            -- Then convert to orders per day: order_count / (days between first and last order + 1)
            WHEN order_count > 1 AND first_order_date IS NOT NULL AND last_order_date IS NOT NULL 
              AND (last_order_date - first_order_date) > INTERVAL '0 day'
            THEN ROUND(
              (order_count::float / (EXTRACT(EPOCH FROM (last_order_date - first_order_date)) / 86400 + 1))::numeric,
              4
            )
            -- If only 1 order or time range specified, use time range days
            WHEN $6::integer > 0 AND order_count > 0
            THEN ROUND((order_count::float / $6::float)::numeric, 4)
            ELSE 0
          END as cooperation_frequency,
          last_interaction_date,
          CASE 
            WHEN last_interaction_date IS NULL 
            THEN EXTRACT(EPOCH FROM (CURRENT_DATE - sos.supplier_created_at)) / 86400
            ELSE EXTRACT(EPOCH FROM (CURRENT_DATE - last_interaction_date)) / 86400
          END as days_since_last_cooperation,
          total_order_amount as lifetime_value
        FROM supplier_order_stats sos
        INNER JOIN companies c ON c.id = sos.supplier_id
        ORDER BY total_order_amount DESC, order_count DESC
        LIMIT $7 OFFSET $8;
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM companies c
        LEFT JOIN product_customer_interactions pci 
          ON pci.customer_id = c.id 
          AND pci.deleted_at IS NULL
          AND ($1::date IS NULL OR pci.interaction_date >= $1)
          AND ($2::date IS NULL OR pci.interaction_date <= $2)
        LEFT JOIN products p ON p.id = pci.product_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
          AND c.customer_type = 'SUPPLIER'
          AND ($3::text IS NULL OR p.category = $3)
      `;

      const result = await this.pgPool.query(query, [
        orderTypes[0],
        orderTypes[1],
        actualStartDate || null,
        actualEndDate || null,
        categoryName || null,
        timeRangeDays,
        limit,
        offset,
      ]);

      const countResult = await this.pgPool.query(countQuery, [
        actualStartDate || null,
        actualEndDate || null,
        categoryName || null,
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

      // Map results to DTOs
      const suppliers: SupplierAnalysisItemDto[] = result.rows.map((row) => {
        const daysSinceLastCooperation = Math.floor(this.parseNumber(row.days_since_last_cooperation, 0));
        
        // Determine stability rating
        let stabilityRating: StabilityRating;
        const cooperationFrequency = this.parseNumber(row.cooperation_frequency, 0);
        
        if (daysSinceLastCooperation <= 30 && cooperationFrequency >= 0.1) {
          stabilityRating = StabilityRating.HIGH;
        } else if (daysSinceLastCooperation <= 60) {
          stabilityRating = StabilityRating.MEDIUM;
        } else if (daysSinceLastCooperation <= 90) {
          stabilityRating = StabilityRating.LOW;
        } else {
          stabilityRating = StabilityRating.RISK;
        }

        return {
          supplierId: row.supplier_id,
          supplierName: row.supplier_name,
          orderCount: Math.floor(this.parseNumber(row.order_count, 0)),
          orderAmount: this.parseNumber(row.total_order_amount, 0),
          cooperationFrequency: this.parseNumber(row.cooperation_frequency, 0),
          lastCooperationDate: row.last_interaction_date 
            ? new Date(row.last_interaction_date).toISOString()
            : new Date().toISOString(),
          daysSinceLastCooperation,
          stabilityRating,
          lifetimeValue: this.parseNumber(row.lifetime_value, 0),
        };
      });

      const response: SupplierAnalysisResponseDto = {
        suppliers,
        total,
        page,
        limit,
      };

      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            5 * 60, // 5 minutes
            JSON.stringify(response),
          );
          this.logger.debug('Cached supplier analysis');
        } catch (cacheError) {
          this.logger.warn('Failed to cache supplier analysis', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get supplier analysis', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取供应商分析数据失败: ${error.message}`
        : '获取供应商分析数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get cooperation trend
   */
  async getCooperationTrend(
    token: string,
    startDate?: string,
    endDate?: string,
  ): Promise<CooperationTrendResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const cacheKey = `dashboard:cooperation-trend:${startDate || 'all'}:${endDate || 'all'}`;
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached && typeof cached === 'string') {
          this.logger.debug('Returning cached cooperation trend');
          const parsed = JSON.parse(cached);
          if (this.isValidCooperationTrendResponse(parsed)) {
            return parsed;
          } else {
            this.logger.warn('Cached cooperation trend data structure invalid, falling back to database');
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get cooperation trend from cache, falling back to database', error);
      }
    }

    try {
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        this.logger.warn('User attempted to access cooperation trend with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看供应商合作趋势');
      }

      let timeGrouping = 'month';
      let actualStartDate = startDate;
      let actualEndDate = endDate;

      if (!startDate || !endDate) {
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

      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      // Build query for cooperation trend
      const query = `
        WITH supplier_period_stats AS (
          SELECT 
            DATE_TRUNC($1::text, pci.interaction_date) as period,
            COUNT(DISTINCT c.id) as total_suppliers,
            COUNT(DISTINCT c.id) FILTER (
              WHERE pci.interaction_type IN ($2, $3)
            ) as active_suppliers,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_type IN ($2, $3)
            ) as total_orders
          FROM companies c
          INNER JOIN product_customer_interactions pci 
            ON pci.customer_id = c.id 
            AND pci.deleted_at IS NULL
            AND ($4::date IS NULL OR pci.interaction_date >= $4)
            AND ($5::date IS NULL OR pci.interaction_date <= $5)
          WHERE c.deleted_at IS NULL
            AND c.customer_type = 'SUPPLIER'
          GROUP BY period
        )
        SELECT 
          CASE 
            WHEN $1::text = 'week' THEN TO_CHAR(period, 'YYYY-"W"IW')
            ELSE TO_CHAR(period, 'YYYY-MM')
          END as period,
          total_suppliers,
          active_suppliers,
          total_orders,
          CASE 
            WHEN total_suppliers > 0 
            THEN ROUND((total_orders::float / total_suppliers::float)::numeric, 2)
            ELSE 0
          END as cooperation_frequency
        FROM supplier_period_stats
        ORDER BY period ASC;
      `;

      const result = await this.pgPool.query(query, [
        timeGrouping,
        orderTypes[0],
        orderTypes[1],
        actualStartDate || null,
        actualEndDate || null,
      ]);

      const trends: CooperationTrendItemDto[] = result.rows
        .filter((row) => row.period && String(row.period).trim() !== '') // Filter invalid data
        .map((row) => ({
          period: String(row.period || ''),
          totalSuppliers: Math.floor(this.parseNumber(row.total_suppliers, 0)),
          activeSuppliers: Math.floor(this.parseNumber(row.active_suppliers, 0)),
          totalOrders: Math.floor(this.parseNumber(row.total_orders, 0)),
          cooperationFrequency: this.parseNumber(row.cooperation_frequency, 0),
        }));

      const response: CooperationTrendResponseDto = { trends };

      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            5 * 60, // 5 minutes
            JSON.stringify(response),
          );
          this.logger.debug('Cached cooperation trend');
        } catch (cacheError) {
          this.logger.warn('Failed to cache cooperation trend', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get cooperation trend', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取供应商合作趋势失败: ${error.message}`
        : '获取供应商合作趋势失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Export supplier analysis data
   */
  async exportSupplierAnalysis(
    token: string,
    queryDto: SupplierAnalysisQueryDto,
  ): Promise<SupplierAnalysisItemDto[]> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    let { startDate, endDate, categoryName } = queryDto;

    // Maximum export limit to prevent memory issues
    const MAX_EXPORT_LIMIT = 50000;

    try {
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        this.logger.warn('User attempted to export supplier analysis with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限导出供应商分析数据');
      }

      // Calculate time range days for cooperation frequency
      let timeRangeDays = 0;
      let actualStartDate = startDate;
      let actualEndDate = endDate;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          timeRangeDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
      } else {
        timeRangeDays = 365 * 10; // Default to 10 years for frequency if no range
      }
      timeRangeDays = Math.max(1, timeRangeDays);

      // First, check data count to prevent memory issues
      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM companies c
        LEFT JOIN product_customer_interactions pci 
          ON pci.customer_id = c.id 
          AND pci.deleted_at IS NULL
          AND ($1::date IS NULL OR pci.interaction_date >= $1)
          AND ($2::date IS NULL OR pci.interaction_date <= $2)
        LEFT JOIN products p ON p.id = pci.product_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
          AND c.customer_type = 'SUPPLIER'
          AND ($3::text IS NULL OR p.category = $3)
      `;

      const countResult = await this.pgPool.query(countQuery, [
        actualStartDate || null,
        actualEndDate || null,
        categoryName || null,
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

      if (total > MAX_EXPORT_LIMIT) {
        throw new BadRequestException(
          `导出数据量过大（${total} 条），请使用筛选条件缩小范围，或联系管理员使用异步导出功能`
        );
      }

      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      const query = `
        WITH supplier_order_stats AS (
          SELECT 
            c.id as supplier_id,
            c.name as supplier_name,
            c.created_at as supplier_created_at,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_type IN ($1, $2)
            ) as order_count,
            MIN(pci.interaction_date) FILTER (
              WHERE pci.interaction_type IN ($1, $2)
            ) as first_order_date,
            MAX(pci.interaction_date) FILTER (
              WHERE pci.interaction_type IN ($1, $2)
            ) as last_order_date,
            MAX(pci.interaction_date) as last_interaction_date,
            COALESCE(
              SUM(
                CASE 
                  WHEN pci.interaction_type IN ($1, $2)
                  THEN CAST(COALESCE(
                    (pci.additional_info->>'orderAmount')::numeric,
                    (pci.additional_info->>'amount')::numeric,
                    0
                  ) AS numeric)
                  ELSE 0
                END
              ),
              0
            ) as total_order_amount
          FROM companies c
          LEFT JOIN product_customer_interactions pci 
            ON pci.customer_id = c.id 
            AND pci.deleted_at IS NULL
            AND ($3::date IS NULL OR pci.interaction_date >= $3)
            AND ($4::date IS NULL OR pci.interaction_date <= $4)
          LEFT JOIN products p ON p.id = pci.product_id AND p.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
            AND c.customer_type = 'SUPPLIER'
            AND ($5::text IS NULL OR p.category = $5)
          GROUP BY c.id, c.name, c.created_at
        )
        SELECT 
          supplier_id,
          supplier_name,
          order_count,
          total_order_amount,
          CASE 
            WHEN order_count > 1 AND first_order_date IS NOT NULL AND last_order_date IS NOT NULL 
              AND (last_order_date - first_order_date) > INTERVAL '0 day'
            THEN ROUND(
              (order_count::float / (EXTRACT(EPOCH FROM (last_order_date - first_order_date)) / 86400 + 1))::numeric,
              4
            )
            WHEN $6::integer > 0 AND order_count > 0
            THEN ROUND((order_count::float / $6::float)::numeric, 4)
            ELSE 0
          END as cooperation_frequency,
          last_interaction_date,
          CASE 
            WHEN last_interaction_date IS NULL 
            THEN EXTRACT(EPOCH FROM (CURRENT_DATE - sos.supplier_created_at)) / 86400
            ELSE EXTRACT(EPOCH FROM (CURRENT_DATE - last_interaction_date)) / 86400
          END as days_since_last_cooperation,
          total_order_amount as lifetime_value
        FROM supplier_order_stats sos
        INNER JOIN companies c ON c.id = sos.supplier_id
        ORDER BY total_order_amount DESC, order_count DESC;
      `;

      const result = await this.pgPool.query(query, [
        orderTypes[0],
        orderTypes[1],
        actualStartDate || null,
        actualEndDate || null,
        categoryName || null,
        timeRangeDays,
      ]);

      return result.rows.map((row) => {
        const daysSinceLastCooperation = Math.floor(this.parseNumber(row.days_since_last_cooperation, 0));
        const cooperationFrequency = this.parseNumber(row.cooperation_frequency, 0);
        
        let stabilityRating: StabilityRating;
        if (daysSinceLastCooperation <= 30 && cooperationFrequency >= 0.1) {
          stabilityRating = StabilityRating.HIGH;
        } else if (daysSinceLastCooperation <= 60) {
          stabilityRating = StabilityRating.MEDIUM;
        } else if (daysSinceLastCooperation <= 90) {
          stabilityRating = StabilityRating.LOW;
        } else {
          stabilityRating = StabilityRating.RISK;
        }

        return {
          supplierId: row.supplier_id,
          supplierName: row.supplier_name,
          orderCount: Math.floor(this.parseNumber(row.order_count, 0)),
          orderAmount: this.parseNumber(row.total_order_amount, 0),
          cooperationFrequency: this.parseNumber(row.cooperation_frequency, 0),
          lastCooperationDate: row.last_interaction_date 
            ? new Date(row.last_interaction_date).toISOString()
            : new Date().toISOString(),
          daysSinceLastCooperation,
          stabilityRating,
          lifetimeValue: this.parseNumber(row.lifetime_value, 0),
        };
      });
    } catch (error) {
      this.logger.error('Failed to export supplier analysis', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `导出供应商分析数据失败: ${error.message}`
        : '导出供应商分析数据失败';
      throw new BadRequestException(errorMessage);
    }
  }
}

