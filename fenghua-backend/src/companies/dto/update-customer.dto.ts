/**
 * DTOs for customer update
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, MinLength, MaxLength, Matches, IsInt, Min, Max, IsEmail } from 'class-validator';
import { Encrypted } from '../../encryption/decorators/encrypted.decorator';

/**
 * DTO for updating a customer
 */
export class UpdateCustomerDto {
  @IsString({ message: '客户名称必须是字符串' })
  @IsOptional()
  @MinLength(1, { message: '客户名称长度不能少于1个字符' })
  @MaxLength(255, { message: '客户名称长度不能超过255个字符' })
  name?: string;

  @IsString({ message: '客户代码必须是字符串' })
  @IsOptional()
  @Matches(/^[a-zA-Z0-9]{1,50}$/, { message: '客户代码格式不正确，应为1-50个字母数字字符' })
  customerCode?: string;

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

  @IsString({ message: '邮箱必须是字符串' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(255, { message: '邮箱长度不能超过255个字符' })
  email?: string;

  @IsString({ message: '银行账号必须是字符串' })
  @IsOptional()
  @MaxLength(255, { message: '银行账号长度不能超过255个字符' })
  @Encrypted()
  bankAccount?: string;

  @IsString({ message: '身份证号必须是字符串' })
  @IsOptional()
  @MaxLength(50, { message: '身份证号长度不能超过50个字符' })
  @Encrypted()
  idNumber?: string;
}

