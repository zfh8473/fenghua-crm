/**
 * Audit Logs Controller
 * 
 * Provides audit log query endpoints
 * All custom code is proprietary and not open source.
 */

import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AuditLogDto } from './dto/audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { UsersService } from '../users/users.service';
import { Token } from '../common/decorators/token.decorator';
import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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
}

