/**
 * Analysis Export Controller
 * 
 * REST endpoints for unified analysis result export
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorOrAdminGuard } from '../users/guards/director-or-admin.guard';
import { AnalysisExportService } from './analysis-export.service';
import { AnalysisExportRequestDto } from './dto/analysis-export.dto';

@Controller('dashboard/analysis-export')
@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)
export class AnalysisExportController {
  private readonly logger = new Logger(AnalysisExportController.name);

  constructor(private readonly analysisExportService: AnalysisExportService) {}

  /**
   * Export analysis results
   * POST /api/dashboard/analysis-export
   */
  @Post()
  async exportAnalysis(
    @Body() request: AnalysisExportRequestDto,
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    // Validate request
    if (!request.analysisType || !request.format) {
      throw new BadRequestException('分析类型和导出格式是必需的');
    }

    try {
      // Export analysis
      const result = await this.analysisExportService.exportAnalysis(
        token,
        request.analysisType,
        request.format,
        request.queryParams,
        request.includeCharts,
      );

      // Set response headers
      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(result.fileName)}"`,
      );

      // Send content
      if (Buffer.isBuffer(result.content)) {
        res.send(result.content);
      } else {
        res.send(result.content);
      }
    } catch (error) {
      this.logger.error('Export error in controller', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        errorMessage || '导出失败，请稍后重试。如果问题持续存在，请联系管理员。',
      );
    }
  }
}

