/**
 * DTOs for product category creation
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

/**
 * DTO for creating a new product category
 */
export class CreateCategoryDto {
  @IsString({ message: '类别名称必须是字符串' })
  @IsNotEmpty({ message: '类别名称不能为空' })
  @MinLength(1, { message: '类别名称长度不能少于1个字符' })
  @MaxLength(255, { message: '类别名称长度不能超过255个字符' })
  name: string;

  @IsString({ message: 'HS编码必须是字符串' })
  @IsNotEmpty({ message: 'HS编码不能为空' })
  @Matches(/^[0-9]{6,10}(-[0-9]{2,4})*$/, { message: 'HS编码格式不正确，应为6-10位数字，可包含连字符' })
  hsCode: string;

  @IsString({ message: '类别描述必须是字符串' })
  @IsOptional()
  @MaxLength(1000, { message: '类别描述长度不能超过1000个字符' })
  description?: string;
}

