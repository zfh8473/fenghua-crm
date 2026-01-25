/**
 * People Interaction Stats Service
 * 
 * Provides person interaction statistics including last contact date and monthly contact count
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PermissionService } from '../permission/permission.service';
import { PersonInteractionStatsDto } from './dto/person-interaction-stats.dto';

/**
 * Internal stats interface
 */
interface PersonInteractionStats {
  lastContactDate: Date | null;
  thisMonthCount: number;
}

@Injectable()
export class PeopleInteractionStatsService implements OnModuleDestroy {
  private readonly logger = new Logger(PeopleInteractionStatsService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
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
      this.logger.warn('DATABASE_URL not configured, people interaction stats operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size
      });
      this.logger.log('PostgreSQL connection pool initialized for PeopleInteractionStatsService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Get interaction statistics for a single person
   */
  async getPersonInteractionStats(
    personId: string,
    token: string,
  ): Promise<PersonInteractionStatsDto> {
    if (!this.pgPool) {
      throw new InternalServerErrorException('数据库连接未初始化');
    }

    try {
      // 1. Get data access filter based on user role
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      // 2. Verify person exists and get company_id
      const personResult = await this.pgPool.query(
        `SELECT p.id, p.company_id, c.customer_type
         FROM people p
         INNER JOIN companies c ON c.id = p.company_id
         WHERE p.id = $1 AND p.deleted_at IS NULL AND c.deleted_at IS NULL`,
        [personId],
      );

      if (personResult.rows.length === 0) {
        throw new NotFoundException('联系人不存在');
      }

      const person = personResult.rows[0];
      const companyCustomerType = person.customer_type;

      // 3. Apply permission filter based on company's customer type
      if (dataFilter?.customerType) {
        const allowedType = dataFilter.customerType.toUpperCase();
        if (companyCustomerType !== allowedType) {
          throw new ForbiddenException(
            `您没有权限查看${companyCustomerType === 'BUYER' ? '采购商' : '供应商'}类型客户的联系人统计信息`,
          );
        }
      }

      // 4. Query last contact date
      const lastContactQuery = `
        SELECT MAX(interaction_date) as last_contact_date
        FROM product_customer_interactions
        WHERE person_id = $1 AND deleted_at IS NULL
      `;

      const lastContactResult = await this.pgPool.query(lastContactQuery, [personId]);
      const lastContactDate = lastContactResult.rows[0]?.last_contact_date || null;

      // 5. Query this month's contact count
      const thisMonthCountQuery = `
        SELECT COUNT(*) as this_month_count
        FROM product_customer_interactions
        WHERE person_id = $1 
          AND interaction_date >= DATE_TRUNC('month', CURRENT_DATE)
          AND deleted_at IS NULL
      `;

      const thisMonthCountResult = await this.pgPool.query(thisMonthCountQuery, [personId]);
      const thisMonthCount = parseInt(thisMonthCountResult.rows[0]?.this_month_count || '0', 10);

      // 6. Return statistics
      return {
        lastContactDate: lastContactDate ? lastContactDate.toISOString() : null,
        thisMonthCount,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('Failed to get person interaction stats', error);
      throw new InternalServerErrorException('查询联系人互动统计信息失败');
    }
  }

  /**
   * Get interaction statistics for multiple persons (batch query)
   */
  async getMultiplePersonInteractionStats(
    personIds: string[],
    token: string,
  ): Promise<Map<string, PersonInteractionStatsDto>> {
    if (!this.pgPool) {
      throw new InternalServerErrorException('数据库连接未初始化');
    }

    if (personIds.length === 0) {
      return new Map();
    }

    try {
      // 1. Get data access filter based on user role
      const dataFilter = await this.permissionService.getDataAccessFilter(token);

      // 2. Verify persons exist and get their company info
      const personsQuery = `
        SELECT p.id, p.company_id, c.customer_type
        FROM people p
        INNER JOIN companies c ON c.id = p.company_id
        WHERE p.id = ANY($1) AND p.deleted_at IS NULL AND c.deleted_at IS NULL
      `;

      const personsResult = await this.pgPool.query(personsQuery, [personIds]);

      if (personsResult.rows.length === 0) {
        return new Map();
      }

      // 3. Filter persons based on permission
      const allowedPersonIds: string[] = [];
      for (const person of personsResult.rows) {
        const companyCustomerType = person.customer_type;
        if (dataFilter?.customerType) {
          const allowedType = dataFilter.customerType.toUpperCase();
          if (companyCustomerType === allowedType) {
            allowedPersonIds.push(person.id);
          }
        } else {
          // No filter - user can access all
          allowedPersonIds.push(person.id);
        }
      }

      if (allowedPersonIds.length === 0) {
        return new Map();
      }

      // 4. Batch query statistics
      const batchQuery = `
        SELECT 
          person_id,
          MAX(interaction_date) as last_contact_date,
          COUNT(*) FILTER (WHERE interaction_date >= DATE_TRUNC('month', CURRENT_DATE)) as this_month_count
        FROM product_customer_interactions
        WHERE person_id = ANY($1) AND deleted_at IS NULL
        GROUP BY person_id
      `;

      const batchResult = await this.pgPool.query(batchQuery, [allowedPersonIds]);

      // 5. Build result map
      const statsMap = new Map<string, PersonInteractionStatsDto>();

      for (const row of batchResult.rows) {
        statsMap.set(row.person_id, {
          lastContactDate: row.last_contact_date ? row.last_contact_date.toISOString() : null,
          thisMonthCount: parseInt(row.this_month_count || '0', 10),
        });
      }

      // 6. Add entries for persons with no interactions
      for (const personId of allowedPersonIds) {
        if (!statsMap.has(personId)) {
          statsMap.set(personId, {
            lastContactDate: null,
            thisMonthCount: 0,
          });
        }
      }

      return statsMap;
    } catch (error) {
      this.logger.error('Failed to get multiple person interaction stats', error);
      throw new InternalServerErrorException('批量查询联系人互动统计信息失败');
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for PeopleInteractionStatsService');
    }
  }
}
