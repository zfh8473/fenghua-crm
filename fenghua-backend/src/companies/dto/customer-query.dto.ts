/**
 * DTOs for customer query
 * All custom code is proprietary and not open source.
 */

import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType } from './create-customer.dto';

/**
 * DTO for querying customers
 */
export class CustomerQueryDto {
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType; // Filter by customer type (BUYER or SUPPLIER)

  @IsOptional()
  @IsString()
  name?: string; // Filter by customer name (fuzzy search)

  @IsOptional()
  @IsString()
  customerCode?: string; // Filter by customer code (exact or partial match)

  @IsOptional()
  @IsString()
  search?: string; // General search (searches both name and customer code)

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
}




