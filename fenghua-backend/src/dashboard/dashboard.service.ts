/**
 * Dashboard Service
 * 
 * Provides business dashboard overview data
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
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import * as redis from 'redis';

@Injectable()
export class DashboardService implements OnModuleDestroy {
  private readonly logger = new Logger(DashboardService.name);
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
      this.logger.warn('DATABASE_URL not configured, dashboard operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for DashboardService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Initialize Redis connection (optional, for caching)
   */
  private initializeRedisConnection(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.debug('REDIS_URL not configured, dashboard caching will be disabled');
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
      this.logger.log('Redis client initialized for dashboard caching');
    } catch (error) {
      this.logger.warn('Failed to initialize Redis client, caching disabled', error);
      this.redisEnabled = false;
    }
  }

  /**
   * Validate cached data structure matches DashboardOverviewDto
   */
  private isValidDashboardOverview(data: any): data is DashboardOverviewDto {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    const requiredFields = [
      'totalCustomers',
      'totalBuyers',
      'totalSuppliers',
      'totalProducts',
      'totalInteractions',
      'newCustomersThisMonth',
      'newInteractionsThisMonth',
    ];
    
    for (const field of requiredFields) {
      if (!(field in data) || typeof data[field] !== 'number' || isNaN(data[field])) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get dashboard overview data
   * Uses single aggregated query for optimal performance
   */
  async getOverview(token: string): Promise<DashboardOverviewDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    // Check cache first (if Redis is available)
    const cacheKey = 'dashboard:overview';
    if (this.redisEnabled && this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached && typeof cached === 'string') {
          this.logger.debug('Returning cached dashboard overview');
          const parsed = JSON.parse(cached);
          
          // Validate cached data structure matches DashboardOverviewDto
          if (this.isValidDashboardOverview(parsed)) {
            return parsed as DashboardOverviewDto;
          } else {
            this.logger.warn('Cached data structure invalid, falling back to database');
            // Fall through to database query
          }
        }
      } catch (error) {
        this.logger.warn('Failed to get from cache, falling back to database', error);
      }
    }

    try {
      // Get data access filter (for ADMIN and DIRECTOR, this returns null - can access all data)
      const dataFilter = await this.permissionService.getDataAccessFilter(token);
      
      // For dashboard, only ADMIN and DIRECTOR should have access to all data
      // The DirectorOrAdminGuard should already enforce this, but we add an extra check here
      // If filter is not null, it means user has restricted access (not ADMIN/DIRECTOR)
      // If customerType is 'NONE', user has no access to any customer data
      if (dataFilter !== null) {
        if (dataFilter.customerType === 'NONE') {
          throw new BadRequestException('您没有权限查看仪表板数据');
        }
        // If filter exists but is not 'NONE', user has restricted access
        // For dashboard, we require full access, so we deny access
        this.logger.warn('User attempted to access dashboard with restricted permissions', { customerType: dataFilter.customerType });
        throw new BadRequestException('您没有权限查看仪表板数据');
      }

      // Execute single aggregated query to get all metrics
      const query = `
        WITH customer_stats AS (
          SELECT 
            COUNT(*) FILTER (WHERE customer_type = 'BUYER') as total_buyers,
            COUNT(*) FILTER (WHERE customer_type = 'SUPPLIER') as total_suppliers,
            COUNT(*) as total_customers,
            COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_customers_this_month
          FROM companies
          WHERE deleted_at IS NULL
        ),
        product_stats AS (
          SELECT COUNT(*) as total_products
          FROM products
          WHERE deleted_at IS NULL
        ),
        interaction_stats AS (
          SELECT 
            COUNT(*) as total_interactions,
            COUNT(*) FILTER (WHERE interaction_date >= DATE_TRUNC('month', CURRENT_DATE)) as new_interactions_this_month
          FROM product_customer_interactions
          WHERE deleted_at IS NULL
        )
        SELECT 
          cs.total_buyers,
          cs.total_suppliers,
          cs.total_customers,
          cs.new_customers_this_month,
          ps.total_products,
          istats.total_interactions,
          istats.new_interactions_this_month
        FROM customer_stats cs, product_stats ps, interaction_stats istats;
      `;

      const result = await this.pgPool.query(query);
      
      // Validate query result
      if (!result.rows || result.rows.length === 0) {
        this.logger.error('Dashboard query returned no rows');
        throw new BadRequestException('无法获取仪表板数据：查询结果为空');
      }

      const row = result.rows[0];

      // Validate and parse numeric values with proper error handling
      const parseNumber = (value: any, fieldName: string): number => {
        if (value === null || value === undefined) {
          this.logger.warn(`Dashboard field ${fieldName} is null or undefined, defaulting to 0`);
          return 0;
        }
        const parsed = parseInt(String(value), 10);
        if (isNaN(parsed)) {
          this.logger.warn(`Dashboard field ${fieldName} is not a valid number: ${value}, defaulting to 0`);
          return 0;
        }
        return parsed;
      };

      const overview: DashboardOverviewDto = {
        totalCustomers: parseNumber(row.total_customers, 'total_customers'),
        totalBuyers: parseNumber(row.total_buyers, 'total_buyers'),
        totalSuppliers: parseNumber(row.total_suppliers, 'total_suppliers'),
        totalProducts: parseNumber(row.total_products, 'total_products'),
        totalInteractions: parseNumber(row.total_interactions, 'total_interactions'),
        newCustomersThisMonth: parseNumber(row.new_customers_this_month, 'new_customers_this_month'),
        newInteractionsThisMonth: parseNumber(row.new_interactions_this_month, 'new_interactions_this_month'),
      };

      // Cache the result (if Redis is available)
      if (this.redisEnabled && this.redisClient) {
        try {
          await this.redisClient.setEx(
            cacheKey,
            5 * 60, // 5 minutes TTL
            JSON.stringify(overview),
          );
          this.logger.debug('Cached dashboard overview');
        } catch (error) {
          this.logger.warn('Failed to cache dashboard overview', error);
        }
      }

      return overview;
    } catch (error) {
      this.logger.error('Failed to get dashboard overview', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('获取仪表板数据失败');
    }
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
        // Check if Redis client is open before attempting to quit
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

