/**
 * Restore Service (Frontend)
 * 
 * API client for restore operations
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export interface RestoreRequest {
  backupId: string;
}

export interface RestoreStatus {
  restoreId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

/**
 * Execute database restore
 */
export async function executeRestore(token: string, backupId: string): Promise<{ restoreId: string }> {
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/restore`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ backupId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to execute restore' }));
    throw new Error(error.message || 'Failed to execute restore');
  }

  return response.json();
}

/**
 * Get restore status
 */
export async function getRestoreStatus(token: string, restoreId: string): Promise<RestoreStatus> {
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/restore/${restoreId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get restore status' }));
    throw new Error(error.message || 'Failed to get restore status');
  }

  return response.json();
}

