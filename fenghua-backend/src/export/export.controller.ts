/**
 * Export Controller
 * 
 * Handles HTTP requests for data export
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
  NotFoundException,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ExportService } from './export.service';
import { ExportRequestDto, ExportFormat, ExportDataType } from './dto/export-request.dto';
import { ExportTaskResponseDto, ExportHistoryResponseDto } from './dto/export-response.dto';
import { FieldDefinitionService } from './services/field-definition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { Token } from '../common/decorators/token.decorator';
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('export')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(
    private readonly exportService: ExportService,
    private readonly fieldDefinitionService: FieldDefinitionService,
  ) {}

  /**
   * Start export task
   */
  @Post(':type')
  @HttpCode(HttpStatus.ACCEPTED)
  async startExport(
    @Param('type') type: string,
    @Body(ValidationPipe) body: Partial<ExportRequestDto>,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ taskId: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    // Map type to ExportDataType
    const dataTypeMap: Record<string, any> = {
      customers: 'CUSTOMER',
      products: 'PRODUCT',
      interactions: 'INTERACTION',
    };

    const dataType = dataTypeMap[type.toLowerCase()];
    if (!dataType) {
      throw new BadRequestException(`不支持的导出类型: ${type}`);
    }

    const request: ExportRequestDto = {
      dataType,
      format: body.format || ExportFormat.JSON,
      customerFilters: body.customerFilters,
      productFilters: body.productFilters,
      interactionFilters: body.interactionFilters,
      selectedFields: body.selectedFields, // Include selected fields
    };

    // Log selected fields for debugging
    if (request.selectedFields && request.selectedFields.length > 0) {
      this.logger.log(`Export request with ${request.selectedFields.length} selected fields: ${request.selectedFields.join(', ')}`);
    } else {
      this.logger.log('Export request with no field selection (will export all fields)');
    }

    return this.exportService.startExport(request, userId, token);
  }

  /**
   * Get export task status
   */
  @Get('tasks/:taskId')
  async getExportTaskStatus(
    @Param('taskId') taskId: string,
  ): Promise<ExportTaskResponseDto> {
    return this.exportService.getExportTaskStatus(taskId);
  }

  /**
   * Download export file
   */
  @Get('files/:fileId')
  async downloadExportFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = this.exportService.getExportFilePath(fileId);
    if (!filePath) {
      throw new NotFoundException('导出文件不存在或已过期');
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('导出文件不存在');
    }

    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', this.getContentType(filePath));

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  /**
   * Get available fields for export data type
   */
  @Get('fields/:dataType')
  async getAvailableFields(
    @Param('dataType') dataType: string,
  ) {
    const dataTypeMap: Record<string, ExportDataType> = {
      customers: ExportDataType.CUSTOMER,
      customer: ExportDataType.CUSTOMER,
      products: ExportDataType.PRODUCT,
      product: ExportDataType.PRODUCT,
      interactions: ExportDataType.INTERACTION,
      interaction: ExportDataType.INTERACTION,
    };

    const exportDataType = dataTypeMap[dataType.toLowerCase()];
    if (!exportDataType) {
      throw new BadRequestException(`不支持的导出类型: ${dataType}`);
    }

    return this.fieldDefinitionService.getAvailableFields(exportDataType);
  }

  /**
   * Get export history
   */
  @Get('history')
  async getExportHistory(
    @Req() req: Request & { user?: { id: string } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('exportType') exportType?: string,
    @Query('format') format?: string,
    @Query('status') status?: string,
  ): Promise<ExportHistoryResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    return this.exportService.getExportHistory(userId, {
      exportType: exportType as any,
      format: format as any,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return contentTypeMap[ext] || 'application/octet-stream';
  }
}

