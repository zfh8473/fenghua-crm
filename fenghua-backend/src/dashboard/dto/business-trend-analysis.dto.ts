/**
 * Business Trend Analysis DTOs
 * 
 * DTOs for business trend analysis endpoints
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Time granularity enum
 */
export enum TimeGranularity {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * Metrics enum
 */
export enum TrendMetric {
  ORDER_COUNT = 'orderCount',
  CUSTOMER_GROWTH = 'customerGrowth',
  SALES_AMOUNT = 'salesAmount',
}

/**
 * Query DTO for business trend analysis
 */
export class BusinessTrendAnalysisQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TimeGranularity, { message: '时间粒度必须是 day, week, month, quarter 或 year' })
  timeGranularity?: TimeGranularity = TimeGranularity.MONTH;

  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const filtered = value.filter(v => v && typeof v === 'string' && v.trim() !== '');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const arr = value.split(',').map(v => v.trim()).filter(v => v !== '');
      return arr.length > 0 ? arr : undefined;
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TrendMetric, { each: true, message: '指标必须是 orderCount, customerGrowth 或 salesAmount' })
  metrics?: TrendMetric[];
}

/**
 * Business trend item DTO
 */
export class BusinessTrendItemDto {
  @IsString()
  period: string;

  @IsNumber()
  @Min(0)
  orderCount: number;

  @IsNumber()
  @Min(0)
  customerGrowth: number;

  @IsNumber()
  @Min(0)
  salesAmount: number;

  @IsOptional()
  @IsNumber()
  growthRate?: number; // 环比增长率

  @IsOptional()
  @IsNumber()
  yearOverYearGrowthRate?: number; // 同比增长率
}

/**
 * Trend summary DTO
 */
export class TrendSummaryDto {
  @IsNumber()
  @Min(0)
  totalOrderCount: number;

  @IsNumber()
  @Min(0)
  totalCustomerGrowth: number;

  @IsNumber()
  @Min(0)
  totalSalesAmount: number;

  @IsNumber()
  averageGrowthRate: number;
}

/**
 * Business trend analysis response DTO
 */
export class BusinessTrendAnalysisResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessTrendItemDto)
  trends: BusinessTrendItemDto[];

  @ValidateNested()
  @Type(() => TrendSummaryDto)
  summary: TrendSummaryDto;
}

/**
 * Forecast item DTO (optional)
 */
export class TrendForecastItemDto {
  @IsString()
  period: string;

  @IsNumber()
  @Min(0)
  predictedOrderCount: number;

  @IsNumber()
  @Min(0)
  predictedCustomerGrowth: number;

  @IsNumber()
  @Min(0)
  predictedSalesAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number; // 置信度 (0-100)
}

/**
 * Trend forecast response DTO (optional)
 */
export class TrendForecastResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrendForecastItemDto)
  forecast: TrendForecastItemDto[];
}

