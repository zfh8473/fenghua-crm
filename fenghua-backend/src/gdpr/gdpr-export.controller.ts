/**
 * GDPR Export Controller
 * 
 * Handles HTTP requests for GDPR data export
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
  NotFoundException,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { GdprExportService } from './gdpr-export.service';
import { 
  CreateGdprExportRequestDto, 
  GdprExportRequestResponseDto, 
  GdprExportRequestListResponseDto,
  GdprExportRequestIdDto,
  GdprExportRequestListQueryDto,
} from './dto/gdpr-export-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('gdpr')
@UseGuards(JwtAuthGuard) // Note: NOT using AdminGuard - all authenticated users can request GDPR export
export class GdprExportController {
  private readonly logger = new Logger(GdprExportController.name);

  constructor(
    private readonly gdprExportService: GdprExportService,
  ) {}

  /**
   * Create GDPR export request
   */
  @Post('export-request')
  @HttpCode(HttpStatus.ACCEPTED)
  async createExportRequest(
    @Body() body: CreateGdprExportRequestDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<GdprExportRequestResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    return this.gdprExportService.createExportRequest(body, userId, token);
  }

  /**
   * Get user's export request list
   */
  @Get('export-requests')
  async getExportRequests(
    @Req() req: Request & { user?: { id: string } },
    @Query() query: GdprExportRequestListQueryDto,
  ): Promise<GdprExportRequestListResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    // Handle default values for limit and offset
    const limit = query.limit !== undefined ? query.limit : 50;
    const offset = query.offset !== undefined ? query.offset : 0;

    return this.gdprExportService.getExportRequestList(
      userId,
      limit,
      offset,
    );
  }

  /**
   * Get export request by ID
   */
  @Get('export-requests/:id')
  async getExportRequest(
    @Param() params: GdprExportRequestIdDto,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<GdprExportRequestResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    return this.gdprExportService.getExportRequest(params.id, userId);
  }

  /**
   * Download export file
   */
  @Get('export-requests/:id/download')
  async downloadExportFile(
    @Param() params: GdprExportRequestIdDto,
    @Query('token') token: string,
    @Res() res: Response,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    if (!token) {
      throw new BadRequestException('缺少下载令牌');
    }

    const filePath = await this.gdprExportService.getExportFilePath(params.id, userId, token);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('导出文件不存在');
    }

    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', this.getContentType(filePath));

    const fileStream = fs.createReadStream(filePath);

    // Handle file stream errors
    fileStream.on('error', (error) => {
      this.logger.error('Error streaming export file', error);
      if (!res.headersSent) {
        res.status(500).json({ message: '文件下载失败' });
      }
    });

    // Handle response stream errors
    res.on('error', (error) => {
      this.logger.error('Error sending response', error);
      fileStream.destroy();
    });

    fileStream.pipe(res);
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.json': 'application/json',
      '.csv': 'text/csv',
    };
    return contentTypeMap[ext] || 'application/octet-stream';
  }
}
