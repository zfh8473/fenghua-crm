/**
 * DTOs for product creation
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches, IsObject } from 'class-validator';

/**
 * DTO for creating a new product
 */
export class CreateProductDto {
  @IsString({ message: '产品名称必须是字符串' })
  @IsNotEmpty({ message: '产品名称不能为空' })
  @MinLength(1, { message: '产品名称长度不能少于1个字符' })
  @MaxLength(255, { message: '产品名称长度不能超过255个字符' })
  name: string;

  @IsString({ message: 'HS编码必须是字符串' })
  @IsNotEmpty({ message: 'HS编码不能为空' })
  @Matches(/^[0-9]{6,10}(-[0-9]{2,4})*$/, { message: 'HS编码格式不正确，应为6-10位数字，可包含连字符' })
  hsCode: string;

  @IsString({ message: '产品类别必须是字符串' })
  @IsNotEmpty({ message: '产品类别不能为空' })
  @MaxLength(255, { message: '产品类别长度不能超过255个字符' })
  category: string; // Category is now validated against database, not hardcoded list

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
}

