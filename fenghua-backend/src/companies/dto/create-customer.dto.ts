/**
 * DTOs for customer creation
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches, IsEnum, IsInt, Min, Max } from 'class-validator';

/**
 * Customer type enum
 */
export enum CustomerType {
  BUYER = 'BUYER',
  SUPPLIER = 'SUPPLIER',
}

/**
 * DTO for creating a new customer
 */
export class CreateCustomerDto {
  @IsString({ message: '客户名称必须是字符串' })
  @IsNotEmpty({ message: '客户名称不能为空' })
  @MinLength(1, { message: '客户名称长度不能少于1个字符' })
  @MaxLength(255, { message: '客户名称长度不能超过255个字符' })
  name: string;

  @IsString({ message: '客户代码必须是字符串' })
  @IsNotEmpty({ message: '客户代码不能为空' })
  @Matches(/^[a-zA-Z0-9]{1,50}$/, { message: '客户代码格式不正确，应为1-50个字母数字字符' })
  customerCode: string;

  @IsEnum(CustomerType, { message: '客户类型必须是 BUYER 或 SUPPLIER' })
  @IsNotEmpty({ message: '客户类型不能为空' })
  customerType: CustomerType;

  @IsString({ message: '域名必须是字符串' })
  @IsOptional()
  @MaxLength(255, { message: '域名长度不能超过255个字符' })
  domainName?: string;

  @IsString({ message: '地址必须是字符串' })
  @IsOptional()
  @MaxLength(1000, { message: '地址长度不能超过1000个字符' })
  address?: string;

  @IsString({ message: '城市必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '城市长度不能超过100个字符' })
  city?: string;

  @IsString({ message: '州/省必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '州/省长度不能超过100个字符' })
  state?: string;

  @IsString({ message: '国家必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '国家长度不能超过100个字符' })
  country?: string;

  @IsString({ message: '邮编必须是字符串' })
  @IsOptional()
  @MaxLength(20, { message: '邮编长度不能超过20个字符' })
  postalCode?: string;

  @IsString({ message: '行业必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '行业长度不能超过100个字符' })
  industry?: string;

  @IsInt({ message: '员工数必须是整数' })
  @IsOptional()
  @Min(1, { message: '员工数必须大于0' })
  @Max(1000000, { message: '员工数不能超过1000000' })
  employees?: number;

  @IsString({ message: '网站必须是字符串' })
  @IsOptional()
  @MaxLength(255, { message: '网站长度不能超过255个字符' })
  website?: string;

  @IsString({ message: '电话必须是字符串' })
  @IsOptional()
  @MaxLength(50, { message: '电话长度不能超过50个字符' })
  phone?: string;

  @IsString({ message: '备注必须是字符串' })
  @IsOptional()
  @MaxLength(5000, { message: '备注长度不能超过5000个字符' })
  notes?: string;
}

