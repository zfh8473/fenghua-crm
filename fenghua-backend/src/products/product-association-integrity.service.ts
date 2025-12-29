/**
 * Product Association Integrity Service
 * 
 * Handles integrity validation for product-customer interactions
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import {
  IntegrityValidationResultDto,
  IntegrityIssueDto,
  IntegrityIssueType,
  IntegrityIssueSeverity,
  IntegrityValidationQueryDto,
  FixIntegrityIssuesDto,
  FixIntegrityIssuesResultDto,
  FixIntegrityIssueAction,
} from './dto/integrity-validation.dto';

/**
 * Validation task status interface
 */
interface ValidationTaskStatus {
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
  result?: IntegrityValidationResultDto;
  error?: string;
}

@Injectable()
export class ProductAssociationIntegrityService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductAssociationIntegrityService.name);
  private pgPool: Pool | null = null;
  private validationTasks: Map<string, ValidationTaskStatus> = new Map();
  private readonly BATCH_SIZE = 1000;

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
      this.logger.warn('DATABASE_URL not configured, integrity validation operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
      });
      this.logger.log('PostgreSQL connection pool initialized for ProductAssociationIntegrityService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Validate product associations (synchronous for small datasets, async for large)
   */
  async validateProductAssociations(
    query?: IntegrityValidationQueryDto,
    token?: string,
    operatorId?: string,
  ): Promise<IntegrityValidationResultDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const validationTime = new Date();
    const issues: IntegrityIssueDto[] = [];

    try {
      // Get total record count
      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM product_customer_interactions pci
        WHERE pci.deleted_at IS NULL
      `;
      const countParams: string[] = [];

      if (query?.productId) {
        totalCountQuery += ' AND pci.product_id = $1';
        countParams.push(query.productId);
      }
      if (query?.customerId) {
        totalCountQuery += ` AND pci.customer_id = $${countParams.length + 1}`;
        countParams.push(query.customerId);
      }

      const totalCountResult = await this.pgPool.query(totalCountQuery, countParams);
      const totalRecords = parseInt(totalCountResult.rows[0].count, 10);

      // For large datasets, use async processing
      if (totalRecords > this.BATCH_SIZE) {
        return this.startAsyncValidation(query, token, operatorId);
      }

      // Synchronous validation for small datasets
      const allIssues = await this.detectIssues(query);
      issues.push(...allIssues);

      const validRecords = totalRecords - issues.length;
      const invalidRecords = issues.length;

      // Generate report ID and persist to database
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const result: IntegrityValidationResultDto = {
        reportId,
        validationTime,
        totalRecords,
        validRecords,
        invalidRecords,
        issues,
      };

      // Persist validation result to database
      await this.persistValidationResult(result, query, 'manual', operatorId);

      return result;
    } catch (error) {
      this.logger.error('Failed to validate product associations', error);
      throw new BadRequestException('验证产品关联完整性失败');
    }
  }

  /**
   * Start async validation for large datasets
   */
  private async startAsyncValidation(
    query?: IntegrityValidationQueryDto,
    token?: string,
    operatorId?: string,
  ): Promise<IntegrityValidationResultDto> {
    const taskId = `validation_${Date.now()}`;
    const taskStatus: ValidationTaskStatus = {
      taskId,
      status: 'running',
      progress: 0,
      message: '开始验证...',
      startedAt: new Date(),
    };
    this.validationTasks.set(taskId, taskStatus);

    // Start async validation in background
    this.performAsyncValidation(taskId, query, token, operatorId).catch((error) => {
      this.logger.error(`Async validation ${taskId} failed`, error);
      const status = this.validationTasks.get(taskId);
      if (status) {
        status.status = 'failed';
        status.error = error instanceof Error ? error.message : String(error);
        status.completedAt = new Date();
      }
    });

    return {
      validationTime: new Date(),
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      issues: [],
      taskId,
      progress: 0,
    };
  }

  /**
   * Perform async validation
   */
  private async performAsyncValidation(
    taskId: string,
    query?: IntegrityValidationQueryDto,
    token?: string,
    operatorId?: string,
  ): Promise<void> {
    const taskStatus = this.validationTasks.get(taskId);
    if (!taskStatus) {
      return;
    }

    try {
      taskStatus.progress = 10;
      taskStatus.message = '检测无效关联...';

      const issues = await this.detectIssues(query);

      taskStatus.progress = 90;
      taskStatus.message = '生成验证报告...';

      // Get total count
      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM product_customer_interactions pci
        WHERE pci.deleted_at IS NULL
      `;
      const countParams: string[] = [];

      if (query?.productId) {
        totalCountQuery += ' AND pci.product_id = $1';
        countParams.push(query.productId);
      }
      if (query?.customerId) {
        totalCountQuery += ` AND pci.customer_id = $${countParams.length + 1}`;
        countParams.push(query.customerId);
      }

      const totalCountResult = await this.pgPool!.query(totalCountQuery, countParams);
      const totalRecords = parseInt(totalCountResult.rows[0].count, 10);
      const validRecords = totalRecords - issues.length;
      const invalidRecords = issues.length;

      // Generate report ID
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const result: IntegrityValidationResultDto = {
        reportId,
        validationTime: taskStatus.startedAt,
        totalRecords,
        validRecords,
        invalidRecords,
        issues,
      };

      // Persist validation result to database
      await this.persistValidationResult(result, query, 'manual', operatorId);

      taskStatus.progress = 100;
      taskStatus.status = 'completed';
      taskStatus.message = '验证完成';
      taskStatus.completedAt = new Date();
      taskStatus.result = result;
    } catch (error) {
      taskStatus.status = 'failed';
      taskStatus.error = error instanceof Error ? error.message : String(error);
      taskStatus.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Detect integrity issues
   */
  private async detectIssues(query?: IntegrityValidationQueryDto): Promise<IntegrityIssueDto[]> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const issues: IntegrityIssueDto[] = [];

    // Build WHERE clause for filtering
    let whereClause = 'WHERE pci.deleted_at IS NULL';
    const params: string[] = [];
    let paramIndex = 1;

    if (query?.productId) {
      whereClause += ` AND pci.product_id = $${paramIndex}`;
      params.push(query.productId);
      paramIndex++;
    }
    if (query?.customerId) {
      whereClause += ` AND pci.customer_id = $${paramIndex}`;
      params.push(query.customerId);
      paramIndex++;
    }

    // Validate query performance using EXPLAIN ANALYZE
    // This ensures indexes are being used and queries are optimized
    const explainQueries = [
      {
        name: 'invalid_product_query',
        query: `
          EXPLAIN ANALYZE
          SELECT pci.id, pci.product_id, pci.customer_id
          FROM product_customer_interactions pci
          LEFT JOIN products p ON p.id = pci.product_id
          ${whereClause}
            AND (p.id IS NULL OR p.deleted_at IS NOT NULL)
          LIMIT 1
        `,
      },
      {
        name: 'invalid_customer_query',
        query: `
          EXPLAIN ANALYZE
          SELECT pci.id, pci.product_id, pci.customer_id
          FROM product_customer_interactions pci
          LEFT JOIN companies c ON c.id = pci.customer_id
          ${whereClause}
            AND (c.id IS NULL OR c.deleted_at IS NOT NULL)
          LIMIT 1
        `,
      },
      {
        name: 'inactive_product_query',
        query: `
          EXPLAIN ANALYZE
          SELECT pci.id, pci.product_id, p.status
          FROM product_customer_interactions pci
          INNER JOIN products p ON p.id = pci.product_id
          ${whereClause}
            AND p.deleted_at IS NULL
            AND p.status = 'inactive'
          LIMIT 1
        `,
      },
    ];

    // Run EXPLAIN ANALYZE for each query to validate performance
    for (const explainQuery of explainQueries) {
      try {
        const explainResult = await this.pgPool.query(explainQuery.query, params);
        const planText = explainResult.rows.map((row) => row['QUERY PLAN'] || row['query plan']).join('\n');
        
        // Log the execution plan for monitoring
        this.logger.debug(`EXPLAIN ANALYZE for ${explainQuery.name}:`, planText);
        
        // Verify that indexes are being used (check for "Index Scan" or "Index Only Scan")
        const usesIndex = /Index (Scan|Only Scan)/i.test(planText);
        if (!usesIndex && planText.includes('Seq Scan')) {
          this.logger.warn(
            `Query ${explainQuery.name} may not be using indexes efficiently. Consider adding indexes.`,
          );
        }
      } catch (error) {
        // Log but don't fail validation if EXPLAIN ANALYZE fails
        this.logger.warn(`Failed to run EXPLAIN ANALYZE for ${explainQuery.name}:`, error);
      }
    }

    // Detect invalid product associations
    const invalidProductQuery = `
      SELECT pci.id, pci.product_id, pci.customer_id, 'invalid_product' as issue_type
      FROM product_customer_interactions pci
      LEFT JOIN products p ON p.id = pci.product_id
      ${whereClause}
        AND (p.id IS NULL OR p.deleted_at IS NOT NULL)
    `;
    const invalidProductResult = await this.pgPool.query(invalidProductQuery, params);
    for (const row of invalidProductResult.rows) {
      issues.push({
        interactionId: row.id,
        issueType: row.product_id ? IntegrityIssueType.DELETED_PRODUCT : IntegrityIssueType.INVALID_PRODUCT,
        severity: IntegrityIssueSeverity.CRITICAL,
        productId: row.product_id,
        customerId: row.customer_id,
        description: row.product_id
          ? '互动记录关联到已删除的产品'
          : '互动记录关联到不存在的产品ID',
        suggestedFix: '删除该互动记录或重新关联到有效的产品',
      });
    }

    // Detect invalid customer associations
    const invalidCustomerQuery = `
      SELECT pci.id, pci.product_id, pci.customer_id, 'invalid_customer' as issue_type
      FROM product_customer_interactions pci
      LEFT JOIN companies c ON c.id = pci.customer_id
      ${whereClause}
        AND (c.id IS NULL OR c.deleted_at IS NOT NULL)
    `;
    const invalidCustomerResult = await this.pgPool.query(invalidCustomerQuery, params);
    for (const row of invalidCustomerResult.rows) {
      issues.push({
        interactionId: row.id,
        issueType: row.customer_id ? IntegrityIssueType.DELETED_CUSTOMER : IntegrityIssueType.INVALID_CUSTOMER,
        severity: IntegrityIssueSeverity.CRITICAL,
        productId: row.product_id,
        customerId: row.customer_id,
        description: row.customer_id
          ? '互动记录关联到已删除的客户'
          : '互动记录关联到不存在的客户ID',
        suggestedFix: '删除该互动记录或重新关联到有效的客户',
      });
    }

    // Detect inactive product associations (warning level)
    const inactiveProductQuery = `
      SELECT pci.id, pci.product_id, p.status, 'inactive_product' as issue_type
      FROM product_customer_interactions pci
      INNER JOIN products p ON p.id = pci.product_id
      ${whereClause}
        AND p.deleted_at IS NULL
        AND p.status = 'inactive'
    `;
    const inactiveProductResult = await this.pgPool.query(inactiveProductQuery, params);
    for (const row of inactiveProductResult.rows) {
      issues.push({
        interactionId: row.id,
        issueType: IntegrityIssueType.INACTIVE_PRODUCT,
        severity: IntegrityIssueSeverity.WARNING,
        productId: row.product_id,
        description: '互动记录关联到非活跃产品',
        suggestedFix: '检查产品状态，确认是否需要更新产品状态或删除互动记录',
      });
    }

    return issues;
  }

  /**
   * Get validation task status
   */
  async getValidationTaskStatus(taskId: string): Promise<ValidationTaskStatus | null> {
    return this.validationTasks.get(taskId) || null;
  }

  /**
   * Persist validation result to database
   */
  private async persistValidationResult(
    result: IntegrityValidationResultDto,
    query?: IntegrityValidationQueryDto,
    validationType: 'manual' | 'scheduled' = 'manual',
    operatorId?: string,
  ): Promise<void> {
    if (!this.pgPool || !result.reportId) {
      return; // Skip persistence if no pool or reportId
    }

    try {
      const insertQuery = `
        INSERT INTO integrity_validation_reports (
          report_id,
          validation_time,
          total_records,
          valid_records,
          invalid_records,
          issues_count,
          issues,
          query_filter,
          validation_type,
          status,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (report_id) DO UPDATE SET
          validation_time = EXCLUDED.validation_time,
          total_records = EXCLUDED.total_records,
          valid_records = EXCLUDED.valid_records,
          invalid_records = EXCLUDED.invalid_records,
          issues_count = EXCLUDED.issues_count,
          issues = EXCLUDED.issues,
          query_filter = EXCLUDED.query_filter,
          status = EXCLUDED.status
      `;

      const queryFilter = query
        ? JSON.stringify({
            ...(query.productId && { productId: query.productId }),
            ...(query.customerId && { customerId: query.customerId }),
          })
        : null;

      await this.pgPool.query(insertQuery, [
        result.reportId,
        result.validationTime,
        result.totalRecords,
        result.validRecords,
        result.invalidRecords,
        result.issues.length,
        JSON.stringify(result.issues),
        queryFilter,
        validationType,
        'completed',
        operatorId || null,
      ]);

      this.logger.log(`Validation result persisted: ${result.reportId}`);
    } catch (error) {
      // Log but don't fail validation if persistence fails
      this.logger.error(`Failed to persist validation result ${result.reportId}:`, error);
    }
  }

  /**
   * Get historical validation reports
   */
  async getHistoricalReports(
    limit: number = 10,
    offset: number = 0,
    validationType?: 'manual' | 'scheduled',
  ): Promise<{
    reports: IntegrityValidationResultDto[];
    total: number;
  }> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      let countQuery = 'SELECT COUNT(*) as total FROM integrity_validation_reports';
      const countParams: any[] = [];

      let selectQuery = `
        SELECT 
          report_id,
          validation_time,
          total_records,
          valid_records,
          invalid_records,
          issues_count,
          issues,
          query_filter,
          validation_type,
          status,
          created_at
        FROM integrity_validation_reports
      `;
      const selectParams: any[] = [];

      if (validationType) {
        countQuery += ' WHERE validation_type = $1';
        countParams.push(validationType);
        selectQuery += ' WHERE validation_type = $1';
        selectParams.push(validationType);
      }

      selectQuery += ' ORDER BY validation_time DESC LIMIT $' + (selectParams.length + 1) + ' OFFSET $' + (selectParams.length + 2);
      selectParams.push(limit, offset);

      const [countResult, selectResult] = await Promise.all([
        this.pgPool.query(countQuery, countParams),
        this.pgPool.query(selectQuery, selectParams),
      ]);

      const total = parseInt(countResult.rows[0].total, 10);
      const reports: IntegrityValidationResultDto[] = selectResult.rows.map((row) => ({
        reportId: row.report_id,
        validationTime: row.validation_time,
        totalRecords: row.total_records,
        validRecords: row.valid_records,
        invalidRecords: row.invalid_records,
        issues: row.issues || [],
      }));

      return { reports, total };
    } catch (error) {
      this.logger.error('Failed to get historical reports', error);
      throw new BadRequestException('获取历史验证报告失败');
    }
  }

  /**
   * Get a specific validation report by reportId
   */
  async getValidationReport(reportId: string): Promise<IntegrityValidationResultDto | null> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    try {
      const query = `
        SELECT 
          report_id,
          validation_time,
          total_records,
          valid_records,
          invalid_records,
          issues_count,
          issues,
          query_filter,
          validation_type,
          status,
          error_message,
          created_at
        FROM integrity_validation_reports
        WHERE report_id = $1
        LIMIT 1
      `;

      const result = await this.pgPool.query(query, [reportId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        reportId: row.report_id,
        validationTime: row.validation_time,
        totalRecords: row.total_records,
        validRecords: row.valid_records,
        invalidRecords: row.invalid_records,
        issues: row.issues || [],
      };
    } catch (error) {
      this.logger.error(`Failed to get validation report ${reportId}:`, error);
      throw new BadRequestException('获取验证报告失败');
    }
  }

  /**
   * Fix integrity issues
   */
  async fixIntegrityIssues(
    fixDto: FixIntegrityIssuesDto,
    operatorId: string,
    token: string,
  ): Promise<FixIntegrityIssuesResultDto> {
    if (!this.pgPool) {
      throw new BadRequestException('数据库连接未初始化');
    }

    const result: FixIntegrityIssuesResultDto = {
      successCount: 0,
      failureCount: 0,
      failedIssueIds: [],
    };

    // For large batches, use transaction
    const useTransaction = fixDto.issueIds.length > 100;
    const client = useTransaction ? await this.pgPool.connect() : null;

    try {
      if (useTransaction && client) {
        await client.query('BEGIN');
      }

      for (const issueId of fixDto.issueIds) {
        try {
          if (fixDto.fixAction === FixIntegrityIssueAction.DELETE) {
            // Soft delete the interaction record
            const updateQuery = `
              UPDATE product_customer_interactions
              SET deleted_at = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP,
                  updated_by = $1
              WHERE id = $2 AND deleted_at IS NULL
            `;
            const queryClient = client || this.pgPool!;
            const updateResult = await queryClient.query(updateQuery, [operatorId, issueId]);

            if (updateResult.rowCount === 0) {
              throw new Error('互动记录不存在或已被删除');
            }

            // Log to audit
            await this.auditService.log({
              action: 'DELETE_INTEGRITY_ISSUE',
              entityType: 'PRODUCT_CUSTOMER_INTERACTION',
              entityId: issueId,
              userId: operatorId,
              operatorId,
              timestamp: new Date(),
              metadata: {
                fixAction: 'delete',
                reason: '完整性验证修复',
              },
            });
          } else if (fixDto.fixAction === FixIntegrityIssueAction.MARK_FIXED) {
            // Mark as fixed by soft deleting (using existing deleted_at field)
            const updateQuery = `
              UPDATE product_customer_interactions
              SET deleted_at = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP,
                  updated_by = $1,
                  additional_info = COALESCE(additional_info, '{}'::jsonb) || '{"fixed_reason": "完整性验证修复"}'::jsonb
              WHERE id = $2 AND deleted_at IS NULL
            `;
            const queryClient = client || this.pgPool!;
            const updateResult = await queryClient.query(updateQuery, [operatorId, issueId]);

            if (updateResult.rowCount === 0) {
              throw new Error('互动记录不存在或已被删除');
            }

            // Log to audit
            await this.auditService.log({
              action: 'MARK_FIXED_INTEGRITY_ISSUE',
              entityType: 'PRODUCT_CUSTOMER_INTERACTION',
              entityId: issueId,
              userId: operatorId,
              operatorId,
              timestamp: new Date(),
              metadata: {
                fixAction: 'mark_fixed',
                reason: '完整性验证修复',
              },
            });
          }

          result.successCount++;
        } catch (error) {
          this.logger.error(`Failed to fix issue ${issueId}`, error);
          result.failureCount++;
          result.failedIssueIds.push(issueId);
        }
      }

      if (useTransaction && client) {
        await client.query('COMMIT');
      }

      return result;
    } catch (error) {
      if (useTransaction && client) {
        await client.query('ROLLBACK');
      }
      this.logger.error('Failed to fix integrity issues', error);
      throw new BadRequestException('修复完整性问题失败');
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Scheduled integrity validation task (runs daily at 2:00 AM by default)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledValidation(): Promise<void> {
    this.logger.log('Starting scheduled integrity validation...');

    try {
      // For scheduled validation, we don't need a token (system-level operation)
      const result = await this.validateProductAssociations();
      
      // Persist scheduled validation result
      if (result.reportId) {
        await this.persistValidationResult(result, undefined, 'scheduled');
      }
      
      this.logger.log(
        `Scheduled integrity validation completed: ${result.validRecords}/${result.totalRecords} valid records, ${result.invalidRecords} issues found (Report ID: ${result.reportId})`,
      );
    } catch (error) {
      this.logger.error('Scheduled integrity validation failed', error);
      
      // Persist failed validation attempt
      try {
        const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const insertQuery = `
          INSERT INTO integrity_validation_reports (
            report_id,
            validation_time,
            validation_type,
            status,
            error_message
          ) VALUES ($1, $2, $3, $4, $5)
        `;
        if (this.pgPool) {
          await this.pgPool.query(insertQuery, [
            reportId,
            new Date(),
            'scheduled',
            'failed',
            errorMessage,
          ]);
        }
      } catch (persistError) {
        this.logger.error('Failed to persist failed validation result', persistError);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed for ProductAssociationIntegrityService');
    }
  }
}

