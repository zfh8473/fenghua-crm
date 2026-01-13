/**
 * Customer Analysis Service
 * 
 * Provides customer analysis data including order statistics, churn rate, and customer lifetime value
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
  CustomerAnalysisResponseDto,
  CustomerAnalysisItemDto,
  ChurnRateTrendResponseDto,
  ChurnRateTrendItemDto,
  CustomerType,
  ChurnRisk,
} from './dto/customer-analysis.dto';
import { FrontendInteractionType } from '../interactions/dto/create-interaction.dto';
import * as redis from 'redis';

@Injectable()
export class CustomerAnalysisService implements OnModuleDestroy {
  private readonly logger = new Logger(CustomerAnalysisService.name);
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
      this.logger.warn('DATABASE_URL not configured, customer analysis operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for CustomerAnalysisService');
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
      this.logger.debug('REDIS_URL not configured, customer analysis caching will be disabled');
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
      this.logger.log('Redis client initialized for customer analysis caching');
    } catch (error) {
      this.logger.warn('Failed to initialize Redis client, caching disabled', error);
      this.redisEnabled = false;
    }
  }

  /**
   * Get customer analysis
   */
  async getCustomerAnalysis(
    token: string,
    customerType?: CustomerType,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<CustomerAnalysisResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Check permissions
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        // For dashboard analysis, we require full access, so deny if filter exists
        if (dataFilter.customerType === 'NONE') {
          this.logger.warn('User attempted to access customer analysis with NONE permissions');
          throw new BadRequestException('您没有权限查看客户分析数据');
        }
        // If a specific customerType filter is returned, it means the user is restricted,
        // and thus should not see aggregated dashboard data.
        this.logger.warn('User attempted to access customer analysis with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看客户分析数据');
      }

      // Check cache first (if Redis is available)
      const cacheKey = `dashboard:customer-analysis:${customerType || 'all'}:${startDate || 'all'}:${endDate || 'all'}:${page}:${limit}`;
      if (this.redisEnabled && this.redisClient) {
        try {
          const cached = await this.redisClient.get(cacheKey);
          if (cached && typeof cached === 'string') {
            this.logger.debug('Returning cached customer analysis data');
            return JSON.parse(cached);
          }
        } catch (cacheError) {
          this.logger.warn('Failed to read from Redis cache', cacheError);
        }
      }

      // Order types for order counting
      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      const offset = (page - 1) * limit;

      // Calculate time range for order frequency calculation
      let actualStartDate = startDate;
      let actualEndDate = endDate;
      let timeRangeDays = 1; // Default to 1 to avoid division by zero

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

      // Build query with filters
      const query = `
        WITH customer_order_stats AS (
          SELECT 
            c.id as customer_id,
            c.name as customer_name,
            c.customer_type,
            c.created_at as customer_created_at,
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
          WHERE c.deleted_at IS NULL
            AND ($5::text IS NULL OR c.customer_type = $5)
          GROUP BY c.id, c.name, c.customer_type, c.created_at
        )
        SELECT 
          cos.customer_id,
          cos.customer_name,
          cos.customer_type,
          cos.order_count,
          cos.total_order_amount,
          CASE 
            -- If more than 1 order, calculate average order interval (days between orders)
            -- Then convert to orders per day: 1 / (days between orders)
            WHEN cos.order_count > 1 AND cos.first_order_date IS NOT NULL AND cos.last_order_date IS NOT NULL
            THEN ROUND(
              ((cos.order_count - 1)::float / NULLIF(EXTRACT(EPOCH FROM (cos.last_order_date - cos.first_order_date)) / 86400.0, 0))::numeric,
              4
            )
            -- If only 1 order or time range specified, use time range days
            WHEN $6::integer > 0 AND cos.order_count > 0
            THEN ROUND((cos.order_count::float / $6::float)::numeric, 4)
            ELSE 0
          END as order_frequency,
          cos.last_interaction_date,
          CASE 
            WHEN cos.last_interaction_date IS NULL 
            THEN EXTRACT(EPOCH FROM (CURRENT_DATE - cos.customer_created_at)) / 86400
            ELSE EXTRACT(EPOCH FROM (CURRENT_DATE - cos.last_interaction_date)) / 86400
          END as days_since_last_interaction,
          cos.total_order_amount as lifetime_value
        FROM customer_order_stats cos
        ORDER BY cos.total_order_amount DESC, cos.order_count DESC
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
        WHERE c.deleted_at IS NULL
          AND ($3::text IS NULL OR c.customer_type = $3)
      `;

      const result = await this.pgPool.query(query, [
        orderTypes[0],
        orderTypes[1],
        actualStartDate || null,
        actualEndDate || null,
        customerType || null,
        timeRangeDays,
        limit,
        offset,
      ]);

      const countResult = await this.pgPool.query(countQuery, [
        actualStartDate || null,
        actualEndDate || null,
        customerType || null,
      ]);

      const total = parseInt(countResult.rows[0]?.total || '0', 10) || 0;

      // Map results to DTOs
      const customers: CustomerAnalysisItemDto[] = result.rows.map((row) => {
        const daysSinceLastInteraction = Math.floor(this.parseNumber(row.days_since_last_interaction, 0));
        
        // Determine churn risk
        let churnRisk: ChurnRisk;
        if (daysSinceLastInteraction > 90) {
          churnRisk = ChurnRisk.HIGH;
        } else if (daysSinceLastInteraction > 60) {
          churnRisk = ChurnRisk.MEDIUM;
        } else if (daysSinceLastInteraction > 30) {
          churnRisk = ChurnRisk.LOW;
        } else {
          churnRisk = ChurnRisk.NONE;
        }

        return {
          customerId: row.customer_id,
          customerName: row.customer_name,
          customerType: row.customer_type as CustomerType,
          orderCount: Math.floor(this.parseNumber(row.order_count, 0)),
          orderAmount: this.parseNumber(row.total_order_amount, 0),
          orderFrequency: this.parseNumber(row.order_frequency, 0), // Orders per day (already calculated in SQL)
          lastInteractionDate: row.last_interaction_date 
            ? new Date(row.last_interaction_date).toISOString()
            : new Date().toISOString(),
          daysSinceLastInteraction,
          churnRisk,
          lifetimeValue: this.parseNumber(row.lifetime_value, 0),
        };
      });

      const response: CustomerAnalysisResponseDto = {
        customers,
        total,
        page,
        limit,
      };

      // Cache the result (if Redis is available)
      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(cacheKey, 300, JSON.stringify(response)); // 5 minutes
        } catch (cacheError) {
          this.logger.warn('Failed to cache customer analysis', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get customer analysis', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取客户分析数据失败: ${error.message}`
        : '获取客户分析数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get churn rate trend
   */
  async getChurnRateTrend(
    token: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ChurnRateTrendResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      // Check permissions
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        // For dashboard analysis, we require full access, so deny if filter exists
        if (dataFilter.customerType === 'NONE') {
          this.logger.warn('User attempted to access churn rate trend with NONE permissions');
          throw new BadRequestException('您没有权限查看客户流失率趋势');
        }
        this.logger.warn('User attempted to access churn rate trend with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看客户流失率趋势');
      }

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

      // Build query for churn rate trend
      // For each time period, calculate:
      // 1. Total customers that existed at the start of the period (active customers)
      // 2. Churned customers (those who were active at period start but churned during the period)
      // Churn definition: A customer churns in a period if:
      //   - They existed at the start of the period
      //   - Their last interaction date is before (period_end - 90 days)
      //   - They had at least one interaction before the period (to avoid counting new customers as churned)
      const query = `
        WITH customer_last_interaction AS (
          SELECT 
            c.id as customer_id,
            c.created_at as customer_created_at,
            MAX(pci.interaction_date) as last_interaction_date,
            MIN(pci.interaction_date) as first_interaction_date
          FROM companies c
          LEFT JOIN product_customer_interactions pci 
            ON pci.customer_id = c.id 
            AND pci.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
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
            -- Total customers: those who existed at the start of the period
            SELECT COUNT(DISTINCT cli.customer_id)
            FROM customer_last_interaction cli
            WHERE cli.customer_created_at <= ps.period_start
          ) as total_customers,
          (
            -- Churned customers: those who were active at period start but churned during the period
            -- A customer is considered churned if:
            --   1. They existed at period start
            --   2. Their last interaction is before (period_end - 90 days)
            --   3. They had at least one interaction before the period (to avoid counting new customers)
            SELECT COUNT(DISTINCT cli.customer_id)
            FROM customer_last_interaction cli
            WHERE cli.customer_created_at <= ps.period_start
              AND (
                -- Customer has no interactions, or last interaction is before churn threshold
                cli.last_interaction_date IS NULL 
                OR cli.last_interaction_date < ps.period_end - INTERVAL '90 days'
              )
              AND (
                -- Customer had at least one interaction before the period (to avoid counting new customers as churned)
                cli.first_interaction_date IS NOT NULL
                AND cli.first_interaction_date < ps.period_start
              )
          ) as churned_customers
        FROM period_series ps
        ORDER BY ps.period_start ASC;
      `;

      const result = await this.pgPool.query(query, [
        timeGrouping,
        actualStartDate || null,
        actualEndDate || null,
      ]);

      const trends: ChurnRateTrendItemDto[] = result.rows.map((row) => {
        const totalCustomers = Math.floor(this.parseNumber(row.total_customers, 0));
        const churnedCustomers = Math.floor(this.parseNumber(row.churned_customers, 0));
        const churnRate = totalCustomers > 0 
          ? (churnedCustomers / totalCustomers) * 100 
          : 0;
        
        return {
          period: row.period,
          totalCustomers,
          churnedCustomers,
          churnRate: Math.round(churnRate * 100) / 100, // Round to 2 decimal places
        };
      });

      return { trends };
    } catch (error) {
      this.logger.error('Failed to get churn rate trend', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取客户流失率趋势数据失败: ${error.message}`
        : '获取客户流失率趋势数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for CustomerAnalysisService');
      } catch (error) {
        this.logger.error('Error closing PostgreSQL connection pool', error);
      }
    }

    if (this.redisClient && this.redisEnabled) {
      try {
        if (this.redisClient.isOpen) {
          await this.redisClient.quit();
          this.logger.log('Redis connection closed for CustomerAnalysisService');
        }
      } catch (error) {
        this.logger.error('Error closing Redis connection', error);
      }
    }
  }
}

