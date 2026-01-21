/**
 * Audit Logs Service
 * 
 * API client for audit logs
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  userId: string;
  operatorId: string;
  operatorEmail?: string; // Added to support AC #4 requirement
  timestamp: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQueryParams {
  action?: string;
  operatorId?: string;
  operatorEmail?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAuditLogs(token: string, params: AuditLogQueryParams = {}): Promise<PaginatedAuditLogResponse> {
  const queryParams = new URLSearchParams();
  if (params.action) queryParams.append('action', params.action);
  if (params.operatorId) queryParams.append('operatorId', params.operatorId);
  if (params.operatorEmail) queryParams.append('operatorEmail', params.operatorEmail);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  }

  return response.json();
}

