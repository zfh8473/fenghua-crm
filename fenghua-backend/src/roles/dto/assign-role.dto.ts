/**
 * DTO for assigning role to user
 * All custom code is proprietary and not open source.
 */

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/dto/create-user.dto';

/**
 * DTO for assigning role to a user
 */
export class AssignRoleDto {
  @IsEnum(UserRole, { message: '角色必须是有效的角色类型' })
  @IsNotEmpty({ message: '角色不能为空' })
  role: UserRole;

  @IsOptional()
  @IsString({ message: '变更原因必须是字符串' })
  reason?: string;
}

