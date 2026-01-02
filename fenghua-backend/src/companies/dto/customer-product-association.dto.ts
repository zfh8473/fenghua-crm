/**
 * Customer Product Association DTOs
 * 
 * DTOs for customer-product association queries and responses
 * All custom code is proprietary and not open source.
 */

import { IsUUID, IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Customer Product Association Response DTO
 */
export class CustomerProductAssociationDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  hsCode: string;

  @IsInt()
  @Min(0)
  interactionCount: number;
}

/**
 * Customer Product Query DTO
 */
export class CustomerProductQueryDto {
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
}

