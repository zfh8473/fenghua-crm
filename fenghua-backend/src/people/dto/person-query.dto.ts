/**
 * DTOs for person query
 * All custom code is proprietary and not open source.
 */

import { IsOptional, IsUUID, IsBoolean, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying people (contacts)
 */
export class PersonQueryDto {
  @IsOptional()
  @IsUUID('4', { message: '客户ID必须是有效的UUID' })
  companyId?: string; // Filter by company (customer)

  @IsOptional()
  @IsString()
  search?: string; // General search (searches name, email, job_title, department)

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isImportant?: boolean; // Filter by importance (star marking)

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
