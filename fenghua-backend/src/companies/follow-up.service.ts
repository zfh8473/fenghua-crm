import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export interface FollowUpItem {
  customerId: string;
  customerName: string;
  customerType: 'BUYER' | 'SUPPLIER';
  ownerId: string | null;
  ownerName: string | null;
  followUpIntervalDays: number;
  lastInteractionDate: string | null;
  daysSinceLastInteraction: number;
  daysUntilNextFollowUp: number;
  followUpStatus: 'ok' | 'soon' | 'overdue' | 'new';
}

export interface FollowUpAssignee {
  id: string;
  displayName: string;
  email: string;
}

const MANAGER_ROLES = ['ADMIN', 'DIRECTOR'];
const VALID_INTERVALS = [15, 30, 60, 90];

function isManager(roles: string[]): boolean {
  return roles.some((r) => MANAGER_ROLES.includes(r));
}

function toFollowUpStatus(daysUntil: number, hasInteractions: boolean): FollowUpItem['followUpStatus'] {
  if (!hasInteractions) return 'new';
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 7) return 'soon';
  return 'ok';
}

@Injectable()
export class FollowUpService implements OnModuleInit {
  private readonly logger = new Logger(FollowUpService.name);
  private pgPool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (databaseUrl) {
      this.pgPool = new Pool({ connectionString: databaseUrl, max: 5 });
    } else {
      this.logger.warn('DATABASE_URL not configured');
    }
  }

  async onModuleInit() {
    if (!this.pgPool) return;
    try {
      await this.pgPool.query(`
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id)
      `);
      await this.pgPool.query(`
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS follow_up_interval_days INTEGER NOT NULL DEFAULT 30
      `);
      this.logger.log('follow-up columns ready on companies table');
    } catch (error) {
      this.logger.error('Failed to add follow-up columns', error);
    }
  }

  async getFollowUpList(
    userId: string,
    userRoles: string[],
    ownerFilter?: string,
  ): Promise<FollowUpItem[]> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    const manager = isManager(userRoles);
    const params: any[] = [];
    const conditions: string[] = ['c.deleted_at IS NULL'];

    if (manager) {
      if (ownerFilter === 'unassigned') {
        conditions.push('c.owner_id IS NULL');
      } else if (ownerFilter && ownerFilter !== 'all') {
        params.push(ownerFilter);
        conditions.push(`c.owner_id = $${params.length}`);
      }
    } else {
      params.push(userId);
      conditions.push(`c.owner_id = $${params.length}`);
      // Specialists are restricted by customer type
      const isFrontend = userRoles.includes('FRONTEND_SPECIALIST');
      const isBackend = userRoles.includes('BACKEND_SPECIALIST');
      if (isFrontend) {
        conditions.push(`c.customer_type = 'BUYER'`);
      } else if (isBackend) {
        conditions.push(`c.customer_type = 'SUPPLIER'`);
      }
    }

    const whereClause = conditions.join(' AND ');

    const result = await this.pgPool.query(
      `SELECT
         c.id AS customer_id,
         c.name AS customer_name,
         c.customer_type,
         c.owner_id,
         NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS owner_name,
         c.follow_up_interval_days,
         MAX(pci.interaction_date) AS last_interaction_date,
         CASE
           WHEN MAX(pci.interaction_date) IS NULL THEN NULL
           ELSE GREATEST(0, CURRENT_DATE - MAX(pci.interaction_date)::date)
         END AS days_since_last_interaction
       FROM companies c
       LEFT JOIN users u ON u.id = c.owner_id AND u.deleted_at IS NULL
       LEFT JOIN product_customer_interactions pci
         ON pci.customer_id = c.id AND pci.deleted_at IS NULL
       WHERE ${whereClause}
       GROUP BY c.id, c.name, c.customer_type, c.owner_id, owner_name, c.follow_up_interval_days
       ORDER BY
         CASE
           WHEN MAX(pci.interaction_date) IS NULL THEN 2
           WHEN (c.follow_up_interval_days - GREATEST(0, CURRENT_DATE - MAX(pci.interaction_date)::date)) < 0 THEN 0
           WHEN (c.follow_up_interval_days - GREATEST(0, CURRENT_DATE - MAX(pci.interaction_date)::date)) <= 7 THEN 1
           ELSE 3
         END ASC,
         (c.follow_up_interval_days - GREATEST(0, CURRENT_DATE - MAX(pci.interaction_date)::date)) ASC NULLS LAST,
         c.name ASC`,
      params,
    );

    return result.rows.map((row) => {
      const interval = row.follow_up_interval_days as number;
      const daysSince = row.days_since_last_interaction !== null
        ? Math.floor(Number(row.days_since_last_interaction))
        : 0;
      const hasInteractions = row.last_interaction_date !== null;
      const daysUntil = hasInteractions ? interval - daysSince : interval;

      return {
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerType: row.customer_type as 'BUYER' | 'SUPPLIER',
        ownerId: row.owner_id,
        ownerName: row.owner_name || null,
        followUpIntervalDays: interval,
        lastInteractionDate: row.last_interaction_date
          ? new Date(row.last_interaction_date).toISOString().split('T')[0]
          : null,
        daysSinceLastInteraction: hasInteractions ? daysSince : 0,
        daysUntilNextFollowUp: daysUntil,
        followUpStatus: toFollowUpStatus(daysUntil, hasInteractions),
      };
    });
  }

  async assignConfig(
    customerId: string,
    ownerId: string | null | undefined,
    followUpIntervalDays: number | undefined,
    userRoles: string[],
  ): Promise<void> {
    if (!isManager(userRoles)) throw new ForbiddenException('无权修改跟进配置');
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    if (
      followUpIntervalDays !== undefined &&
      !VALID_INTERVALS.includes(followUpIntervalDays)
    ) {
      throw new BadRequestException(`跟进周期必须为 ${VALID_INTERVALS.join('、')} 天之一`);
    }

    const check = await this.pgPool.query(
      `SELECT id FROM companies WHERE id = $1 AND deleted_at IS NULL`,
      [customerId],
    );
    if (check.rows.length === 0) throw new NotFoundException('客户不存在');

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (ownerId !== undefined) {
      fields.push(`owner_id = $${idx++}`);
      values.push(ownerId);
    }
    if (followUpIntervalDays !== undefined) {
      fields.push(`follow_up_interval_days = $${idx++}`);
      values.push(followUpIntervalDays);
    }

    if (fields.length === 0) return;

    values.push(customerId);
    await this.pgPool.query(
      `UPDATE companies SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      values,
    );
  }

  async getAssignees(): Promise<FollowUpAssignee[]> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    const result = await this.pgPool.query(
      `SELECT id, email,
              NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), '') AS display_name
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), email) ASC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      displayName: row.display_name || row.email,
      email: row.email,
    }));
  }
}
