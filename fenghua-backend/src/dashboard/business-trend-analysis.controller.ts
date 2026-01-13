/**
 * Business Trend Analysis Controller
 * 
 * REST endpoints for business trend analysis
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorOrAdminGuard } from '../users/guards/director-or-admin.guard';
import { BusinessTrendAnalysisService } from './business-trend-analysis.service';
import {
  BusinessTrendAnalysisQueryDto,
  BusinessTrendAnalysisResponseDto,
} from './dto/business-trend-analysis.dto';

@Controller('dashboard/business-trend-analysis')
@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)
export class BusinessTrendAnalysisController {
  constructor(
    private readonly businessTrendAnalysisService: BusinessTrendAnalysisService,
  ) {}

  /**
   * Get business trend analysis
   * GET /api/dashboard/business-trend-analysis
   */
  @Get()
  async getBusinessTrendAnalysis(
    @Query() query: BusinessTrendAnalysisQueryDto,
    @Request() req,
  ): Promise<BusinessTrendAnalysisResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.businessTrendAnalysisService.getBusinessTrendAnalysis(token, query);
  }

  /**
   * Export business trend analysis data
   * GET /api/dashboard/business-trend-analysis/export
   * Supports CSV format (synchronous export)
   */
  @Get('export')
  async exportAnalysis(
    @Query() query: BusinessTrendAnalysisQueryDto & { format?: string },
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const format = query.format || 'csv';

    // Validate format parameter
    if (!format || typeof format !== 'string' || format.trim() === '') {
      throw new BadRequestException('导出格式参数无效');
    }

    if (format.toLowerCase().trim() !== 'csv') {
      throw new BadRequestException('目前仅支持 CSV 格式导出');
    }

    // Get all trend data
    const trendData = await this.businessTrendAnalysisService.getBusinessTrendAnalysis(token, query);

    // Check data volume limit
    const MAX_EXPORT_DATA_POINTS = 10000;
    if (trendData.trends.length > MAX_EXPORT_DATA_POINTS) {
      throw new BadRequestException(
        `导出数据量过大（${trendData.trends.length} 个数据点），请缩小时间范围或使用更大的时间粒度`
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      '时间周期',
      '订单量',
      '新增客户数',
      '销售额',
      '环比增长率(%)',
      '同比增长率(%)',
    ];

    const csvRows = trendData.trends.map((trend) => [
      trend.period,
      trend.orderCount.toString(),
      trend.customerGrowth.toString(),
      trend.salesAmount.toFixed(2),
      trend.growthRate !== undefined ? trend.growthRate.toFixed(2) : '',
      trend.yearOverYearGrowthRate !== undefined ? trend.yearOverYearGrowthRate.toFixed(2) : '',
    ]);

    // Generate CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) =>
        row.map((cell) => {
          // Escape commas and quotes
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ),
    ].join('\n');

    // Set response headers
    const timeGranularity = query.timeGranularity || 'month';
    const fileName = `业务趋势分析_${timeGranularity}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Send CSV content
    res.send(csvContent);
  }
}

