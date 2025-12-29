/**
 * Companies Service
 * 
 * Handles queries for companies (customers)
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class CompaniesService implements OnModuleDestroy {
  private readonly logger = new Logger(CompaniesService.name);
  private pgPool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {
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
      this.logger.warn('DATABASE_URL not configured, companies operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for CompaniesService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Get a company by ID
   */
  async findOne(id: string): Promise<{ id: string; name: string; customerType?: string }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const result = await this.pgPool.query(
        'SELECT id, name, customer_type FROM companies WHERE id = $1 AND deleted_at IS NULL',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('客户不存在');
      }

      return {
        id: result.rows[0].id,
        name: result.rows[0].name,
        customerType: result.rows[0].customer_type,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to query company', error);
      throw new BadRequestException('查询客户信息失败');
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for CompaniesService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}

