/**
 * Product Association Integrity Controller
 * 
 * Provides REST endpoints for integrity validation
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Logger,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ProductAssociationIntegrityService } from './product-association-integrity.service';
import {
  IntegrityValidationResultDto,
  IntegrityValidationQueryDto,
  FixIntegrityIssuesDto,
  FixIntegrityIssuesResultDto,
} from './dto/integrity-validation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('products/integrity')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ProductAssociationIntegrityController {
  private readonly logger = new Logger(ProductAssociationIntegrityController.name);

  constructor(
    private readonly integrityService: ProductAssociationIntegrityService,
  ) {}

  /**
   * Validate product associations integrity
   */
  @Get('validate')
  async validateIntegrity(
    @Query(ValidationPipe) query: IntegrityValidationQueryDto,
    @Token() token: string,
    @Request() req,
  ): Promise<IntegrityValidationResultDto> {
    try {
      const operatorId = req.user?.id;
      return await this.integrityService.validateProductAssociations(query, token, operatorId);
    } catch (error) {
      this.logger.error('Failed to validate integrity', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('验证产品关联完整性失败');
    }
  }

  /**
   * Get validation task status (for async validation)
   */
  @Get('validate/:taskId')
  async getValidationTaskStatus(@Param('taskId') taskId: string): Promise<{
    taskId: string;
    status: string;
    progress: number;
    message: string;
    result?: IntegrityValidationResultDto;
    error?: string;
  }> {
    const taskStatus = await this.integrityService.getValidationTaskStatus(taskId);
    if (!taskStatus) {
      throw new BadRequestException('验证任务不存在');
    }

    return {
      taskId: taskStatus.taskId,
      status: taskStatus.status,
      progress: taskStatus.progress,
      message: taskStatus.message,
      result: taskStatus.result,
      error: taskStatus.error,
    };
  }

  /**
   * Fix integrity issues
   */
  @Post('fix')
  async fixIntegrityIssues(
    @Body(ValidationPipe) fixDto: FixIntegrityIssuesDto,
    @Token() token: string,
    @Request() req,
  ): Promise<FixIntegrityIssuesResultDto> {
    try {
      const operatorId = req.user?.id;
      if (!operatorId) {
        throw new BadRequestException('无法获取操作者ID');
      }

      return await this.integrityService.fixIntegrityIssues(fixDto, operatorId, token);
    } catch (error) {
      this.logger.error('Failed to fix integrity issues', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('修复完整性问题失败');
    }
  }

  /**
   * Get historical validation reports
   */
  @Get('reports')
  async getHistoricalReports(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('type') validationType?: 'manual' | 'scheduled',
  ): Promise<{
    reports: IntegrityValidationResultDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const result = await this.integrityService.getHistoricalReports(
        limit,
        offset,
        validationType,
      );
      return {
        ...result,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error('Failed to get historical reports', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('获取历史验证报告失败');
    }
  }

  /**
   * Get a specific validation report by reportId
   */
  @Get('reports/:reportId')
  async getValidationReport(@Param('reportId') reportId: string): Promise<IntegrityValidationResultDto> {
    try {
      const report = await this.integrityService.getValidationReport(reportId);
      if (!report) {
        throw new BadRequestException('验证报告不存在');
      }
      return report;
    } catch (error) {
      this.logger.error(`Failed to get validation report ${reportId}`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('获取验证报告失败');
    }
  }
}

