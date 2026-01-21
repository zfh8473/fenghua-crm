/**
 * Logs Service
 * 
 * API client for system logs
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface LogQueryParams {
  level?: LogLevel;
  startDate?: string;
  endDate?: string;
  userId?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLogResponse {
  data: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getLogs(token: string, params: LogQueryParams = {}): Promise<PaginatedLogResponse> {
  const queryParams = new URLSearchParams();
  if (params.level) queryParams.append('level', params.level);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.keyword) queryParams.append('keyword', params.keyword);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/logs?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }

  return response.json();
}

