/**
 * Settings Service
 * 
 * Handles API calls for system settings
 * All custom code is proprietary and not open source.
 */

import { SettingsResponseDto, UpdateSettingsDto } from './types/settings.types';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001';

/**
 * Get all system settings
 */
export async function getSettings(token: string): Promise<SettingsResponseDto> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '获取系统设置失败');
  }

  return response.json();
}

/**
 * Update system settings
 */
export async function updateSettings(
  token: string,
  settings: UpdateSettingsDto,
): Promise<SettingsResponseDto> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '更新系统设置失败');
  }

  return response.json();
}

