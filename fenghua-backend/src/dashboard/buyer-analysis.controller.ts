/**
 * Buyer Analysis Controller
 * 
 * Provides REST endpoints for buyer analysis
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
import { BuyerAnalysisService } from './buyer-analysis.service';
import {
  BuyerAnalysisQueryDto,
  BuyerAnalysisResponseDto,
  ActivityTrendResponseDto,
  ChurnTrendResponseDto,
} from './dto/buyer-analysis.dto';

@Controller('dashboard/buyer-analysis')
@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)
export class BuyerAnalysisController {
  constructor(
    private readonly buyerAnalysisService: BuyerAnalysisService,
  ) {}

  /**
   * Get buyer analysis
   * Returns buyer analysis statistics with order counts, amounts, frequencies, activity levels, and churn risk
   */
  @Get()
  async getBuyerAnalysis(
    @Query() query: BuyerAnalysisQueryDto,
    @Request() req,
  ): Promise<BuyerAnalysisResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.buyerAnalysisService.getBuyerAnalysis(token, query);
  }

  /**
   * Get activity trend
   * Returns time-series data for buyer activity level trends
   */
  @Get('activity-trend')
  async getActivityTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ): Promise<ActivityTrendResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.buyerAnalysisService.getActivityTrend(
      token,
      startDate,
      endDate,
    );
  }

  /**
   * Get churn trend
   * Returns time-series data for buyer churn rate trends
   */
  @Get('churn-trend')
  async getChurnTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ): Promise<ChurnTrendResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.buyerAnalysisService.getChurnTrend(
      token,
      startDate,
      endDate,
    );
  }

  /**
   * Export buyer analysis data
   * Supports CSV format (synchronous export)
   */
  @Get('export')
  async exportAnalysis(
    @Query() query: BuyerAnalysisQueryDto & { format?: string },
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const format = (query.format || 'csv').toLowerCase().trim();

    // Validate format parameter
    if (!format || format === '') {
      throw new BadRequestException('导出格式参数无效');
    }

    if (format !== 'csv') {
      throw new BadRequestException('目前仅支持 CSV 格式导出');
    }

    // Get all data for export (data limit check is performed in service layer)
    const analysisData = await this.buyerAnalysisService.exportBuyerAnalysis(
      token,
      query,
    );

    // Convert to CSV format
    const csvHeaders = [
      '采购商ID',
      '采购商名称',
      '订单量',
      '订单金额',
      '订单频率',
      '最后互动日期',
      '距离最后互动天数',
      '活跃度',
      '活跃度评级',
      '流失风险',
      '生命周期价值',
    ];

    const csvRows = analysisData.map((buyer) => [
      buyer.buyerId,
      buyer.buyerName,
      buyer.orderCount.toString(),
      buyer.orderAmount.toFixed(2),
      buyer.orderFrequency.toFixed(4),
      buyer.lastInteractionDate,
      buyer.daysSinceLastInteraction.toString(),
      buyer.activityLevel.toFixed(2),
      buyer.activityRating,
      buyer.churnRisk,
      buyer.lifetimeValue.toFixed(2),
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
    const fileName = `采购商分析_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Send CSV content
    res.send(csvContent);
  }
}

