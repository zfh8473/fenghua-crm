/**
 * Data Retention Service
 * 
 * Service for fetching data retention policy and statistics
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface DataRetentionPolicy {
  customerDataRetentionDays: number;
  productDataRetentionDays: number;
  interactionDataRetentionDays: number;
  auditLogRetentionDays: number;
}

export interface DataRetentionStatistics {
  customers: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
  products: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
  interactions: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
  auditLogs: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
}

export interface CleanupHistoryEntry {
  id: string;
  timestamp: string;
  summary: {
    customers?: { deleted: number; hardDeleted: number };
    products?: { deleted: number; hardDeleted: number };
    interactions?: { deleted: number; hardDeleted: number };
    auditLogs?: { deleted: number };
    totalDuration?: number;
  };
  operatorId?: string;
}

/**
 * Get data retention policy
 */
export async function getDataRetentionPolicy(token: string): Promise<DataRetentionPolicy> {
  const response = await fetch(`${API_BASE_URL}/data-retention/policy`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data retention policy');
  }

  return response.json();
}

/**
 * Get data retention statistics
 */
export async function getDataRetentionStatistics(token: string): Promise<DataRetentionStatistics> {
  const response = await fetch(`${API_BASE_URL}/data-retention/statistics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data retention statistics');
  }

  return response.json();
}

/**
 * Get cleanup history
 */
export async function getCleanupHistory(token: string): Promise<CleanupHistoryEntry[]> {
  const response = await fetch(`${API_BASE_URL}/data-retention/cleanup-history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cleanup history');
  }

  return response.json();
}
