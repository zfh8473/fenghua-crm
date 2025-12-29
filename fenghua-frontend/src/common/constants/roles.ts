/**
 * User Role Constants
 * All custom code is proprietary and not open source.
 */

/**
 * User role constants
 * Matches backend UserRole enum
 */
export const UserRole = {
  ADMIN: 'ADMIN',
  DIRECTOR: 'DIRECTOR',
  FRONTEND_SPECIALIST: 'FRONTEND_SPECIALIST',
  BACKEND_SPECIALIST: 'BACKEND_SPECIALIST',
} as const;

/**
 * Type for user role
 */
export type UserRoleType = typeof UserRole[keyof typeof UserRole];

/**
 * Check if a role is admin
 */
export function isAdmin(role?: string): boolean {
  if (!role) return false;
  return role.toUpperCase() === UserRole.ADMIN;
}

/**
 * Check if a role is director
 */
export function isDirector(role?: string): boolean {
  if (!role) return false;
  return role.toUpperCase() === UserRole.DIRECTOR;
}

/**
 * Check if a role is frontend specialist
 */
export function isFrontendSpecialist(role?: string): boolean {
  if (!role) return false;
  return role.toUpperCase() === UserRole.FRONTEND_SPECIALIST;
}

/**
 * Check if a role is backend specialist
 */
export function isBackendSpecialist(role?: string): boolean {
  if (!role) return false;
  return role.toUpperCase() === UserRole.BACKEND_SPECIALIST;
}

