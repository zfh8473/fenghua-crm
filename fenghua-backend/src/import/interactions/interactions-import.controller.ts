/**
 * Interactions Import Controller
 * 
 * Handles HTTP requests for interaction data import
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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { InteractionsImportService } from './interactions-import.service';
import { UploadFileResponseDto } from '../customers/dto/upload-file.dto';
import { MappingPreviewRequestDto, MappingPreviewResponseDto } from '../customers/dto/mapping-preview.dto';
import { ValidationResultDto } from '../customers/dto/validation-result.dto';
import { ImportResultDto } from '../customers/dto/import-result.dto';
import { StartImportDto } from '../customers/dto/start-import.dto';
import { ImportHistoryQueryDto, ImportHistoryResponseDto } from '../customers/dto/import-history.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../users/guards/admin.guard';
import { Token } from '../../common/decorators/token.decorator';

@Controller('import/interactions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class InteractionsImportController {
  constructor(private readonly importService: InteractionsImportService) {}

  /**
   * Upload import file
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Token() token: string,
  ): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.importService.uploadFile(file);
  }

  /**
   * Get mapping preview
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async getMappingPreview(
    @Body(ValidationPipe) dto: MappingPreviewRequestDto,
    @Token() token: string,
  ): Promise<MappingPreviewResponseDto> {
    return this.importService.getMappingPreview(dto.fileId, dto.customMappings);
  }

  /**
   * Validate import data
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateImportData(
    @Body(ValidationPipe) dto: { fileId: string; columnMappings: any[] },
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ValidationResultDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    return this.importService.validateImportData(dto.fileId, dto.columnMappings, userId, token);
  }

  /**
   * Start import task
   */
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startImport(
    @Body(ValidationPipe) dto: StartImportDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ taskId: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    return this.importService.startImportTask(dto.fileId, dto.columnMappings, userId, token);
  }

  /**
   * Get import task status
   */
  @Get('tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  async getImportTaskStatus(
    @Param('taskId') taskId: string,
    @Token() token: string,
  ): Promise<ImportResultDto> {
    return this.importService.getImportTaskStatus(taskId);
  }

  /**
   * Get import history
   */
  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getImportHistory(
    @Query(ValidationPipe) query: ImportHistoryQueryDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ImportHistoryResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const result = await this.importService.getImportHistory(userId, limit, offset);
    return {
      total: result.total,
      limit: limit,
      offset: offset,
      items: result.items || [],
    };
  }

  /**
   * Download error report
   */
  @Get('tasks/:taskId/error-report')
  @HttpCode(HttpStatus.OK)
  async downloadErrorReport(
    @Param('taskId') taskId: string,
    @Token() token: string,
    @Res() res: Response,
  ): Promise<void> {
    // TODO: Implement error report download
    // This will be implemented in the processor
    throw new NotFoundException('错误报告功能待实现');
  }
}

