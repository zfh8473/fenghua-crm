import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from './create-user.dto';

/**
 * DTO for updating an existing user
 */
export class UpdateUserDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsOptional()
  email?: string;

  @IsString({ message: '名字必须是字符串' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: '姓氏必须是字符串' })
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole, { message: '角色必须是有效的角色类型' })
  @IsOptional()
  role?: UserRole;

  @IsString({ message: '部门必须是字符串' })
  @IsOptional()
  department?: string;

  @IsString({ message: '联系方式必须是字符串' })
  @IsOptional()
  phone?: string;
}

