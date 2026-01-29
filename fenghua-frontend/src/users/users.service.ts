/**
 * Users Service
 * Handles user management API calls
 */

import { getApiBaseUrl, parseJsonResponse } from '../utils/apiClient';

const API_BASE_URL = getApiBaseUrl();

export interface User {
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

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'ADMIN' | 'DIRECTOR' | 'FRONTEND_SPECIALIST' | 'BACKEND_SPECIALIST';
  department?: string;
  phone?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'DIRECTOR' | 'FRONTEND_SPECIALIST' | 'BACKEND_SPECIALIST';
  department?: string;
  phone?: string;
  /** 新密码（留空则不修改）；仅编辑时可选传入 */
  password?: string;
}

/**
 * Get authentication token from localStorage
 */
function getToken(): string | null {
  return localStorage.getItem('fenghua_auth_token');
}

/**
 * Get all users
 * @param roleFilter - Optional role name to filter by
 * @param search - Optional search term (searches email, first_name, last_name)
 */
export async function getUsers(roleFilter?: string, search?: string): Promise<User[]> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  // Build query string
  const queryParams = new URLSearchParams();
  if (roleFilter) {
    queryParams.append('role', roleFilter);
  }
  if (search) {
    queryParams.append('search', search);
  }

  const url = `${API_BASE_URL}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<{ message?: string }>(response);
    throw new Error(errorData?.message || '获取用户列表失败');
  }

  return parseJsonResponse<User[]>(response);
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<{ message?: string }>(response);
    throw new Error(errorData?.message || '获取用户信息失败');
  }

  return parseJsonResponse<User>(response);
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<{ message?: string }>(response);
    throw new Error(errorData?.message || '创建用户失败');
  }

  return parseJsonResponse<User>(response);
}

/**
 * Update a user.
 * 仅发送后端 UpdateUserDto 允许的字段；password 仅在有意修改时传入（留空则不修改）。
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const payload: UpdateUserData = {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    department: data.department,
    phone: data.phone,
  };
  if (data.password != null && String(data.password).trim() !== '') {
    payload.password = data.password;
  }

  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '更新用户失败');
  }

  return response.json();
}

/**
 * Delete a user (soft delete)
 */
export async function deleteUser(id: string): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<{ message?: string }>(response);
    throw new Error(errorData?.message || '删除用户失败');
  }
}

