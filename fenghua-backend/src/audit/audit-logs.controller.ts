/**
 * Audit Logs Controller
 * 
 * Provides audit log query endpoints
 * All custom code is proprietary and not open source.
 */

import { Controller, Get, Query, Param, UseGuards, UsePipes, ValidationPipe, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditLogDto } from './dto/audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { UsersService } from '../users/users.service';
import { Token } from '../common/decorators/token.decorator';
import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CsvExporterService } from '../export/services/csv-exporter.service';
import { ExcelExporterService } from '../export/services/excel-exporter.service';

enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
}

class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  operatorEmail?: string;

  @IsOptional()
  @IsString()
  entityType?: string; // For filtering by resource type (e.g., 'CUSTOMER', 'PRODUCT', 'INTERACTION')

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

interface AuditLogWithEmail extends AuditLogDto {
  operatorEmail?: string;
}

interface PaginatedAuditLogResponse {
  data: AuditLogWithEmail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, AdminGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuditLogsController {
  constructor(
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
    private readonly csvExporter: CsvExporterService,
    private readonly excelExporter: ExcelExporterService,
  ) {}

  /**
   * Query audit logs
   * Supports filtering by action type, operator ID/email, and time range
   * Note: Operator email filtering is limited by in-memory storage - see AuditService.getAuditLogs
   * Enriches audit logs with operator email from user service
   */
  @Get()
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
    @Token() token: string,
  ): Promise<PaginatedAuditLogResponse> {
    const result = await this.auditService.getAuditLogs(
      {
        action: query.action,
        operatorId: query.operatorId,
        operatorEmail: query.operatorEmail,
        entityType: query.entityType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      },
      {
        page: query.page,
        limit: query.limit,
      },
    );

    // Enrich audit logs with operator email
    const operatorIds = [...new Set(result.data.map(log => log.operatorId))];
    const operatorEmailMap = new Map<string, string>();

    // Fetch operator emails (with error handling to not fail the entire request)
    for (const operatorId of operatorIds) {
      try {
        const user = await this.usersService.findOne(operatorId);
        operatorEmailMap.set(operatorId, user.email);
      } catch (error) {
        // If user not found or error, skip email enrichment for this operator
        // This is acceptable as email is optional information
      }
    }

    // Enrich logs with email
    const enrichedData: AuditLogWithEmail[] = result.data.map(log => ({
      ...log,
      operatorEmail: operatorEmailMap.get(log.operatorId),
    }));

    return {
      ...result,
      data: enrichedData,
    };
  }

  /**
   * Get a single audit log by ID
   */
  @Get(':id')
  async getAuditLogById(
    @Param('id') id: string,
  ): Promise<AuditLogWithEmail & { id?: string }> {
    const auditLog = await this.auditService.getAuditLogById(id);
    if (!auditLog) {
      throw new BadRequestException('Audit log not found');
    }

    // Enrich with operator email
    let operatorEmail: string | undefined;
    try {
      const user = await this.usersService.findOne(auditLog.operatorId);
      operatorEmail = user.email;
    } catch (error) {
      // If user not found, skip email enrichment
    }

    return {
      ...auditLog,
      operatorEmail,
    };
  }

  /**
   * Export audit logs
   * Supports CSV and Excel formats
   */
  @Get('export')
  async exportAuditLogs(
    @Query() query: AuditLogQueryDto & { format?: ExportFormat },
    @Res() res: Response,
  ): Promise<void> {
    const format = query.format || ExportFormat.CSV;

    // Get all audit logs matching the query (no pagination for export)
    const result = await this.auditService.getAuditLogs(
      {
        action: query.action,
        operatorId: query.operatorId,
        operatorEmail: query.operatorEmail,
        entityType: query.entityType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      },
      {
        page: 1,
        limit: 10000, // Large limit for export
      },
    );

    // Enrich with operator emails
    const operatorIds = [...new Set(result.data.map(log => log.operatorId))];
    const operatorEmailMap = new Map<string, string>();
    for (const operatorId of operatorIds) {
      try {
        const user = await this.usersService.findOne(operatorId);
        operatorEmailMap.set(operatorId, user.email);
      } catch (error) {
        // Skip if user not found
      }
    }

    const enrichedData = result.data.map(log => ({
      ...log,
      operatorEmail: operatorEmailMap.get(log.operatorId),
    }));

    // Prepare data for export
    const exportData = enrichedData.map(log => ({
      '操作类型': log.action,
      '用户ID': log.operatorId,
      '用户邮箱': log.operatorEmail || '',
      '资源类型': log.entityType,
      '资源ID': log.entityId,
      '操作时间': log.timestamp.toISOString(),
      '操作结果': log.metadata?.operationResult || (log.action === 'DATA_ACCESS' ? 'SUCCESS' : ''),
      '失败原因': log.reason || '',
      'IP地址': log.ipAddress || '',
      '用户代理': log.userAgent || '',
    }));

    const fileName = `audit-logs-${new Date().toISOString().split('T')[0]}`;
    const tempDir = require('os').tmpdir();
    const tempFilePath = require('path').join(tempDir, `${fileName}-${Date.now()}.${format === ExportFormat.EXCEL ? 'xlsx' : 'csv'}`);

    try {
      if (format === ExportFormat.EXCEL) {
        await this.excelExporter.exportToFile(exportData, tempFilePath, 'AUDIT_LOG');
        const fs = require('fs');
        const buffer = fs.readFileSync(tempFilePath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
        res.send(buffer);
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
      } else {
        await this.csvExporter.exportToFile(exportData, tempFilePath);
        const fs = require('fs');
        const csv = fs.readFileSync(tempFilePath, 'utf-8');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
        res.send(csv);
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
      }
    } catch (error) {
      // Clean up temp file on error
      try {
        const fs = require('fs');
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
}

