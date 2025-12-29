/**
 * DTOs for product query
 * All custom code is proprietary and not open source.
 */

import { IsOptional, IsEnum, IsInt, Min, Max, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Product status enum
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

/**
 * DTO for querying products
 */
export class ProductQueryDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  category?: string; // Filter by product category

  @IsOptional()
  @IsString()
  name?: string; // Filter by product name (fuzzy search). If both 'name' and 'search' are provided, 'name' takes precedence.

  @IsOptional()
  @IsString()
  hsCode?: string; // Filter by HS code (exact or partial match). If both 'hsCode' and 'search' are provided, 'hsCode' takes precedence.

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  search?: string; // General search (searches both name and HS code)

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean; // Include inactive products in results (default: false)
}

