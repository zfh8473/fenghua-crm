/**
 * Backup Service (Frontend)
 * 
 * API client for backup operations
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export interface BackupStatus {
  lastBackupTime?: string;
  lastBackupStatus?: 'success' | 'failed';
  lastBackupFileSize?: number;
  lastBackupFilePath?: string;
  lastBackupError?: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  status: 'success' | 'failed';
  fileSize: number;
  filePath: string;
  checksum: string;
  workspaceId: string;
  databaseName: string;
  errorMessage?: string;
}

export interface BackupHistoryQuery {
  startDate?: string;
  endDate?: string;
  status?: 'success' | 'failed';
  limit?: number;
  offset?: number;
}

export interface BackupHistoryResponse {
  backups: BackupMetadata[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get backup status
 */
export async function getBackupStatus(token: string): Promise<BackupStatus> {
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/backup/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get backup status' }));
    throw new Error(error.message || 'Failed to get backup status');
  }

  return response.json();
}

/**
 * Get backup history
 */
export async function getBackupHistory(token: string, query: BackupHistoryQuery = {}): Promise<BackupHistoryResponse> {
  if (!token) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams();
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.status) params.append('status', query.status);
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.offset) params.append('offset', query.offset.toString());

  const response = await fetch(`${API_BASE_URL}/backup/history?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get backup history' }));
    throw new Error(error.message || 'Failed to get backup history');
  }

  return response.json();
}

/**
 * Get backup details by ID
 */
export async function getBackupDetails(token: string, backupId: string): Promise<BackupMetadata> {
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/backup/${backupId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get backup details' }));
    throw new Error(error.message || 'Failed to get backup details');
  }

  return response.json();
}

/**
 * Trigger manual backup
 */
export async function createBackup(token: string): Promise<BackupMetadata> {
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/backup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create backup' }));
    throw new Error(error.message || 'Failed to create backup');
  }

  return response.json();
}

