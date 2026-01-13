/**
 * Analysis Export Service
 * 
 * Unified service for exporting analysis results in multiple formats
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AnalysisType, ExportFormat } from './dto/analysis-export.dto';
import { ProductAssociationAnalysisService } from './product-association-analysis.service';
import { CustomerAnalysisService } from './customer-analysis.service';
import { SupplierAnalysisService } from './supplier-analysis.service';
import { BuyerAnalysisService } from './buyer-analysis.service';
import { BusinessTrendAnalysisService } from './business-trend-analysis.service';
import { ExcelExporterService } from '../export/services/excel-exporter.service';
import { CsvExporterService } from '../export/services/csv-exporter.service';

// Import pdfkit using TypeScript's import = require syntax
// This avoids the default import transformation issue
// @ts-ignore - pdfkit doesn't have TypeScript definitions
import PDFDocument = require('pdfkit');

/**
 * Export data limits to prevent memory issues
 */
const EXPORT_LIMITS = {
  [ExportFormat.CSV]: 50000,
  [ExportFormat.EXCEL]: 50000,
  [ExportFormat.PDF]: 10000,
  [ExportFormat.PNG]: 1000,
  [ExportFormat.JPEG]: 1000,
};

/**
 * Interface for export result
 */
export interface ExportResult {
  content: string | Buffer;
  contentType: string;
  fileName: string;
}

@Injectable()
export class AnalysisExportService {
  private readonly logger = new Logger(AnalysisExportService.name);

  constructor(
    private readonly productAssociationAnalysisService: ProductAssociationAnalysisService,
    private readonly customerAnalysisService: CustomerAnalysisService,
    private readonly supplierAnalysisService: SupplierAnalysisService,
    private readonly buyerAnalysisService: BuyerAnalysisService,
    private readonly businessTrendAnalysisService: BusinessTrendAnalysisService,
    private readonly excelExporterService: ExcelExporterService,
    private readonly csvExporterService: CsvExporterService,
  ) {}

  /**
   * Export analysis results
   * @param token User authentication token
   * @param analysisType Type of analysis to export
   * @param format Export format
   * @param queryParams Analysis query parameters
   * @param includeCharts Whether to include charts (for PDF/image formats)
   * @returns Export result with content, content type, and file name
   */
  async exportAnalysis(
    token: string,
    analysisType: AnalysisType,
    format: ExportFormat,
    queryParams?: Record<string, any>,
    includeCharts?: boolean,
  ): Promise<ExportResult> {
    try {
      // Validate format
      if (!Object.values(ExportFormat).includes(format)) {
        throw new BadRequestException(`不支持的导出格式: ${format}`);
      }

      // Get analysis data based on type
      const analysisData = await this.getAnalysisData(
        token,
        analysisType,
        queryParams,
      );

      // Check data volume limit
      const dataCount = this.getDataCount(analysisData, analysisType);
      const limit = EXPORT_LIMITS[format];
      if (dataCount > limit) {
        throw new BadRequestException(
          `导出数据量过大（${dataCount} 条），超过限制（${limit} 条）。请使用筛选条件缩小范围`,
        );
      }

      // Export based on format
      switch (format) {
        case ExportFormat.CSV:
          return this.exportToCsv(analysisData, analysisType);
        case ExportFormat.EXCEL:
          return this.exportToExcel(analysisData, analysisType);
        case ExportFormat.PDF:
          return this.exportToPdf(analysisData, analysisType, queryParams, includeCharts);
        case ExportFormat.PNG:
        case ExportFormat.JPEG:
          // Image export will be handled on frontend
          throw new BadRequestException('图片导出功能由前端处理');
        default:
          throw new BadRequestException(`不支持的导出格式: ${format}`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to export analysis', error);
      throw new InternalServerErrorException(
        '导出失败，请稍后重试。如果问题持续存在，请联系管理员。',
      );
    }
  }

  /**
   * Get analysis data based on type
   */
  private async getAnalysisData(
    token: string,
    analysisType: AnalysisType,
    queryParams?: Record<string, any>,
  ): Promise<any> {
    switch (analysisType) {
      case AnalysisType.PRODUCT_ASSOCIATION:
        return await this.productAssociationAnalysisService.getProductAssociationAnalysis(
          token,
          queryParams?.categoryName,
          queryParams?.startDate,
          queryParams?.endDate,
          1,
          EXPORT_LIMITS[ExportFormat.CSV] + 1, // Request one more to check limit
        );
      case AnalysisType.CUSTOMER:
        return await this.customerAnalysisService.getCustomerAnalysis(
          token,
          queryParams?.customerType,
          queryParams?.startDate,
          queryParams?.endDate,
          1,
          EXPORT_LIMITS[ExportFormat.CSV] + 1,
        );
      case AnalysisType.SUPPLIER:
        return await this.supplierAnalysisService.getSupplierAnalysis(
          token,
          {
            startDate: queryParams?.startDate,
            endDate: queryParams?.endDate,
            categoryName: queryParams?.categoryName,
            page: 1,
            limit: EXPORT_LIMITS[ExportFormat.CSV] + 1,
          },
        );
      case AnalysisType.BUYER:
        return await this.buyerAnalysisService.getBuyerAnalysis(
          token,
          {
            startDate: queryParams?.startDate,
            endDate: queryParams?.endDate,
            categoryName: queryParams?.categoryName,
            page: 1,
            limit: EXPORT_LIMITS[ExportFormat.CSV] + 1,
          },
        );
      case AnalysisType.BUSINESS_TREND:
        return await this.businessTrendAnalysisService.getBusinessTrendAnalysis(
          token,
          {
            startDate: queryParams?.startDate,
            endDate: queryParams?.endDate,
            timeGranularity: queryParams?.timeGranularity,
            metrics: queryParams?.metrics,
          },
        );
      default:
        throw new BadRequestException(`不支持的分析类型: ${analysisType}`);
    }
  }

  /**
   * Get data count from analysis result
   */
  private getDataCount(analysisData: any, analysisType: AnalysisType): number {
    switch (analysisType) {
      case AnalysisType.PRODUCT_ASSOCIATION:
        return analysisData.total || analysisData.products?.length || 0;
      case AnalysisType.CUSTOMER:
        return analysisData.total || analysisData.customers?.length || 0;
      case AnalysisType.SUPPLIER:
        return Array.isArray(analysisData) ? analysisData.length : analysisData.total || 0;
      case AnalysisType.BUYER:
        return Array.isArray(analysisData) ? analysisData.length : analysisData.total || 0;
      case AnalysisType.BUSINESS_TREND:
        return analysisData.trends?.length || 0;
      default:
        return 0;
    }
  }

  /**
   * Export to CSV format
   */
  private async exportToCsv(
    analysisData: any,
    analysisType: AnalysisType,
  ): Promise<ExportResult> {
    const { headers, rows } = this.prepareCsvData(analysisData, analysisType);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(','),
      ),
    ].join('\n');

    const fileName = this.generateFileName(analysisType, ExportFormat.CSV);
    return {
      content: csvContent,
      contentType: 'text/csv; charset=utf-8',
      fileName,
    };
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(
    analysisData: any,
    analysisType: AnalysisType,
  ): Promise<ExportResult> {
    const { headers, rows } = this.prepareCsvData(analysisData, analysisType);
    
    // Convert to Excel format using xlsx library
    const XLSX = require('xlsx');
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    const sheetName = this.getSheetName(analysisType);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = this.generateFileName(analysisType, ExportFormat.EXCEL);
    return {
      content: excelBuffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName,
    };
  }

  /**
   * Prepare CSV data (headers and rows)
   */
  private prepareCsvData(
    analysisData: any,
    analysisType: AnalysisType,
  ): { headers: string[]; rows: any[][] } {
    switch (analysisType) {
      case AnalysisType.PRODUCT_ASSOCIATION:
        return {
          headers: [
            '产品ID',
            '产品名称',
            '产品类别',
            '关联客户数',
            '采购商数',
            '供应商数',
            '互动记录数',
            '订单数',
            '转化率(%)',
          ],
          rows: (analysisData.products || []).map((product: any) => [
            product.productId,
            product.productName,
            product.categoryName || '',
            product.totalCustomers.toString(),
            product.buyerCount.toString(),
            product.supplierCount.toString(),
            product.totalInteractions.toString(),
            product.orderCount.toString(),
            product.conversionRate.toFixed(2),
          ]),
        };
      case AnalysisType.CUSTOMER:
        return {
          headers: [
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
          ],
          rows: (analysisData.customers || []).map((customer: any) => [
            customer.customerId,
            customer.customerName,
            customer.customerType,
            customer.orderCount.toString(),
            customer.orderAmount.toFixed(2),
            customer.orderFrequency.toFixed(4),
            customer.lastInteractionDate,
            customer.daysSinceLastInteraction.toString(),
            customer.churnRisk,
            customer.lifetimeValue.toFixed(2),
          ]),
        };
      case AnalysisType.SUPPLIER:
        return {
          headers: [
            '供应商ID',
            '供应商名称',
            '订单量',
            '订单金额',
            '合作频率',
            '最后合作日期',
            '距离最后合作天数',
            '合作稳定性',
            '生命周期价值',
          ],
          rows: (Array.isArray(analysisData) ? analysisData : analysisData.suppliers || []).map(
            (supplier: any) => [
              supplier.supplierId,
              supplier.supplierName,
              supplier.orderCount.toString(),
              supplier.orderAmount.toFixed(2),
              supplier.cooperationFrequency.toFixed(4),
              supplier.lastCooperationDate,
              supplier.daysSinceLastCooperation.toString(),
              supplier.stabilityRating,
              supplier.lifetimeValue.toFixed(2),
            ],
          ),
        };
      case AnalysisType.BUYER:
        return {
          headers: [
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
          ],
          rows: (Array.isArray(analysisData) ? analysisData : analysisData.buyers || []).map(
            (buyer: any) => [
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
            ],
          ),
        };
      case AnalysisType.BUSINESS_TREND:
        // Validate business trend data structure
        if (!analysisData) {
          this.logger.warn('Business trend analysisData is null or undefined');
          return { headers: [], rows: [] };
        }
        if (!analysisData.trends) {
          this.logger.warn('Business trend analysisData.trends is missing', { analysisData });
          return { headers: [], rows: [] };
        }
        const trends = Array.isArray(analysisData.trends) ? analysisData.trends : [];
        return {
          headers: [
            '时间周期',
            '订单量',
            '新增客户数',
            '销售额',
            '环比增长率(%)',
            '同比增长率(%)',
          ],
          rows: trends.map((trend: any) => [
            trend?.period || '',
            (trend?.orderCount !== undefined && trend?.orderCount !== null) ? trend.orderCount.toString() : '0',
            (trend?.customerGrowth !== undefined && trend?.customerGrowth !== null) ? trend.customerGrowth.toString() : '0',
            (trend?.salesAmount !== undefined && trend?.salesAmount !== null) ? Number(trend.salesAmount).toFixed(2) : '0.00',
            (trend?.growthRate !== undefined && trend?.growthRate !== null) ? Number(trend.growthRate).toFixed(2) : '',
            (trend?.yearOverYearGrowthRate !== undefined && trend?.yearOverYearGrowthRate !== null)
              ? Number(trend.yearOverYearGrowthRate).toFixed(2)
              : '',
          ]),
        };
      default:
        throw new BadRequestException(`不支持的分析类型: ${analysisType}`);
    }
  }

  /**
   * Export to PDF format
   */
  private async exportToPdf(
    analysisData: any,
    analysisType: AnalysisType,
    queryParams?: Record<string, any>,
    includeCharts?: boolean,
  ): Promise<ExportResult> {
    return new Promise((resolve, reject) => {
      try {
        // Validate input data
        if (!analysisData) {
          reject(new BadRequestException('分析数据为空'));
          return;
        }

        // Validate data
        const { headers, rows } = this.prepareCsvData(analysisData, analysisType);
        if (!headers || !Array.isArray(headers) || headers.length === 0) {
          reject(new BadRequestException('没有可导出的数据：表头为空'));
          return;
        }
        if (!rows || !Array.isArray(rows)) {
          reject(new BadRequestException('没有可导出的数据：数据行为空'));
          return;
        }

        const chunks: Buffer[] = [];
        // PDFDocument is imported at module level using import = require
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // Register Chinese font if available, otherwise use default
        // Try to use system fonts for Chinese support
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Common Chinese font paths on macOS/Linux
          const fontPaths = [
            '/System/Library/Fonts/PingFang.ttc',
            '/System/Library/Fonts/STHeiti Light.ttc',
            '/System/Library/Fonts/STHeiti Medium.ttc',
            '/Library/Fonts/Microsoft/SimHei.ttf',
            '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
            '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
          ];
          
          let chineseFontPath: string | null = null;
          for (const fontPath of fontPaths) {
            if (fs.existsSync(fontPath)) {
              chineseFontPath = fontPath;
              break;
            }
          }
          
          if (chineseFontPath) {
            doc.registerFont('ChineseFont', chineseFontPath);
            doc.font('ChineseFont');
            this.logger.debug(`Using Chinese font: ${chineseFontPath}`);
          } else {
            // Fallback: use a font that supports Unicode (Helvetica supports basic Unicode)
            // For better Chinese support, we'll encode text as UTF-8 and let pdfkit handle it
            this.logger.warn('No Chinese font found, using default font (may cause encoding issues)');
          }
        } catch (fontError) {
          this.logger.warn('Failed to register Chinese font', fontError);
          // Continue with default font
        }

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          const fileName = this.generateFileName(analysisType, ExportFormat.PDF);
          resolve({
            content: pdfBuffer,
            contentType: 'application/pdf',
            fileName,
          });
        });
        doc.on('error', (error) => {
          this.logger.error('PDF generation error', error);
          reject(new InternalServerErrorException('PDF 生成失败'));
        });

        // Add title
        const title = this.getAnalysisTitle(analysisType);
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();

        // Add export metadata
        doc.fontSize(10).fillColor('gray');
        const exportTime = new Date().toLocaleString('zh-CN');
        doc.text(`导出时间: ${exportTime}`, { align: 'left' });
        
        if (queryParams) {
          const filters: string[] = [];
          if (queryParams.startDate) {
            filters.push(`开始日期: ${queryParams.startDate}`);
          }
          if (queryParams.endDate) {
            filters.push(`结束日期: ${queryParams.endDate}`);
          }
          if (queryParams.categoryName) {
            filters.push(`类别: ${queryParams.categoryName}`);
          }
          if (queryParams.customerType) {
            filters.push(`客户类型: ${queryParams.customerType}`);
          }
          if (filters.length > 0) {
            doc.text(`筛选条件: ${filters.join(', ')}`, { align: 'left' });
          }
        }
        doc.moveDown();
        doc.fillColor('black');

        // Add data table (headers and rows already prepared above)
        // Table header
        doc.fontSize(12).fillColor('black');
        const tableTop = doc.y;
        const rowHeight = 20;
        
        // Validate page width
        const pageWidth = doc.page?.width || 595.28; // A4 width in points (default)
        const availableWidth = pageWidth - 100;
        if (availableWidth <= 0 || headers.length === 0) {
          reject(new BadRequestException('无法计算表格列宽：页面宽度或表头数量无效'));
          return;
        }
        
        const colWidths = this.calculateColumnWidths(headers.length, availableWidth);
        
        // Draw header background
        doc.rect(50, tableTop, doc.page.width - 100, rowHeight)
          .fillColor('#f0f0f0')
          .fill()
          .fillColor('black');

        // Draw header text
        let x = 55;
        headers.forEach((header, index) => {
          if (colWidths[index] === undefined || colWidths[index] <= 0) {
            this.logger.warn(`Invalid column width at index ${index}, using default`);
            return;
          }
          doc.fontSize(10)
            .text(String(header || ''), x, tableTop + 5, {
              width: Math.max(colWidths[index] - 10, 10),
              align: 'left',
            });
          x += colWidths[index];
        });

        // Draw data rows
        let currentY = tableTop + rowHeight;
        rows.forEach((row, rowIndex) => {
          // Check if we need a new page
          if (currentY + rowHeight > doc.page.height - 50) {
            doc.addPage();
            currentY = 50;
          }

          // Alternate row background
          if (rowIndex % 2 === 0) {
            doc.rect(50, currentY, doc.page.width - 100, rowHeight)
              .fillColor('#fafafa')
              .fill()
              .fillColor('black');
          }

          // Draw row data
          x = 55;
          row.forEach((cell, cellIndex) => {
            if (colWidths[cellIndex] === undefined || colWidths[cellIndex] <= 0) {
              this.logger.warn(`Invalid column width at index ${cellIndex}, skipping cell`);
              return;
            }
            // Use Chinese font if registered (font is set globally after registration)
            const cellText = String(cell || '');
            doc.fontSize(9).text(cellText, x, currentY + 5, {
              width: Math.max(colWidths[cellIndex] - 10, 10),
              align: 'left',
            });
            x += colWidths[cellIndex];
          });

          currentY += rowHeight;
        });

        // Add summary if available
        if (analysisData.summary) {
          doc.addPage();
          doc.fontSize(16).text('统计摘要', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12);
          
          if (analysisData.summary.totalOrderCount !== undefined) {
            doc.text(`总订单量: ${analysisData.summary.totalOrderCount}`);
          }
          if (analysisData.summary.totalCustomerGrowth !== undefined) {
            doc.text(`总客户增长: ${analysisData.summary.totalCustomerGrowth}`);
          }
          if (analysisData.summary.totalSalesAmount !== undefined) {
            doc.text(`总销售额: ${analysisData.summary.totalSalesAmount.toFixed(2)}`);
          }
          if (analysisData.summary.averageGrowthRate !== undefined) {
            doc.text(`平均增长率: ${analysisData.summary.averageGrowthRate.toFixed(2)}%`);
          }
        }

        // Note about charts
        if (includeCharts) {
          doc.addPage();
          doc.fontSize(12)
            .fillColor('gray')
            .text('注意: 图表导出功能由前端处理，PDF 中仅包含数据表格。', {
              align: 'center',
            });
        }

        // Finalize PDF
        doc.end();
      } catch (error) {
        this.logger.error('Failed to generate PDF', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`PDF generation error details: ${errorMessage}`, error instanceof Error ? error.stack : '');
        reject(new BadRequestException(`PDF 生成失败: ${errorMessage}`));
      }
    });
  }

  /**
   * Calculate column widths for PDF table
   */
  private calculateColumnWidths(columnCount: number, totalWidth: number): number[] {
    if (!columnCount || columnCount <= 0) {
      this.logger.error(`Invalid column count: ${columnCount}`);
      return [];
    }
    if (!totalWidth || totalWidth <= 0) {
      this.logger.error(`Invalid total width: ${totalWidth}`);
      return Array(columnCount).fill(100); // Default width
    }
    const widthPerColumn = totalWidth / columnCount;
    return Array(columnCount).fill(widthPerColumn);
  }

  /**
   * Get analysis title in Chinese
   */
  private getAnalysisTitle(analysisType: AnalysisType): string {
    const titles: Record<AnalysisType, string> = {
      [AnalysisType.PRODUCT_ASSOCIATION]: '产品关联分析报告',
      [AnalysisType.CUSTOMER]: '客户分析报告',
      [AnalysisType.SUPPLIER]: '供应商分析报告',
      [AnalysisType.BUYER]: '采购商分析报告',
      [AnalysisType.BUSINESS_TREND]: '业务趋势分析报告',
    };
    return titles[analysisType] || '分析报告';
  }

  /**
   * Generate file name based on analysis type and format
   */
  private generateFileName(
    analysisType: AnalysisType,
    format: ExportFormat,
  ): string {
    const typeNames: Record<AnalysisType, string> = {
      [AnalysisType.PRODUCT_ASSOCIATION]: '产品关联分析',
      [AnalysisType.CUSTOMER]: '客户分析',
      [AnalysisType.SUPPLIER]: '供应商分析',
      [AnalysisType.BUYER]: '采购商分析',
      [AnalysisType.BUSINESS_TREND]: '业务趋势分析',
    };

    const extension = format === ExportFormat.EXCEL ? 'xlsx' : format;
    const date = new Date().toISOString().split('T')[0];
    return `${typeNames[analysisType]}_${date}.${extension}`;
  }

  /**
   * Get Excel sheet name based on analysis type
   */
  private getSheetName(analysisType: AnalysisType): string {
    const sheetNames: Record<AnalysisType, string> = {
      [AnalysisType.PRODUCT_ASSOCIATION]: '产品关联分析',
      [AnalysisType.CUSTOMER]: '客户分析',
      [AnalysisType.SUPPLIER]: '供应商分析',
      [AnalysisType.BUYER]: '采购商分析',
      [AnalysisType.BUSINESS_TREND]: '业务趋势分析',
    };
    return sheetNames[analysisType] || 'Sheet1';
  }
}

