/**
 * Analysis Export DTOs
 * 
 * DTOs for analysis result export endpoints
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

/**
 * Analysis type enum
 */
export enum AnalysisType {
  PRODUCT_ASSOCIATION = 'product-association',
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
  BUYER = 'buyer',
  BUSINESS_TREND = 'business-trend',
}

/**
 * Export format enum
 */
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  PNG = 'png',
  JPEG = 'jpeg',
}

/**
 * Request DTO for analysis export
 */
export class AnalysisExportRequestDto {
  @IsEnum(AnalysisType, { message: '分析类型必须是 product-association, customer, supplier, buyer 或 business-trend' })
  analysisType: AnalysisType;

  @IsEnum(ExportFormat, { message: '导出格式必须是 csv, excel, pdf, png 或 jpeg' })
  format: ExportFormat;

  @IsOptional()
  @IsObject()
  queryParams?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;
}

