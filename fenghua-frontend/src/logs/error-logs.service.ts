/**
 * Error Logs Service
 * 
 * API client for error logs
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export enum ErrorType {
  SYSTEM = 'SYSTEM',
  BUSINESS = 'BUSINESS',
  USER = 'USER',
}

export interface ErrorLogEntry {
  timestamp: string;
  type: ErrorType;
  message: string;
  stack?: string;
  userId?: string;
  requestPath?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogQueryParams {
  type?: ErrorType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedErrorLogResponse {
  data: ErrorLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getErrorLogs(token: string, params: ErrorLogQueryParams = {}): Promise<PaginatedErrorLogResponse> {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append('type', params.type);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/logs/errors?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch error logs: ${response.statusText}`);
  }

  return response.json();
}

