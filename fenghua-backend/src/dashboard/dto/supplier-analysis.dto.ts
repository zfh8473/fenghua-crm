/**
 * Supplier Analysis DTOs
 * 
 * DTOs for supplier analysis endpoints
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, IsInt, Min, Max, IsDateString, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Supplier stability rating enum
 */
export enum StabilityRating {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  RISK = 'RISK',
}

/**
 * Query DTO for supplier analysis
 */
export class SupplierAnalysisQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

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
 * Supplier analysis item DTO
 */
export class SupplierAnalysisItemDto {
  @IsString()
  supplierId: string;

  @IsString()
  supplierName: string;

  @IsNumber()
  @Min(0)
  orderCount: number;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsNumber()
  @Min(0)
  cooperationFrequency: number; // Orders per day

  @IsString()
  lastCooperationDate: string; // ISO 8601 format

  @IsNumber()
  @Min(0)
  daysSinceLastCooperation: number;

  @IsEnum(StabilityRating)
  stabilityRating: StabilityRating;

  @IsNumber()
  @Min(0)
  lifetimeValue: number;
}

/**
 * Supplier analysis response DTO
 */
export class SupplierAnalysisResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierAnalysisItemDto)
  suppliers: SupplierAnalysisItemDto[];

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
 * Cooperation trend item DTO
 */
export class CooperationTrendItemDto {
  @IsString()
  period: string; // Time period (e.g., "2026-01" or "2026-W01")

  @IsNumber()
  @Min(0)
  totalSuppliers: number;

  @IsNumber()
  @Min(0)
  activeSuppliers: number;

  @IsNumber()
  @Min(0)
  totalOrders: number;

  @IsNumber()
  @Min(0)
  cooperationFrequency: number; // Average orders per day
}

/**
 * Cooperation trend response DTO
 */
export class CooperationTrendResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CooperationTrendItemDto)
  trends: CooperationTrendItemDto[];
}

