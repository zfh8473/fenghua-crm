/**
 * Product Customer Association DTOs
 * 
 * DTOs for product-customer association queries and responses
 * All custom code is proprietary and not open source.
 */

import { IsUUID, IsString, IsNotEmpty, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Product Customer Association Response DTO
 */
export class ProductCustomerAssociationDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['SUPPLIER', 'BUYER'])
  customerType: 'SUPPLIER' | 'BUYER';

  @IsInt()
  @Min(0)
  interactionCount: number;
}

/**
 * Product Customer Query DTO
 */

export class ProductCustomerQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['BUYER', 'SUPPLIER'])
  customerType?: 'BUYER' | 'SUPPLIER'; // 可选，用于总监/管理员筛选
}

