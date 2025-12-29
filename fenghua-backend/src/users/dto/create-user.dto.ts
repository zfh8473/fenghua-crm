import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  FRONTEND_SPECIALIST = 'FRONTEND_SPECIALIST',
  BACKEND_SPECIALIST = 'BACKEND_SPECIALIST',
}

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  password: string;

  @IsString({ message: '名字必须是字符串' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: '姓氏必须是字符串' })
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole, { message: '角色必须是有效的角色类型' })
  @IsNotEmpty({ message: '角色不能为空' })
  role: UserRole;

  @IsString({ message: '部门必须是字符串' })
  @IsOptional()
  department?: string;

  @IsString({ message: '联系方式必须是字符串' })
  @IsOptional()
  phone?: string;
}

