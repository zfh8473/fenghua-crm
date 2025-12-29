/**
 * DTO for user response
 */
export class UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string | null; // Role can be null if user has no roles assigned
  department?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

