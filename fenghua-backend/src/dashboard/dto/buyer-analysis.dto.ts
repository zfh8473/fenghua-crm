/**
 * Buyer Analysis DTOs
 * 
 * DTOs for buyer analysis endpoints
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, IsInt, Min, Max, IsDateString, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Activity rating enum
 */
export enum ActivityRating {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Churn risk level enum
 */
export enum ChurnRisk {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE',
}

/**
 * Query DTO for buyer analysis
 */
export class BuyerAnalysisQueryDto {
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
 * Buyer analysis item DTO
 */
export class BuyerAnalysisItemDto {
  @IsString()
  buyerId: string;

  @IsString()
  buyerName: string;

  @IsNumber()
  @Min(0)
  orderCount: number;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsNumber()
  @Min(0)
  orderFrequency: number; // Orders per day

  @IsString()
  lastInteractionDate: string; // ISO 8601 format

  @IsNumber()
  @Min(0)
  daysSinceLastInteraction: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  activityLevel: number; // Activity percentage (0-100)

  @IsEnum(ActivityRating)
  activityRating: ActivityRating;

  @IsEnum(ChurnRisk)
  churnRisk: ChurnRisk;

  @IsNumber()
  @Min(0)
  lifetimeValue: number;
}

/**
 * Buyer analysis response DTO
 */
export class BuyerAnalysisResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuyerAnalysisItemDto)
  buyers: BuyerAnalysisItemDto[];

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
 * Activity trend item DTO
 */
export class ActivityTrendItemDto {
  @IsString()
  period: string; // Time period (e.g., "2026-01" or "2026-W01")

  @IsNumber()
  @Min(0)
  totalBuyers: number;

  @IsNumber()
  @Min(0)
  activeBuyers: number; // Buyers with activity in the period

  @IsNumber()
  @Min(0)
  @Max(100)
  averageActivityLevel: number; // Average activity level (0-100)
}

/**
 * Activity trend response DTO
 */
export class ActivityTrendResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityTrendItemDto)
  trends: ActivityTrendItemDto[];
}

/**
 * Churn trend item DTO
 */
export class ChurnTrendItemDto {
  @IsString()
  period: string; // Time period (e.g., "2026-01" or "2026-W01")

  @IsNumber()
  @Min(0)
  totalBuyers: number;

  @IsNumber()
  @Min(0)
  churnedBuyers: number; // Buyers with churn risk

  @IsNumber()
  @Min(0)
  @Max(100)
  churnRate: number; // Churn rate percentage (0-100)
}

/**
 * Churn trend response DTO
 */
export class ChurnTrendResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChurnTrendItemDto)
  trends: ChurnTrendItemDto[];
}

