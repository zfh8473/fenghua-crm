/**
 * Product Association Analysis Controller
 * 
 * Provides REST endpoints for product association analysis
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
import { ProductAssociationAnalysisService } from './product-association-analysis.service';
import {
  ProductAssociationAnalysisQueryDto,
  ProductAssociationAnalysisResponseDto,
  ConversionRateTrendResponseDto,
  ProductCategoriesResponseDto,
} from './dto/product-association-analysis.dto';

@Controller('dashboard/product-association-analysis')
@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)
export class ProductAssociationAnalysisController {
  constructor(
    private readonly productAssociationAnalysisService: ProductAssociationAnalysisService,
  ) {}

  /**
   * Get product association analysis
   * Returns product association statistics with conversion rates
   */
  @Get()
  async getProductAssociationAnalysis(
    @Query() query: ProductAssociationAnalysisQueryDto,
    @Request() req,
  ): Promise<ProductAssociationAnalysisResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.productAssociationAnalysisService.getProductAssociationAnalysis(
      token,
      query.categoryName,
      query.startDate,
      query.endDate,
      query.page || 1,
      query.limit || 20,
    );
  }

  /**
   * Get conversion rate trend
   * Returns time-series data for conversion rate trends
   */
  @Get('trend')
  async getConversionRateTrend(
    @Query('categoryName') categoryName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ): Promise<ConversionRateTrendResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.productAssociationAnalysisService.getConversionRateTrend(
      token,
      categoryName,
      startDate,
      endDate,
    );
  }

  /**
   * Get product categories
   * Returns list of available product categories
   */
  @Get('categories')
  async getProductCategories(
    @Request() req,
  ): Promise<ProductCategoriesResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.productAssociationAnalysisService.getProductCategories(token);
  }

  /**
   * Export product association analysis data
   * Supports CSV format (synchronous export)
   */
  @Get('export')
  async exportAnalysis(
    @Query() query: ProductAssociationAnalysisQueryDto & { format?: string },
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const format = query.format || 'csv';

    if (format !== 'csv') {
      throw new BadRequestException('目前仅支持 CSV 格式导出');
    }

    // Maximum export limit to prevent memory issues
    const MAX_EXPORT_LIMIT = 50000;

    // Get all data (no pagination for export, but with maximum limit)
    const analysisData = await this.productAssociationAnalysisService.getProductAssociationAnalysis(
      token,
      query.categoryName,
      query.startDate,
      query.endDate,
      1, // page
      MAX_EXPORT_LIMIT, // maximum limit to prevent memory issues
    );

    // Check if total exceeds maximum limit
    if (analysisData.total > MAX_EXPORT_LIMIT) {
      throw new BadRequestException(
        `导出数据量过大（${analysisData.total} 条），请使用筛选条件缩小范围，或联系管理员使用异步导出功能`
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      '产品ID',
      '产品名称',
      '产品类别',
      '关联客户数',
      '采购商数',
      '供应商数',
      '互动记录数',
      '订单数',
      '转化率(%)',
    ];

    const csvRows = analysisData.products.map((product) => [
      product.productId,
      product.productName,
      product.categoryName || '',
      product.totalCustomers.toString(),
      product.buyerCount.toString(),
      product.supplierCount.toString(),
      product.totalInteractions.toString(),
      product.orderCount.toString(),
      product.conversionRate.toFixed(2),
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
    const fileName = `产品关联分析_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Send CSV content
    res.send(csvContent);
  }
}

