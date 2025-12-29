/**
 * DTO for role response
 * All custom code is proprietary and not open source.
 */

import { UserRole } from '../../users/dto/create-user.dto';

/**
 * DTO for role information response
 */
export class RoleResponseDto {
  userId: string;
  role: UserRole;
  roleId?: string; // Twenty CRM role ID
  assignedAt?: string;
  assignedBy?: string;
}

