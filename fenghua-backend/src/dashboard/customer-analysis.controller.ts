/**
 * Customer Analysis Controller
 * 
 * Provides REST endpoints for customer analysis
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
import { CustomerAnalysisService } from './customer-analysis.service';
import {
  CustomerAnalysisQueryDto,
  CustomerAnalysisResponseDto,
  ChurnRateTrendResponseDto,
} from './dto/customer-analysis.dto';

@Controller('dashboard/customer-analysis')
@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)
export class CustomerAnalysisController {
  constructor(
    private readonly customerAnalysisService: CustomerAnalysisService,
  ) {}

  /**
   * Get customer analysis
   * Returns customer analysis statistics with order counts, amounts, frequencies, and churn risk
   */
  @Get()
  async getCustomerAnalysis(
    @Query() query: CustomerAnalysisQueryDto,
    @Request() req,
  ): Promise<CustomerAnalysisResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.customerAnalysisService.getCustomerAnalysis(
      token,
      query.customerType,
      query.startDate,
      query.endDate,
      query.page || 1,
      query.limit || 20,
    );
  }

  /**
   * Get churn rate trend
   * Returns time-series data for customer churn rate trends
   */
  @Get('trend')
  async getChurnRateTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ): Promise<ChurnRateTrendResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.customerAnalysisService.getChurnRateTrend(
      token,
      startDate,
      endDate,
    );
  }

  /**
   * Export customer analysis data
   * Supports CSV format (synchronous export)
   */
  @Get('export')
  async exportAnalysis(
    @Query() query: CustomerAnalysisQueryDto & { format?: string },
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const format = query.format || 'csv';

    // Validate format parameter
    if (!format || typeof format !== 'string' || format.trim() === '') {
      throw new BadRequestException('导出格式参数无效');
    }

    if (format !== 'csv') {
      throw new BadRequestException('目前仅支持 CSV 格式导出');
    }

    // Maximum export limit to prevent memory issues
    const MAX_EXPORT_LIMIT = 50000;

    // Get all data (no pagination for export, but with maximum limit)
    const analysisData = await this.customerAnalysisService.getCustomerAnalysis(
      token,
      query.customerType,
      query.startDate,
      query.endDate,
      1, // page
      MAX_EXPORT_LIMIT + 1, // Request one more than max to check if limit is exceeded
    );

    if (analysisData.customers.length > MAX_EXPORT_LIMIT) {
      throw new BadRequestException(
        `导出数据量过大（${analysisData.total} 条），请使用筛选条件缩小范围，或联系管理员使用异步导出功能`
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      '客户ID',
      '客户名称',
      '客户类型',
      '订单量',
      '订单金额',
      '订单频率',
      '最后互动日期',
      '距离最后互动天数',
      '流失风险',
      '生命周期价值',
    ];

    const csvRows = analysisData.customers.map((customer) => [
      customer.customerId,
      customer.customerName,
      customer.customerType,
      customer.orderCount.toString(),
      customer.orderAmount.toFixed(2),
      customer.orderFrequency.toFixed(2),
      customer.lastInteractionDate,
      customer.daysSinceLastInteraction.toString(),
      customer.churnRisk,
      (customer.lifetimeValue || 0).toFixed(2),
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
    const fileName = `客户分析_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Send CSV content
    res.send(csvContent);
  }
}

