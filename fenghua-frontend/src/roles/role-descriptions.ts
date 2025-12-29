/**
 * Role Descriptions Configuration
 * 
 * Centralized role descriptions to avoid hardcoding
 * All custom code is proprietary and not open source.
 */

export type UserRole = 'ADMIN' | 'DIRECTOR' | 'FRONTEND_SPECIALIST' | 'BACKEND_SPECIALIST';

export interface RoleDescription {
  name: string; // Chinese name
  description: string; // Permission scope description
  permissions: string[]; // List of permissions
}

/**
 * Role descriptions configuration
 * Based on PRD RBAC matrix
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, RoleDescription> = {
  ADMIN: {
    name: '管理员',
    description: '最高权限，包括所有数据访问和用户管理功能',
    permissions: [
      '所有数据访问（前端+后端）',
      '用户管理',
      '系统配置',
      '数据导出',
    ],
  },
  DIRECTOR: {
    name: '总监',
    description: '除用户管理外的所有数据权限，可以导出数据',
    permissions: [
      '所有数据访问（前端+后端）',
      '数据导出',
    ],
  },
  FRONTEND_SPECIALIST: {
    name: '前端专员',
    description: '仅可访问采购商相关数据',
    permissions: [
      '采购商数据访问',
    ],
  },
  BACKEND_SPECIALIST: {
    name: '后端专员',
    description: '仅可访问供应商相关数据',
    permissions: [
      '供应商数据访问',
    ],
  },
};

/**
 * Get role description by role value
 */
export function getRoleDescription(role: UserRole | string): RoleDescription | null {
  return ROLE_DESCRIPTIONS[role as UserRole] || null;
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_DESCRIPTIONS) as UserRole[];
}

