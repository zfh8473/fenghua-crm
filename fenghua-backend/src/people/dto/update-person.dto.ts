/**
 * DTOs for person update
 * All custom code is proprietary and not open source.
 */

import { IsString, IsOptional, IsEmail, MaxLength, IsUUID, IsBoolean } from 'class-validator';

/**
 * DTO for updating a person (contact)
 * All fields are optional
 */
export class UpdatePersonDto {
  @IsString({ message: '名字必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '名字长度不能超过100个字符' })
  firstName?: string;

  @IsString({ message: '姓氏必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '姓氏长度不能超过100个字符' })
  lastName?: string;

  @IsString({ message: '邮箱必须是字符串' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(255, { message: '邮箱长度不能超过255个字符' })
  email?: string;

  @IsString({ message: '电话必须是字符串' })
  @IsOptional()
  @MaxLength(50, { message: '电话长度不能超过50个字符' })
  phone?: string;

  @IsString({ message: '手机必须是字符串' })
  @IsOptional()
  @MaxLength(50, { message: '手机长度不能超过50个字符' })
  mobile?: string;

  @IsString({ message: '职位必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '职位长度不能超过100个字符' })
  jobTitle?: string;

  @IsString({ message: '部门必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '部门长度不能超过100个字符' })
  department?: string;

  @IsString({ message: 'LinkedIn URL 必须是字符串' })
  @IsOptional()
  @MaxLength(255, { message: 'LinkedIn URL 长度不能超过255个字符' })
  linkedinUrl?: string;

  @IsString({ message: '微信必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: '微信长度不能超过100个字符' })
  wechat?: string;

  @IsString({ message: 'WhatsApp 必须是字符串' })
  @IsOptional()
  @MaxLength(100, { message: 'WhatsApp 长度不能超过100个字符' })
  whatsapp?: string;

  @IsString({ message: 'Facebook 必须是字符串' })
  @IsOptional()
  @MaxLength(255, { message: 'Facebook 长度不能超过255个字符' })
  facebook?: string;

  @IsString({ message: '备注必须是字符串' })
  @IsOptional()
  @MaxLength(5000, { message: '备注长度不能超过5000个字符' })
  notes?: string;

  @IsUUID('4', { message: '客户ID必须是有效的UUID' })
  @IsOptional()
  companyId?: string;

  @IsBoolean({ message: '重要性标记必须是布尔值' })
  @IsOptional()
  isImportant?: boolean;
}
