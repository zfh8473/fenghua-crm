/**
 * Supplier Analysis Controller
 * 
 * Provides REST endpoints for supplier analysis
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
import { SupplierAnalysisService } from './supplier-analysis.service';
import {
  SupplierAnalysisQueryDto,
  SupplierAnalysisResponseDto,
  CooperationTrendResponseDto,
} from './dto/supplier-analysis.dto';

@Controller('dashboard/supplier-analysis')
@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)
export class SupplierAnalysisController {
  constructor(
    private readonly supplierAnalysisService: SupplierAnalysisService,
  ) {}

  /**
   * Get supplier analysis
   * Returns supplier analysis statistics with order counts, amounts, frequencies, and stability ratings
   */
  @Get()
  async getSupplierAnalysis(
    @Query() query: SupplierAnalysisQueryDto,
    @Request() req,
  ): Promise<SupplierAnalysisResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.supplierAnalysisService.getSupplierAnalysis(token, query);
  }

  /**
   * Get cooperation trend
   * Returns time-series data for supplier cooperation frequency trends
   */
  @Get('cooperation-trend')
  async getCooperationTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ): Promise<CooperationTrendResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.supplierAnalysisService.getCooperationTrend(
      token,
      startDate,
      endDate,
    );
  }

  /**
   * Export supplier analysis data
   * Supports CSV format (synchronous export)
   */
  @Get('export')
  async exportAnalysis(
    @Query() query: SupplierAnalysisQueryDto & { format?: string },
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

    // Maximum export limit to prevent memory issues
    const MAX_EXPORT_LIMIT = 50000;

    const analysisData = await this.supplierAnalysisService.exportSupplierAnalysis(
      token,
      query,
    );

    if (analysisData.length > MAX_EXPORT_LIMIT) {
      throw new BadRequestException(
        `导出数据量过大（${analysisData.length} 条），请使用筛选条件缩小范围，或联系管理员使用异步导出功能`
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      '供应商ID',
      '供应商名称',
      '订单量',
      '订单金额',
      '合作频率',
      '最后合作日期',
      '距离最后合作天数',
      '合作稳定性',
      '生命周期价值',
    ];

    const csvRows = analysisData.map((supplier) => [
      supplier.supplierId,
      supplier.supplierName,
      supplier.orderCount.toString(),
      supplier.orderAmount.toFixed(2),
      supplier.cooperationFrequency.toFixed(4),
      supplier.lastCooperationDate,
      supplier.daysSinceLastCooperation.toString(),
      supplier.stabilityRating,
      supplier.lifetimeValue.toFixed(2),
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
    const fileName = `供应商分析_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Send CSV content
    res.send(csvContent);
  }
}

