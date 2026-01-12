/**
 * Product Association Analysis DTOs
 * 
 * DTOs for product association analysis endpoints
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, IsInt, Min, Max, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for product association analysis
 */
export class ProductAssociationAnalysisQueryDto {
  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于 0' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于 0' })
  @Max(100, { message: '每页数量不能超过 100' })
  limit?: number = 20;
}

/**
 * Product association analysis item DTO
 */
export class ProductAssociationAnalysisItemDto {
  @IsString()
  productId: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsNumber()
  @Min(0)
  totalCustomers: number;

  @IsNumber()
  @Min(0)
  buyerCount: number;

  @IsNumber()
  @Min(0)
  supplierCount: number;

  @IsNumber()
  @Min(0)
  totalInteractions: number;

  @IsNumber()
  @Min(0)
  orderCount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate: number; // 0-100
}

/**
 * Product association analysis response DTO
 */
export class ProductAssociationAnalysisResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAssociationAnalysisItemDto)
  products: ProductAssociationAnalysisItemDto[];

  @IsNumber()
  @Min(0)
  total: number;

  @IsNumber()
  @Min(1)
  page: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number;
}

/**
 * Conversion rate trend item DTO
 */
export class ConversionRateTrendItemDto {
  @IsString()
  period: string; // 时间周期（如 "2026-01" 或 "2026-W01"）

  @IsNumber()
  @Min(0)
  totalInteractions: number;

  @IsNumber()
  @Min(0)
  orderCount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate: number; // 0-100
}

/**
 * Conversion rate trend response DTO
 */
export class ConversionRateTrendResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversionRateTrendItemDto)
  trends: ConversionRateTrendItemDto[];
}

/**
 * Product categories response DTO
 */
export class ProductCategoriesResponseDto {
  @IsArray()
  @IsString({ each: true })
  categories: string[];
}

