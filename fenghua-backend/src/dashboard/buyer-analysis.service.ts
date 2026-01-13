/**
 * Buyer Analysis Service
 * 
 * Provides buyer analysis data including order statistics, activity level, and churn risk
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
  BuyerAnalysisQueryDto,
  BuyerAnalysisResponseDto,
  BuyerAnalysisItemDto,
  ActivityTrendResponseDto,
  ActivityTrendItemDto,
  ChurnTrendResponseDto,
  ChurnTrendItemDto,
  ActivityRating,
  ChurnRisk,
} from './dto/buyer-analysis.dto';
import { FrontendInteractionType } from '../interactions/dto/create-interaction.dto';
import * as redis from 'redis';

@Injectable()
export class BuyerAnalysisService implements OnModuleDestroy {
  private readonly logger = new Logger(BuyerAnalysisService.name);
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
      this.logger.warn('DATABASE_URL not configured, buyer analysis operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for BuyerAnalysisService');
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
      this.logger.debug('REDIS_URL not configured, buyer analysis caching will be disabled');
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
      this.logger.log('Redis client initialized for buyer analysis caching');
    } catch (error) {
      this.logger.warn('Failed to initialize Redis client, caching disabled', error);
      this.redisEnabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for BuyerAnalysisService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis client disconnected for BuyerAnalysisService');
      } catch (error) {
        this.logger.error('Failed to disconnect Redis client', error);
      }
    }
  }

  private isValidBuyerAnalysisResponse(data: any): data is BuyerAnalysisResponseDto {
    return (
      typeof data === 'object' &&
      Array.isArray(data.buyers) &&
      typeof data.total === 'number' &&
      typeof data.page === 'number' &&
      typeof data.limit === 'number'
    );
  }

  private isValidActivityTrendResponse(data: any): data is ActivityTrendResponseDto {
    return (
      typeof data === 'object' &&
      Array.isArray(data.trends)
    );
  }

  private isValidChurnTrendResponse(data: any): data is ChurnTrendResponseDto {
    return (
      typeof data === 'object' &&
      Array.isArray(data.trends)
    );
  }

  /**
   * Get buyer analysis
   */
  async getBuyerAnalysis(
    token: string,
    queryDto: BuyerAnalysisQueryDto,
  ): Promise<BuyerAnalysisResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const { startDate, endDate, categoryName, page = 1, limit = 20 } = queryDto;

    // Validate pagination
    if (page < 1) {
      throw new BadRequestException('页码必须大于 0');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('每页数量必须在 1-100 之间');
    }

    try {
      // Check permissions
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        if (dataFilter.customerType === 'NONE') {
          this.logger.warn('User attempted to access buyer analysis with NONE permissions');
          throw new BadRequestException('您没有权限查看采购商分析数据');
        }
        this.logger.warn('User attempted to access buyer analysis with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看采购商分析数据');
      }

      // Check cache first (if Redis is available)
      const cacheKey = `dashboard:buyer-analysis:${startDate || 'all'}:${endDate || 'all'}:${categoryName || 'all'}:${page}:${limit}`;
      if (this.redisEnabled && this.redisClient) {
        try {
          const cached = await this.redisClient.get(cacheKey);
          if (cached && typeof cached === 'string') {
            const parsed = JSON.parse(cached);
            if (this.isValidBuyerAnalysisResponse(parsed)) {
              this.logger.debug('Returning cached buyer analysis data');
              return parsed;
            } else {
              this.logger.warn('Cached buyer analysis data structure invalid, falling back to database');
            }
          }
        } catch (cacheError) {
          this.logger.warn('Failed to read from Redis cache', cacheError);
        }
      }

      // Parse dates
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
      }

      // Calculate time range in days
      let timeRangeDays = 0;
      if (actualStartDate && actualEndDate) {
        const start = new Date(actualStartDate);
        const end = new Date(actualEndDate);
        timeRangeDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      const offset = (page - 1) * limit;

      // Build query with filters
      // Calculate activity level: (recent 30 days interactions / total interactions) * 100%
      const query = `
        WITH buyer_order_stats AS (
          SELECT 
            c.id as buyer_id,
            c.name as buyer_name,
            c.created_at as buyer_created_at,
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
            COUNT(pci.id) as total_interactions,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
            ) as recent_30_days_interactions,
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
            AND c.customer_type = 'BUYER'
            AND ($5::text IS NULL OR p.category = $5)
          GROUP BY c.id, c.name, c.created_at
        )
        SELECT 
          buyer_id,
          buyer_name,
          order_count,
          total_order_amount,
          CASE 
            -- If more than 1 order, calculate average order interval (days between orders)
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
          END as order_frequency,
          last_interaction_date,
          CASE 
            WHEN last_interaction_date IS NULL 
            THEN EXTRACT(EPOCH FROM (CURRENT_DATE - buyer_created_at)) / 86400
            ELSE EXTRACT(EPOCH FROM (CURRENT_DATE - last_interaction_date)) / 86400
          END as days_since_last_interaction,
          CASE 
            WHEN total_interactions > 0
            THEN ROUND((recent_30_days_interactions::float / total_interactions::float * 100)::numeric, 2)
            ELSE 0
          END as activity_level,
          total_order_amount as lifetime_value
        FROM buyer_order_stats
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
          AND c.customer_type = 'BUYER'
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
      const buyers: BuyerAnalysisItemDto[] = result.rows.map((row) => {
        const daysSinceLastInteraction = Math.floor(this.parseNumber(row.days_since_last_interaction, 0));
        const activityLevel = this.parseNumber(row.activity_level, 0);
        
        // Determine activity rating
        let activityRating: ActivityRating;
        if (activityLevel >= 30) {
          activityRating = ActivityRating.HIGH;
        } else if (activityLevel >= 10) {
          activityRating = ActivityRating.MEDIUM;
        } else {
          activityRating = ActivityRating.LOW;
        }

        // Determine churn risk
        let churnRisk: ChurnRisk;
        if (daysSinceLastInteraction <= 30) {
          churnRisk = ChurnRisk.NONE;
        } else if (daysSinceLastInteraction <= 60) {
          churnRisk = ChurnRisk.LOW;
        } else if (daysSinceLastInteraction <= 90) {
          churnRisk = ChurnRisk.MEDIUM;
        } else {
          churnRisk = ChurnRisk.HIGH;
        }

        return {
          buyerId: row.buyer_id,
          buyerName: row.buyer_name,
          orderCount: Math.floor(this.parseNumber(row.order_count, 0)),
          orderAmount: this.parseNumber(row.total_order_amount, 0),
          orderFrequency: this.parseNumber(row.order_frequency, 0),
          lastInteractionDate: row.last_interaction_date 
            ? new Date(row.last_interaction_date).toISOString()
            : new Date().toISOString(),
          daysSinceLastInteraction,
          activityLevel,
          activityRating,
          churnRisk,
          lifetimeValue: this.parseNumber(row.lifetime_value, 0),
        };
      });

      const response: BuyerAnalysisResponseDto = {
        buyers,
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
          this.logger.debug('Cached buyer analysis');
        } catch (cacheError) {
          this.logger.warn('Failed to cache buyer analysis', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get buyer analysis', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取采购商分析数据失败: ${error.message}`
        : '获取采购商分析数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Export buyer analysis data
   * Returns all buyer analysis data for export (with data limit check before query)
   */
  async exportBuyerAnalysis(
    token: string,
    queryDto: BuyerAnalysisQueryDto,
  ): Promise<BuyerAnalysisItemDto[]> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const { startDate, endDate, categoryName } = queryDto;

    // Maximum export limit to prevent memory issues
    const MAX_EXPORT_LIMIT = 50000;

    try {
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        this.logger.warn('User attempted to export buyer analysis with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限导出采购商分析数据');
      }

      // Parse dates
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
      }

      // Calculate time range in days
      let timeRangeDays = 0;
      if (actualStartDate && actualEndDate) {
        const start = new Date(actualStartDate);
        const end = new Date(actualEndDate);
        timeRangeDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

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
          AND c.customer_type = 'BUYER'
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

      // Build query with filters (same as getBuyerAnalysis but without pagination)
      const query = `
        WITH buyer_order_stats AS (
          SELECT 
            c.id as buyer_id,
            c.name as buyer_name,
            c.created_at as buyer_created_at,
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
            COUNT(pci.id) as total_interactions,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
            ) as recent_30_days_interactions,
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
            AND c.customer_type = 'BUYER'
            AND ($5::text IS NULL OR p.category = $5)
          GROUP BY c.id, c.name, c.created_at
        )
        SELECT 
          buyer_id,
          buyer_name,
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
          END as order_frequency,
          last_interaction_date,
          CASE 
            WHEN last_interaction_date IS NULL 
            THEN EXTRACT(EPOCH FROM (CURRENT_DATE - buyer_created_at)) / 86400
            ELSE EXTRACT(EPOCH FROM (CURRENT_DATE - last_interaction_date)) / 86400
          END as days_since_last_interaction,
          CASE 
            WHEN total_interactions > 0
            THEN ROUND((recent_30_days_interactions::float / total_interactions::float * 100)::numeric, 2)
            ELSE 0
          END as activity_level,
          total_order_amount as lifetime_value
        FROM buyer_order_stats
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

      // Map results to DTOs
      const buyers: BuyerAnalysisItemDto[] = result.rows.map((row) => {
        const daysSinceLastInteraction = Math.floor(this.parseNumber(row.days_since_last_interaction, 0));
        const activityLevel = this.parseNumber(row.activity_level, 0);
        
        // Determine activity rating
        let activityRating: ActivityRating;
        if (activityLevel >= 30) {
          activityRating = ActivityRating.HIGH;
        } else if (activityLevel >= 10) {
          activityRating = ActivityRating.MEDIUM;
        } else {
          activityRating = ActivityRating.LOW;
        }

        // Determine churn risk
        let churnRisk: ChurnRisk;
        if (daysSinceLastInteraction <= 30) {
          churnRisk = ChurnRisk.NONE;
        } else if (daysSinceLastInteraction <= 60) {
          churnRisk = ChurnRisk.LOW;
        } else if (daysSinceLastInteraction <= 90) {
          churnRisk = ChurnRisk.MEDIUM;
        } else {
          churnRisk = ChurnRisk.HIGH;
        }

        return {
          buyerId: row.buyer_id,
          buyerName: row.buyer_name,
          orderCount: Math.floor(this.parseNumber(row.order_count, 0)),
          orderAmount: this.parseNumber(row.total_order_amount, 0),
          orderFrequency: this.parseNumber(row.order_frequency, 0),
          lastInteractionDate: row.last_interaction_date 
            ? new Date(row.last_interaction_date).toISOString()
            : new Date().toISOString(),
          daysSinceLastInteraction,
          activityLevel,
          activityRating,
          churnRisk,
          lifetimeValue: this.parseNumber(row.lifetime_value, 0),
        };
      });

      return buyers;
    } catch (error) {
      this.logger.error('Failed to export buyer analysis', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `导出采购商分析数据失败: ${error.message}`
        : '导出采购商分析数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get activity trend
   */
  async getActivityTrend(
    token: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ActivityTrendResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const cacheKey = `dashboard:buyer-activity-trend:${startDate || 'all'}:${endDate || 'all'}`;
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached && typeof cached === 'string') {
          const parsed = JSON.parse(cached);
          if (this.isValidActivityTrendResponse(parsed)) {
            this.logger.debug('Returning cached activity trend');
            return parsed;
          } else {
            this.logger.warn('Cached activity trend data structure invalid, falling back to database');
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get activity trend from cache, falling back to database', error);
      }
    }

    try {
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        this.logger.warn('User attempted to access activity trend with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看采购商活跃度趋势');
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

      // Build query for activity trend
      // For each time period, calculate average activity level
      // Activity level = (recent 30 days interactions / total interactions) * 100%
      // Recent 30 days is calculated from the period end date, not the period start date
      const query = `
        WITH buyer_activity_stats AS (
          SELECT 
            c.id as buyer_id,
            DATE_TRUNC($1::text, pci.interaction_date) as period,
            COUNT(pci.id) as total_interactions,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_date >= DATE_TRUNC($1::text, pci.interaction_date) + 
                CASE WHEN $1::text = 'week' THEN INTERVAL '1 week' ELSE INTERVAL '1 month' END - INTERVAL '1 day' - INTERVAL '30 days'
            ) as recent_30_days_interactions
          FROM companies c
          INNER JOIN product_customer_interactions pci 
            ON pci.customer_id = c.id 
            AND pci.deleted_at IS NULL
            AND ($2::date IS NULL OR pci.interaction_date >= $2)
            AND ($3::date IS NULL OR pci.interaction_date <= $3)
          WHERE c.deleted_at IS NULL
            AND c.customer_type = 'BUYER'
          GROUP BY c.id, DATE_TRUNC($1::text, pci.interaction_date)
        ),
        period_series AS (
          SELECT 
            DATE_TRUNC($1::text, period_date) as period_start,
            DATE_TRUNC($1::text, period_date) + 
              CASE WHEN $1::text = 'week' THEN INTERVAL '1 week' ELSE INTERVAL '1 month' END - INTERVAL '1 day' as period_end
          FROM generate_series(
            DATE_TRUNC($1::text, COALESCE($2::date, CURRENT_DATE - INTERVAL '12 months')),
            DATE_TRUNC($1::text, COALESCE($3::date, CURRENT_DATE)),
            CASE WHEN $1::text = 'week' THEN '1 week'::interval ELSE '1 month'::interval END
          ) as period_date
          WHERE ($2::date IS NULL OR DATE_TRUNC($1::text, period_date) >= DATE_TRUNC($1::text, $2::date))
            AND ($3::date IS NULL OR DATE_TRUNC($1::text, period_date) <= DATE_TRUNC($1::text, $3::date))
        )
        SELECT 
          CASE 
            WHEN $1::text = 'week' THEN TO_CHAR(ps.period_start, 'YYYY-"W"IW')
            ELSE TO_CHAR(ps.period_start, 'YYYY-MM')
          END as period,
          COUNT(DISTINCT bas.buyer_id) as total_buyers,
          COUNT(DISTINCT bas.buyer_id) FILTER (
            WHERE bas.recent_30_days_interactions > 0
          ) as active_buyers,
          CASE 
            WHEN COUNT(bas.buyer_id) > 0
            THEN ROUND(
              (AVG(
                CASE 
                  WHEN bas.total_interactions > 0
                  THEN (bas.recent_30_days_interactions::float / bas.total_interactions::float * 100)
                  ELSE 0
                END
              ))::numeric,
              2
            )
            ELSE 0
          END as average_activity_level
        FROM period_series ps
        LEFT JOIN buyer_activity_stats bas ON DATE_TRUNC($1::text, bas.period) = ps.period_start
        GROUP BY ps.period_start
        ORDER BY ps.period_start ASC;
      `;

      const result = await this.pgPool.query(query, [
        timeGrouping,
        actualStartDate || null,
        actualEndDate || null,
      ]);

      // Validate and map results
      const trends: ActivityTrendItemDto[] = result.rows
        .filter((row) => {
          // Validate period field
          if (!row.period || String(row.period).trim() === '') {
            this.logger.warn('Activity trend query returned row with invalid period', { row });
            return false;
          }
          // Validate numeric fields
          const totalBuyers = this.parseNumber(row.total_buyers, 0);
          const activeBuyers = this.parseNumber(row.active_buyers, 0);
          const averageActivityLevel = this.parseNumber(row.average_activity_level, 0);
          
          // Log validation warnings if needed
          if (totalBuyers < 0 || activeBuyers < 0 || averageActivityLevel < 0 || averageActivityLevel > 100) {
            this.logger.warn('Activity trend query returned row with invalid numeric values', {
              period: row.period,
              totalBuyers,
              activeBuyers,
              averageActivityLevel,
            });
          }
          
          return true;
        })
        .map((row) => ({
          period: String(row.period).trim(),
          totalBuyers: Math.floor(this.parseNumber(row.total_buyers, 0)),
          activeBuyers: Math.floor(this.parseNumber(row.active_buyers, 0)),
          averageActivityLevel: Math.max(0, Math.min(100, this.parseNumber(row.average_activity_level, 0))), // Clamp to 0-100
        }));

      const response: ActivityTrendResponseDto = { trends };

      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            5 * 60, // 5 minutes
            JSON.stringify(response),
          );
        } catch (cacheError) {
          this.logger.warn('Failed to cache activity trend', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get activity trend', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取采购商活跃度趋势数据失败: ${error.message}`
        : '获取采购商活跃度趋势数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get churn trend
   */
  async getChurnTrend(
    token: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ChurnTrendResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const cacheKey = `dashboard:buyer-churn-trend:${startDate || 'all'}:${endDate || 'all'}`;
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached && typeof cached === 'string') {
          const parsed = JSON.parse(cached);
          if (this.isValidChurnTrendResponse(parsed)) {
            this.logger.debug('Returning cached churn trend');
            return parsed;
          } else {
            this.logger.warn('Cached churn trend data structure invalid, falling back to database');
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get churn trend from cache, falling back to database', error);
      }
    }

    try {
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        this.logger.warn('User attempted to access churn trend with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看采购商流失率趋势');
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

      const query = `
        WITH buyer_last_interaction AS (
          SELECT 
            c.id as buyer_id,
            c.created_at as buyer_created_at,
            MAX(pci.interaction_date) as last_interaction_date,
            MIN(pci.interaction_date) as first_interaction_date
          FROM companies c
          LEFT JOIN product_customer_interactions pci 
            ON pci.customer_id = c.id 
            AND pci.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
            AND c.customer_type = 'BUYER'
          GROUP BY c.id, c.created_at
        ),
        period_series AS (
          SELECT 
            DATE_TRUNC($1::text, period_date) as period_start,
            DATE_TRUNC($1::text, period_date) + 
              CASE WHEN $1::text = 'week' THEN INTERVAL '1 week' ELSE INTERVAL '1 month' END - INTERVAL '1 day' as period_end
          FROM generate_series(
            DATE_TRUNC($1::text, COALESCE($2::date, CURRENT_DATE - INTERVAL '12 months')),
            DATE_TRUNC($1::text, COALESCE($3::date, CURRENT_DATE)),
            CASE WHEN $1::text = 'week' THEN '1 week'::interval ELSE '1 month'::interval END
          ) as period_date
          WHERE ($2::date IS NULL OR DATE_TRUNC($1::text, period_date) >= DATE_TRUNC($1::text, $2::date))
            AND ($3::date IS NULL OR DATE_TRUNC($1::text, period_date) <= DATE_TRUNC($1::text, $3::date))
        )
        SELECT 
          CASE 
            WHEN $1::text = 'week' THEN TO_CHAR(ps.period_start, 'YYYY-"W"IW')
            ELSE TO_CHAR(ps.period_start, 'YYYY-MM')
          END as period,
          (
            SELECT COUNT(DISTINCT bli.buyer_id)
            FROM buyer_last_interaction bli
            WHERE bli.buyer_created_at <= ps.period_start
          ) as total_buyers,
          (
            SELECT COUNT(DISTINCT bli.buyer_id)
            FROM buyer_last_interaction bli
            WHERE bli.buyer_created_at <= ps.period_start
              AND (
                bli.last_interaction_date IS NULL 
                OR bli.last_interaction_date < ps.period_end - INTERVAL '90 days'
              )
              AND (
                bli.first_interaction_date IS NOT NULL
                AND bli.first_interaction_date < ps.period_start
              )
          ) as churned_buyers
        FROM period_series ps
        ORDER BY ps.period_start ASC;
      `;

      const result = await this.pgPool.query(query, [
        timeGrouping,
        actualStartDate || null,
        actualEndDate || null,
      ]);

      const trends: ChurnTrendItemDto[] = result.rows
        .filter((row) => row.period && String(row.period).trim() !== '')
        .map((row) => {
          const totalBuyers = Math.floor(this.parseNumber(row.total_buyers, 0));
          const churnedBuyers = Math.floor(this.parseNumber(row.churned_buyers, 0));
          const churnRate = totalBuyers > 0 
            ? (churnedBuyers / totalBuyers) * 100 
            : 0;
          
          return {
            period: String(row.period),
            totalBuyers,
            churnedBuyers,
            churnRate: Math.round(churnRate * 100) / 100, // Round to 2 decimal places
          };
        });

      const response: ChurnTrendResponseDto = { trends };

      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            5 * 60, // 5 minutes
            JSON.stringify(response),
          );
        } catch (cacheError) {
          this.logger.warn('Failed to cache churn trend', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get churn trend', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取采购商流失率趋势数据失败: ${error.message}`
        : '获取采购商流失率趋势数据失败';
      throw new BadRequestException(errorMessage);
    }
  }
}

