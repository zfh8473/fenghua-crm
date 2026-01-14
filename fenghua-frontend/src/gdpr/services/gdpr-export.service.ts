/**
 * GDPR Export Service
 * 
 * Service for GDPR data export API calls
 * All custom code is proprietary and not open source.
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export enum GdprExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
}

export interface CreateGdprExportRequestDto {
  format: GdprExportFormat;
}

export interface GdprExportRequestResponseDto {
  id: string;
  userId: string;
  requestType: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  expiresAt: string;
  downloadUrl?: string;
  downloadToken?: string; // Only included in single request detail, not in list
  fileFormat: GdprExportFormat;
  fileSize?: number;
  metadata?: any;
}

export interface GdprExportRequestListResponseDto {
  data: GdprExportRequestResponseDto[];
  total: number;
  page?: number;
  limit?: number;
}

class GdprExportService {
  private readonly apiUrl = `${API_BASE_URL}/gdpr`;

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('fenghua_auth_token');
  }

  /**
   * Create GDPR export request
   */
  async createExportRequest(request: CreateGdprExportRequestDto): Promise<GdprExportRequestResponseDto> {
    const token = this.getToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    const response = await fetch(`${this.apiUrl}/export-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '创建导出请求失败');
    }

    return response.json();
  }

  /**
   * Get user's export request list
   */
  async getExportRequestList(limit: number = 50, offset: number = 0): Promise<GdprExportRequestListResponseDto> {
    const token = this.getToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    const url = `${this.apiUrl}/export-requests?limit=${limit}&offset=${offset}`;
    
    // Log request details in development
    if (import.meta.env.DEV) {
      console.log('[GdprExportService] Request:', {
        url,
        method: 'GET',
        limit,
        offset,
        tokenLength: token.length,
      });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Try to parse error response
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        // If JSON parsing fails, use status text
        errorData = { message: response.statusText };
      }

      // Log detailed error information in development
      if (import.meta.env.DEV) {
        console.error('[GdprExportService] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorData: errorData,
        });
        console.error('[GdprExportService] Error response data:', JSON.stringify(errorData, null, 2));
      }

      // Extract validation errors if present (NestJS ValidationPipe format)
      let errorMessage: string;
      
      // Handle different error response formats
      if (Array.isArray(errorData.message)) {
        // ValidationPipe returns array of error objects
        const messages = errorData.message.map((err: any) => {
          if (err.constraints) {
            return Object.values(err.constraints).join(', ');
          }
          return err.property ? `${err.property}: ${err.toString()}` : err.toString();
        });
        errorMessage = messages.join('; ');
      } else if (typeof errorData.message === 'string') {
        // Simple string message
        errorMessage = errorData.message;
      } else if (errorData.message && typeof errorData.message === 'object') {
        // BadRequestException with object format: { message: string, code: string }
        if (errorData.message.message) {
          errorMessage = errorData.message.message;
        } else {
          errorMessage = JSON.stringify(errorData.message);
        }
      } else if (errorData.message) {
        // Fallback for other message formats
        errorMessage = JSON.stringify(errorData.message);
      } else {
        // No message, use status text
        errorMessage = `请求失败: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get export request by ID
   */
  async getExportRequest(id: string): Promise<GdprExportRequestResponseDto> {
    const token = this.getToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    const response = await fetch(`${this.apiUrl}/export-requests/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '查询导出请求失败');
    }

    return response.json();
  }

  /**
   * Download export file
   */
  async downloadExportFile(id: string, downloadToken: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    const response = await fetch(`${this.apiUrl}/export-requests/${id}/download?token=${downloadToken}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '下载导出文件失败');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'gdpr-export';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const gdprExportService = new GdprExportService();
