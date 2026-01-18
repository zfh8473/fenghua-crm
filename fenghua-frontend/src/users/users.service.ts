/**
 * Users Service
 * Handles user management API calls
 */

/** 与 auth、其他业务一致：VITE_API_BASE_URL || VITE_BACKEND_URL；VITE_BACKEND_API_URL 为兼容保留 */
const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string) ||
  (import.meta.env?.VITE_BACKEND_URL as string) ||
  (import.meta.env?.VITE_BACKEND_API_URL as string) ||
  'http://localhost:3001';

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
    const errorData = await response.json();
    throw new Error(errorData.message || '获取用户列表失败');
  }

  return response.json();
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
    const errorData = await response.json();
    throw new Error(errorData.message || '获取用户信息失败');
  }

  return response.json();
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
    const errorData = await response.json();
    throw new Error(errorData.message || '创建用户失败');
  }

  return response.json();
}

/**
 * Update a user
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
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
    const errorData = await response.json();
    throw new Error(errorData.message || '删除用户失败');
  }
}

