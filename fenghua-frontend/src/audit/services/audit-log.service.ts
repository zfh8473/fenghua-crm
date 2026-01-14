/**
 * Audit Log Service
 * 
 * Handles API calls for audit log operations
 */

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

export interface AuditLog {
  id?: string; // Log ID (if available from backend)
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  operatorId: string;
  operatorEmail?: string;
  timestamp: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  oldValue?: any; // 修改前的值（用于数据修改审计日志）
  newValue?: any; // 修改后的值（用于数据修改审计日志）
}

export interface AuditLogQueryParams {
  action?: string;
  operatorId?: string;
  operatorEmail?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AuditLogService {
  /**
   * Get authentication token from localStorage
   */
  private static getAuthToken(): string | null {
    return localStorage.getItem('fenghua_auth_token');
  }

  /**
   * Get audit logs with pagination and filters
   */
  static async getAuditLogs(params: AuditLogQueryParams): Promise<PaginatedAuditLogResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.action) queryParams.append('action', params.action);
    if (params.operatorId) queryParams.append('operatorId', params.operatorId);
    if (params.operatorEmail) queryParams.append('operatorEmail', params.operatorEmail);
    if (params.entityType) queryParams.append('entityType', params.entityType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('未登录，请先登录');
    }

    const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a single audit log by ID
   */
  static async getAuditLogById(id: string): Promise<AuditLog> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('未登录，请先登录');
    }

    const response = await fetch(`${API_BASE_URL}/audit-logs/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit log: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Export audit logs
   */
  static async exportAuditLogs(
    params: AuditLogQueryParams & { format?: 'csv' | 'excel' }
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    if (params.action) queryParams.append('action', params.action);
    if (params.operatorId) queryParams.append('operatorId', params.operatorId);
    if (params.operatorEmail) queryParams.append('operatorEmail', params.operatorEmail);
    if (params.entityType) queryParams.append('entityType', params.entityType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.format) queryParams.append('format', params.format);

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('未登录，请先登录');
    }

    const response = await fetch(`${API_BASE_URL}/audit-logs/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to export audit logs: ${response.statusText}`);
    }

    return await response.blob();
  }
}

