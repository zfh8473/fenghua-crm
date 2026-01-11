/**
 * Products Import Service
 * 
 * Handles product data import API calls
 * All custom code is proprietary and not open source.
 */

import { authService } from '../auth/auth.service';

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

/**
 * Get authentication token from authService
 */
function getAuthToken(): string | null {
  return authService.getToken();
}

/**
 * Column mapping definition
 */
export interface ColumnMapping {
  excelColumn: string;
  crmField?: string;
  suggestedField?: string;
}

/**
 * File upload response
 */
export interface UploadFileResponse {
  fileId: string;
  fileName: string;
  tempFilePath: string;
}

/**
 * Mapping preview request
 */
export interface MappingPreviewRequest {
  fileId: string;
  customMappings?: ColumnMapping[];
}

/**
 * Mapping preview response
 */
export interface MappingPreviewResponse {
  columns: ColumnMapping[];
  sampleData: Record<string, any>[];
  statistics?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  row: number;
  errors: string[];
  data?: Record<string, any>;
}

/**
 * Data cleaning suggestion
 */
export interface DataCleaningSuggestion {
  row: number;
  field: string;
  originalValue: string;
  suggestedValue: string;
  reason: string;
}

/**
 * Duplicate detection
 */
export interface DuplicateDetection {
  row: number;
  field: string;
  value: string;
  existingCustomerId?: string;
  existingCustomerName?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors?: ValidationErrorDetail[];
  cleaningSuggestions?: DataCleaningSuggestion[];
  duplicates?: DuplicateDetection[];
  hasErrors: boolean;
  hasDuplicates: boolean;
  hasCleaningSuggestions: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  successCount: number;
  failureCount: number;
  progress?: number;
  errorReportUrl?: string;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

/**
 * Start import request
 */
export interface StartImportRequest {
  fileId: string;
  columnMappings?: ColumnMapping[];
}

/**
 * Import history item
 */
export interface ImportHistoryItem {
  id: string;
  taskId: string;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errorReportPath?: string;
  startedAt: string;
  completedAt?: string;
}

/**
 * Import history query
 */
export interface ImportHistoryQuery {
  limit?: number;
  offset?: number;
  status?: 'processing' | 'completed' | 'failed';
}

/**
 * Import history response
 */
export interface ImportHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  items: ImportHistoryItem[];
}

/**
 * Upload file for import
 */
export async function uploadImportFile(file: File): Promise<UploadFileResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/import/products/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '文件上传失败' }));
    throw new Error(error.message || '文件上传失败');
  }

  return response.json();
}

/**
 * Get mapping preview
 */
export async function getMappingPreview(
  request: MappingPreviewRequest,
): Promise<MappingPreviewResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/products/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取映射预览失败' }));
    throw new Error(error.message || '获取映射预览失败');
  }

  return response.json();
}

/**
 * Validate import data
 */
export async function validateImportData(
  request: MappingPreviewRequest,
): Promise<ValidationResult> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/products/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '数据验证失败' }));
    throw new Error(error.message || '数据验证失败');
  }

  return response.json();
}

/**
 * Start import task
 */
export async function startImport(request: StartImportRequest): Promise<{ taskId: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/products/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '启动导入任务失败' }));
    throw new Error(error.message || '启动导入任务失败');
  }

  return response.json();
}

/**
 * Get import task status
 */
export async function getImportTaskStatus(taskId: string): Promise<ImportResult> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/products/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取导入任务状态失败' }));
    throw new Error(error.message || '获取导入任务状态失败');
  }

  return response.json();
}

/**
 * Get import history
 */
export async function getImportHistory(
  query: ImportHistoryQuery = {},
): Promise<ImportHistoryResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const params = new URLSearchParams();
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.offset) params.append('offset', query.offset.toString());
  if (query.status) params.append('status', query.status);

  const response = await fetch(`${API_URL}/import/products/history?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取导入历史失败' }));
    throw new Error(error.message || '获取导入历史失败');
  }

  return response.json();
}

/**
 * Download error report
 */
export async function downloadErrorReport(taskId: string): Promise<Blob> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/products/reports/${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '下载错误报告失败' }));
    throw new Error(error.message || '下载错误报告失败');
  }

  return response.blob();
}

