/**
 * GDPR Deletion Scheduler
 * 
 * Scheduled tasks for GDPR deletion deadline monitoring
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GdprDeletionScheduler implements OnModuleInit {
  private readonly logger = new Logger(GdprDeletionScheduler.name);
  private pgPool: Pool | null = null;

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
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, GDPR deletion scheduler will not work');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 2,
      });
      this.logger.log('PostgreSQL connection pool initialized for GdprDeletionScheduler');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  onModuleInit() {
    this.logger.log('GDPR Deletion Scheduler initialized');
  }

  /**
   * Check for deletion requests approaching deadline (25 days) and violations (30 days)
   * Runs daily at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkDeadlineViolations(): Promise<void> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping deadline check');
      return;
    }

    try {
      // Check for requests approaching deadline (25 days)
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() - 25);

      const reminderResult = await this.pgPool.query(
        `SELECT id, user_id, requested_at FROM gdpr_deletion_requests
         WHERE requested_at < $1
         AND status NOT IN ('COMPLETED', 'FAILED')
         AND deleted_at IS NULL`,
        [reminderDate],
      );

      for (const row of reminderResult.rows) {
        this.logger.warn(
          `GDPR deletion request ${row.id} is approaching 30-day deadline. User: ${row.user_id}`,
        );
        // Future: Send reminder notification
      }

      // Check for requests exceeding deadline (30 days)
      const violationDate = new Date();
      violationDate.setDate(violationDate.getDate() - 30);

      const violationResult = await this.pgPool.query(
        `SELECT id, user_id, requested_at FROM gdpr_deletion_requests
         WHERE requested_at < $1
         AND status != 'COMPLETED'
         AND deleted_at IS NULL`,
        [violationDate],
      );

      for (const row of violationResult.rows) {
        this.logger.error(
          `GDPR deletion request ${row.id} has exceeded 30-day deadline. User: ${row.user_id}`,
        );

        // Log violation to audit
        await this.auditService.log({
          action: 'GDPR_DELETION_DEADLINE_VIOLATION',
          entityType: 'GDPR_DELETION',
          entityId: row.id,
          userId: row.user_id,
          operatorId: row.user_id,
          timestamp: new Date(),
          metadata: {
            requestedAt: row.requested_at,
            daysOverdue: Math.floor((new Date().getTime() - new Date(row.requested_at).getTime()) / (1000 * 60 * 60 * 24)),
          },
        });
      }

      this.logger.log(
        `Deadline check completed: ${reminderResult.rows.length} requests approaching deadline, ${violationResult.rows.length} requests exceeded deadline`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to check deadline violations: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }
}
