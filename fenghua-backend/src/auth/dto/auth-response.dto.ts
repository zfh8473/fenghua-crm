/**
 * Auth Response DTO
 * 
 * Data transfer object for authentication response
 */

export class AuthResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string | null; // null if user has no roles assigned
  };
}
