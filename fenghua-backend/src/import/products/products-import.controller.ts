/**
 * Products Import Controller
 * 
 * Handles HTTP requests for product data import
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
import { ProductsImportService } from './products-import.service';
import { UploadFileResponseDto } from '../customers/dto/upload-file.dto';
import { MappingPreviewRequestDto, MappingPreviewResponseDto } from '../customers/dto/mapping-preview.dto';
import { ValidationResultDto } from '../customers/dto/validation-result.dto';
import { ImportResultDto } from '../customers/dto/import-result.dto';
import { StartImportDto } from '../customers/dto/start-import.dto';
import { ImportHistoryQueryDto, ImportHistoryResponseDto } from '../customers/dto/import-history.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../users/guards/admin.guard';
import { Token } from '../../common/decorators/token.decorator';

@Controller('import/products')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ProductsImportController {
  constructor(private readonly importService: ProductsImportService) {}

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
    @Body(ValidationPipe) dto: MappingPreviewRequestDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ValidationResultDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    return this.importService.validateImportData(dto.fileId, dto.customMappings || [], userId, token);
  }

  /**
   * Start import task
   */
  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  async startImport(
    @Body(ValidationPipe) dto: StartImportDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ taskId: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('无法获取用户ID');
    }

    return this.importService.startImportTask(
      dto.fileId,
      dto.columnMappings || [],
      userId,
      token,
    );
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
      throw new BadRequestException('无法获取用户ID');
    }

    const result = await this.importService.getImportHistory(
      userId,
      query.limit,
      query.offset,
      query.status as 'processing' | 'completed' | 'failed' | undefined,
    );

    return {
      total: result.total,
      limit: query.limit || 20,
      offset: query.offset || 0,
      items: result.items,
    };
  }

  /**
   * Download error report
   */
  @Get('reports/:taskId')
  async downloadErrorReport(
    @Param('taskId') taskId: string,
    @Token() token: string,
    @Res() res: Response,
  ): Promise<void> {
    const reportPath = await this.importService.getErrorReportPath(taskId);

    if (!reportPath || !fs.existsSync(reportPath)) {
      throw new NotFoundException('错误报告文件不存在或已过期');
    }

    const fileName = path.basename(reportPath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    const fileStream = fs.createReadStream(reportPath);
    fileStream.pipe(res);
  }
}


