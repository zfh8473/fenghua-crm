/**
 * Roles Service
 * 
 * Handles role management API calls
 * All custom code is proprietary and not open source.
 */

import { getApiBaseUrl, parseJsonResponse } from '../utils/apiClient';
import { UserRole } from './role-descriptions';

const API_BASE_URL = getApiBaseUrl();

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleResponse {
  userId: string;
  role: UserRole;
  roleId?: string;
  assignedAt?: string;
  assignedBy?: string;
}

export interface AssignRoleData {
  role: UserRole;
  reason?: string;
}

/**
 * Get authentication token from localStorage
 */
function getToken(): string | null {
  return localStorage.getItem('fenghua_auth_token');
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取角色列表失败');
  }

  return response.json();
}

/**
 * Get user's current role
 */
export async function getUserRole(userId: string): Promise<RoleResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/roles/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<{ message?: string }>(response);
    throw new Error(errorData?.message || '获取用户角色失败');
  }

  return parseJsonResponse<RoleResponse>(response);
}

/**
 * Assign role to a user
 */
export async function assignRole(userId: string, data: AssignRoleData): Promise<RoleResponse> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/roles/users/${userId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '分配角色失败');
  }

  return response.json();
}

/**
 * Remove role from a user
 */
export async function removeRole(userId: string): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/roles/users/${userId}/remove`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<{ message?: string }>(response);
    throw new Error(errorData?.message || '移除角色失败');
  }

  await parseJsonResponse<{ message?: string }>(response);
}

