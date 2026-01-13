/**
 * Business Trend Analysis Service
 * 
 * Provides business trend analysis data including order trends, customer growth trends, and sales trends
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
  BusinessTrendAnalysisQueryDto,
  BusinessTrendAnalysisResponseDto,
  BusinessTrendItemDto,
  TrendSummaryDto,
  TimeGranularity,
  TrendMetric,
} from './dto/business-trend-analysis.dto';
import { FrontendInteractionType } from '../interactions/dto/create-interaction.dto';
import * as redis from 'redis';

@Injectable()
export class BusinessTrendAnalysisService implements OnModuleDestroy {
  private readonly logger = new Logger(BusinessTrendAnalysisService.name);
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
      this.logger.warn('DATABASE_URL not configured, business trend analysis operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for BusinessTrendAnalysisService');
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
      this.logger.debug('REDIS_URL not configured, business trend analysis caching will be disabled');
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
      this.logger.log('Redis client initialized for business trend analysis caching');
    } catch (error) {
      this.logger.warn('Failed to initialize Redis client, caching disabled', error);
      this.redisEnabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  /**
   * Get business trend analysis
   */
  async getBusinessTrendAnalysis(
    token: string,
    queryDto: BusinessTrendAnalysisQueryDto,
  ): Promise<BusinessTrendAnalysisResponseDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const { startDate, endDate, timeGranularity = TimeGranularity.MONTH, metrics } = queryDto;

    try {
      // Check permissions
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      if (dataFilter !== null) {
        this.logger.warn('User attempted to access business trend analysis with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看业务趋势分析数据');
      }

      // Check cache first (if Redis is available)
      const cacheKey = `dashboard:business-trend-analysis:${startDate || 'all'}:${endDate || 'all'}:${timeGranularity}:${metrics?.join(',') || 'all'}`;
      if (this.redisEnabled && this.redisClient) {
        try {
          const cached = await this.redisClient.get(cacheKey);
          if (cached && typeof cached === 'string') {
            this.logger.debug('Returning cached business trend analysis data');
            const parsed = JSON.parse(cached);
            if (this.isValidBusinessTrendResponse(parsed)) {
              return parsed;
            }
          }
        } catch (cacheError) {
          this.logger.warn('Failed to read from Redis cache', cacheError);
        }
      }

      // Parse dates and set defaults
      let actualStartDate = startDate;
      let actualEndDate = endDate;

      if (!actualStartDate || !actualEndDate) {
        // Default to last 12 months if no date range specified
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setMonth(defaultStartDate.getMonth() - 12);
        const defaultStartDateStr = defaultStartDate.toISOString().split('T')[0];
        
        if (!actualStartDate) {
          actualStartDate = defaultStartDateStr;
        }
        if (!actualEndDate) {
          actualEndDate = defaultEndDate.toISOString().split('T')[0];
        }
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
      }

      // Determine which metrics to include
      const includeOrderCount = !metrics || metrics.includes(TrendMetric.ORDER_COUNT);
      const includeCustomerGrowth = !metrics || metrics.includes(TrendMetric.CUSTOMER_GROWTH);
      const includeSalesAmount = !metrics || metrics.includes(TrendMetric.SALES_AMOUNT);

      // Map time granularity to SQL DATE_TRUNC parameter
      const dateTruncParam = timeGranularity === TimeGranularity.QUARTER ? 'quarter' : timeGranularity;

      // Build query for order count trend
      const orderTypes = [
        FrontendInteractionType.ORDER_SIGNED,
        FrontendInteractionType.ORDER_COMPLETED,
      ];

      // Build comprehensive query using CTEs
      const query = `
        WITH period_series AS (
          SELECT DATE_TRUNC($1::text, period_date) as period_start
          FROM generate_series(
            DATE_TRUNC($1::text, $2::date),
            DATE_TRUNC($1::text, $3::date),
            CASE 
              WHEN $1::text = 'day' THEN '1 day'::interval
              WHEN $1::text = 'week' THEN '1 week'::interval
              WHEN $1::text = 'month' THEN '1 month'::interval
              WHEN $1::text = 'quarter' THEN '3 months'::interval
              WHEN $1::text = 'year' THEN '1 year'::interval
              ELSE '1 month'::interval
            END
          ) as period_date
        ),
        order_trends AS (
          SELECT 
            DATE_TRUNC($1::text, pci.interaction_date) as period,
            COUNT(pci.id) FILTER (
              WHERE pci.interaction_type IN ($4, $5)
            ) as order_count
          FROM product_customer_interactions pci
          WHERE pci.deleted_at IS NULL
            AND ($2::date IS NULL OR pci.interaction_date >= $2)
            AND ($3::date IS NULL OR pci.interaction_date <= $3)
            AND pci.interaction_type IN ($4, $5)
          GROUP BY DATE_TRUNC($1::text, pci.interaction_date)
        ),
        customer_growth_trends AS (
          SELECT 
            DATE_TRUNC($1::text, c.created_at) as period,
            COUNT(c.id) as customer_growth
          FROM companies c
          WHERE c.deleted_at IS NULL
            AND ($2::date IS NULL OR c.created_at >= $2)
            AND ($3::date IS NULL OR c.created_at <= $3)
          GROUP BY DATE_TRUNC($1::text, c.created_at)
        ),
        sales_trends AS (
          SELECT 
            DATE_TRUNC($1::text, pci.interaction_date) as period,
            COALESCE(
              SUM(
                CASE 
                  WHEN pci.interaction_type IN ($4, $5)
                  THEN CAST(COALESCE(
                    (pci.additional_info->>'orderAmount')::numeric,
                    (pci.additional_info->>'amount')::numeric,
                    0
                  ) AS numeric)
                  ELSE 0
                END
              ),
              0
            ) as sales_amount
          FROM product_customer_interactions pci
          WHERE pci.deleted_at IS NULL
            AND ($2::date IS NULL OR pci.interaction_date >= $2)
            AND ($3::date IS NULL OR pci.interaction_date <= $3)
            AND pci.interaction_type IN ($4, $5)
          GROUP BY DATE_TRUNC($1::text, pci.interaction_date)
        )
        SELECT 
          CASE 
            WHEN $1::text = 'day' THEN TO_CHAR(ps.period_start, 'YYYY-MM-DD')
            WHEN $1::text = 'week' THEN TO_CHAR(ps.period_start, 'YYYY-"W"IW')
            WHEN $1::text = 'month' THEN TO_CHAR(ps.period_start, 'YYYY-MM')
            WHEN $1::text = 'quarter' THEN TO_CHAR(ps.period_start, 'YYYY-"Q"Q')
            WHEN $1::text = 'year' THEN TO_CHAR(ps.period_start, 'YYYY')
            ELSE TO_CHAR(ps.period_start, 'YYYY-MM')
          END as period,
          COALESCE(ot.order_count, 0) as order_count,
          COALESCE(cgt.customer_growth, 0) as customer_growth,
          COALESCE(st.sales_amount, 0) as sales_amount
        FROM period_series ps
        LEFT JOIN order_trends ot ON ot.period = ps.period_start
        LEFT JOIN customer_growth_trends cgt ON cgt.period = ps.period_start
        LEFT JOIN sales_trends st ON st.period = ps.period_start
        ORDER BY ps.period_start ASC;
      `;

      const result = await this.pgPool.query(query, [
        dateTruncParam,
        actualStartDate || null,
        actualEndDate || null,
        orderTypes[0],
        orderTypes[1],
      ]);

      // Process results and calculate growth rates
      const trends: BusinessTrendItemDto[] = [];
      let previousOrderCount = 0;
      let previousSalesAmount = 0;
      // Store data by period key for year-over-year comparison
      // Key format: period without year (e.g., "01" for month, "Q1" for quarter)
      const previousYearData: Map<string, { orderCount: number; salesAmount: number }> = new Map();

      for (const row of result.rows) {
        const orderCount = this.parseNumber(row.order_count, 0);
        const customerGrowth = this.parseNumber(row.customer_growth, 0);
        const salesAmount = this.parseNumber(row.sales_amount, 0);

        // Calculate growth rate (环比) - compare with previous period
        let growthRate: number | undefined;
        if (previousOrderCount > 0) {
          growthRate = ((orderCount - previousOrderCount) / previousOrderCount) * 100;
        }

        // Calculate year-over-year growth rate (同比)
        // Extract period key for comparison (e.g., "01" from "2024-01", "Q1" from "2024-Q1")
        let yearOverYearGrowthRate: number | undefined;
        const periodKey = String(row.period);
        let comparisonKey = '';
        
        if (timeGranularity === TimeGranularity.MONTH && periodKey.length >= 7) {
          // Extract month part (e.g., "01" from "2024-01")
          comparisonKey = periodKey.substring(5);
        } else if (timeGranularity === TimeGranularity.QUARTER && periodKey.includes('Q')) {
          // Extract quarter part (e.g., "Q1" from "2024-Q1")
          comparisonKey = periodKey.substring(periodKey.indexOf('Q'));
        } else if (timeGranularity === TimeGranularity.DAY && periodKey.length >= 10) {
          // Extract day part (e.g., "01-15" from "2024-01-15")
          comparisonKey = periodKey.substring(5);
        } else if (timeGranularity === TimeGranularity.WEEK && periodKey.includes('W')) {
          // Extract week part (e.g., "W01" from "2024-W01")
          comparisonKey = periodKey.substring(periodKey.indexOf('W'));
        } else if (timeGranularity === TimeGranularity.YEAR) {
          // For year, compare with same period in previous year (not applicable for year granularity)
          comparisonKey = '';
        } else {
          // Fallback: use full period key
          comparisonKey = periodKey;
        }

        if (comparisonKey) {
          const previousYear = previousYearData.get(comparisonKey);
          if (previousYear && previousYear.orderCount > 0) {
            yearOverYearGrowthRate = ((orderCount - previousYear.orderCount) / previousYear.orderCount) * 100;
          }
        }

        // Store current period data for next year's comparison
        // Only store if we have a valid comparison key
        if (comparisonKey) {
          previousYearData.set(comparisonKey, { orderCount, salesAmount });
        }

        trends.push({
          period: periodKey,
          orderCount: includeOrderCount ? orderCount : 0,
          customerGrowth: includeCustomerGrowth ? customerGrowth : 0,
          salesAmount: includeSalesAmount ? salesAmount : 0,
          growthRate: growthRate !== undefined ? Math.round(growthRate * 100) / 100 : undefined,
          yearOverYearGrowthRate: yearOverYearGrowthRate !== undefined ? Math.round(yearOverYearGrowthRate * 100) / 100 : undefined,
        });

        previousOrderCount = orderCount;
        previousSalesAmount = salesAmount;
      }

      // Calculate summary
      const totalOrderCount = trends.reduce((sum, t) => sum + t.orderCount, 0);
      const totalCustomerGrowth = trends.reduce((sum, t) => sum + t.customerGrowth, 0);
      const totalSalesAmount = trends.reduce((sum, t) => sum + t.salesAmount, 0);
      const growthRates = trends.filter(t => t.growthRate !== undefined).map(t => t.growthRate!);
      const averageGrowthRate = growthRates.length > 0
        ? growthRates.reduce((sum, r) => sum + r, 0) / growthRates.length
        : 0;

      const summary: TrendSummaryDto = {
        totalOrderCount,
        totalCustomerGrowth,
        totalSalesAmount,
        averageGrowthRate: Math.round(averageGrowthRate * 100) / 100,
      };

      const response: BusinessTrendAnalysisResponseDto = {
        trends,
        summary,
      };

      // Cache the response
      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            5 * 60, // 5 minutes
            JSON.stringify(response),
          );
          this.logger.debug('Cached business trend analysis');
        } catch (cacheError) {
          this.logger.warn('Failed to cache business trend analysis', cacheError);
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to get business trend analysis', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? `获取业务趋势分析数据失败: ${error.message}`
        : '获取业务趋势分析数据失败';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Validate business trend response structure
   */
  private isValidBusinessTrendResponse(data: any): data is BusinessTrendAnalysisResponseDto {
    return (
      data &&
      Array.isArray(data.trends) &&
      data.summary &&
      typeof data.summary.totalOrderCount === 'number' &&
      typeof data.summary.totalCustomerGrowth === 'number' &&
      typeof data.summary.totalSalesAmount === 'number' &&
      typeof data.summary.averageGrowthRate === 'number'
    );
  }
}

