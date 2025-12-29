/**
 * DTOs for product category update
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO for updating a product category
 */
export class UpdateCategoryDto {
  @IsString({ message: '类别名称必须是字符串' })
  @IsOptional()
  @MinLength(1, { message: '类别名称长度不能少于1个字符' })
  @MaxLength(255, { message: '类别名称长度不能超过255个字符' })
  name?: string;

  @IsString({ message: 'HS编码必须是字符串' })
  @IsOptional()
  @Matches(/^[0-9]{6,10}(-[0-9]{2,4})*$/, { message: 'HS编码格式不正确，应为6-10位数字，可包含连字符' })
  hsCode?: string;

  @IsString({ message: '类别描述必须是字符串' })
  @IsOptional()
  @MaxLength(1000, { message: '类别描述长度不能超过1000个字符' })
  description?: string;
}

