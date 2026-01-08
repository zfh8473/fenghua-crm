/**
 * Product Association Query DTO
 * 
 * DTO for querying product associations with pagination
 * All custom code is proprietary and not open source.
 */

import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for product association endpoints
 */
export class ProductAssociationQueryDto {
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
  limit?: number = 10;
}

/**
 * Query DTO for customer association endpoints
 */
export class CustomerAssociationQueryDto {
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
  limit?: number = 10;
}



