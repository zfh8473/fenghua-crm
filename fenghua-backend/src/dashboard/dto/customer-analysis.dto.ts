/**
 * Customer Analysis DTOs
 * 
 * DTOs for customer analysis endpoints
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, IsInt, Min, Max, IsDateString, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Customer type enum
 */
export enum CustomerType {
  BUYER = 'BUYER',
  SUPPLIER = 'SUPPLIER',
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
 * Query DTO for customer analysis
 */
export class CustomerAnalysisQueryDto {
  @IsOptional()
  @IsEnum(CustomerType, { message: '客户类型必须是 BUYER 或 SUPPLIER' })
  customerType?: CustomerType;

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
 * Customer analysis item DTO
 */
export class CustomerAnalysisItemDto {
  @IsString()
  customerId: string;

  @IsString()
  customerName: string;

  @IsEnum(CustomerType)
  customerType: CustomerType;

  @IsNumber()
  @Min(0)
  orderCount: number;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsNumber()
  @Min(0)
  orderFrequency: number;

  @IsString()
  lastInteractionDate: string; // ISO 8601 format

  @IsNumber()
  @Min(0)
  daysSinceLastInteraction: number;

  @IsEnum(ChurnRisk)
  churnRisk: ChurnRisk;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lifetimeValue?: number;
}

/**
 * Customer analysis response DTO
 */
export class CustomerAnalysisResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAnalysisItemDto)
  customers: CustomerAnalysisItemDto[];

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
 * Churn rate trend item DTO
 */
export class ChurnRateTrendItemDto {
  @IsString()
  period: string; // 时间周期（如 "2026-01" 或 "2026-W01"）

  @IsNumber()
  @Min(0)
  totalCustomers: number;

  @IsNumber()
  @Min(0)
  churnedCustomers: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  churnRate: number; // 0-100
}

/**
 * Churn rate trend response DTO
 */
export class ChurnRateTrendResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChurnRateTrendItemDto)
  trends: ChurnRateTrendItemDto[];
}

