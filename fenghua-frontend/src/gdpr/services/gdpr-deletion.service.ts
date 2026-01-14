/**
 * GDPR Deletion Service
 * 
 * Service for GDPR data deletion API calls
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface CreateGdprDeletionRequestDto {
  confirmation: string; // User must type "确认删除" or "DELETE"
}

export interface DeletionSummary {
  totalRecords: number;
  deletedCount: number;
  anonymizedCount: number;
  failedCount: number;
  statistics: {
    customers?: { deleted: number; anonymized: number; failed: number };
    interactions?: { deleted: number; anonymized: number; failed: number };
    products?: { deleted: number; anonymized: number; failed: number };
    auditLogs?: { deleted: number; anonymized: number; failed: number };
  };
  errors?: Array<{ type: string; count: number; message: string }>;
}

export interface GdprDeletionRequestResponseDto {
  id: string;
  userId: string;
  requestType: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  deletionSummary?: DeletionSummary;
  metadata?: any;
}

export interface GdprDeletionRequestListResponseDto {
  data: GdprDeletionRequestResponseDto[];
  total: number;
  page?: number;
  limit?: number;
}

class GdprDeletionService {
  private readonly apiUrl = `${API_BASE_URL}/gdpr`;

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('fenghua_auth_token');
  }

  /**
   * Create GDPR deletion request
   */
  async createDeletionRequest(request: CreateGdprDeletionRequestDto): Promise<GdprDeletionRequestResponseDto> {
    const token = this.getToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    const response = await fetch(`${this.apiUrl}/deletion-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '创建删除请求失败');
    }

    return response.json();
  }

  /**
   * Get user's deletion request list
   */
  async getDeletionRequestList(limit: number = 50, offset: number = 0): Promise<GdprDeletionRequestListResponseDto> {
    const token = this.getToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    const url = `${this.apiUrl}/deletion-requests?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }

      let errorMessage: string;
      if (Array.isArray(errorData.message)) {
        const messages = errorData.message.map((err: any) => {
          if (err.constraints) {
            return Object.values(err.constraints).join(', ');
          }
          return err.property ? `${err.property}: ${err.toString()}` : err.toString();
        });
        errorMessage = messages.join('; ');
      } else if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else {
        errorMessage = `请求失败: ${response.status} ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get deletion request by ID
   */
  async getDeletionRequest(id: string): Promise<GdprDeletionRequestResponseDto> {
    const token = this.getToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    const response = await fetch(`${this.apiUrl}/deletion-requests/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '查询删除请求失败');
    }

    return response.json();
  }
}

export const gdprDeletionService = new GdprDeletionService();
