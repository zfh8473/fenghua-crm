/**
 * DTOs for product update
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, MinLength, MaxLength, IsIn, IsObject, Matches } from 'class-validator';

/**
 * DTO for updating an existing product
 */
export class UpdateProductDto {
  @IsString({ message: '产品名称必须是字符串' })
  @IsOptional()
  @MinLength(1, { message: '产品名称长度不能少于1个字符' })
  @MaxLength(255, { message: '产品名称长度不能超过255个字符' })
  name?: string;

  // Note: HS code cannot be updated per AC #5 - removed from DTO

  @IsString({ message: '产品类别必须是字符串' })
  @IsOptional()
  @MaxLength(255, { message: '产品类别长度不能超过255个字符' })
  category?: string; // Category is now validated against database, not hardcoded list

  @IsString({ message: '产品描述必须是字符串' })
  @IsOptional()
  @MaxLength(5000, { message: '产品描述长度不能超过5000个字符' })
  description?: string;

  @IsObject({ message: '产品规格必须是有效的JSON对象' })
  @IsOptional()
  specifications?: Record<string, unknown>;

  @IsString({ message: '产品图片URL必须是字符串' })
  @IsOptional()
  imageUrl?: string;

  @IsString({ message: '产品状态必须是字符串' })
  @IsOptional()
  @IsIn(['active', 'inactive', 'archived'], { message: '产品状态必须是 active、inactive 或 archived' })
  status?: 'active' | 'inactive' | 'archived';
}

