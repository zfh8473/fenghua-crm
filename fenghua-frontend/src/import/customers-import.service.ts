/**
 * Customers Import Service
 * 
 * Handles customer data import API calls
 * All custom code is proprietary and not open source.
 */

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token');
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
  status: ImportStatus;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errorReportPath?: string;
  importType?: ImportType;
  startedAt: string;
  completedAt?: string;
}

/**
 * Import type
 */
export type ImportType = 'CUSTOMER' | 'PRODUCT' | 'INTERACTION';

/**
 * Import status
 */
export type ImportStatus = 'processing' | 'completed' | 'failed' | 'partial';

/**
 * Import history query
 */
export interface ImportHistoryQuery {
  limit?: number;
  offset?: number;
  status?: ImportStatus;
  startDate?: string;
  endDate?: string;
  importType?: ImportType;
  search?: string;
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

  const response = await fetch(`${API_URL}/import/customers/upload`, {
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

  const response = await fetch(`${API_URL}/import/customers/preview`, {
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

  const response = await fetch(`${API_URL}/import/customers/validate`, {
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

  const response = await fetch(`${API_URL}/import/customers/start`, {
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

  const response = await fetch(`${API_URL}/import/customers/tasks/${taskId}`, {
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
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.importType) params.append('importType', query.importType);
  if (query.search) params.append('search', query.search);

  const response = await fetch(`${API_URL}/import/customers/history?${params.toString()}`, {
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
 * Import task detail
 */
export interface ImportTaskDetail {
  id: string;
  taskId: string;
  fileName: string;
  status: ImportStatus;
  importType?: ImportType;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errorReportPath?: string;
  startedAt: string;
  completedAt?: string;
  errorDetails?: ErrorDetailItem[];
}

/**
 * Error detail item
 */
export interface ErrorDetailItem {
  row: number;
  data: Record<string, any>;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Error details query
 */
export interface ErrorDetailsQuery {
  limit?: number;
  offset?: number;
}

/**
 * Error details response
 */
export interface ErrorDetailsResponse {
  items: ErrorDetailItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get import task detail
 */
export async function getImportTaskDetail(taskId: string): Promise<ImportTaskDetail> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/customers/tasks/${taskId}/details`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取导入任务详情失败' }));
    throw new Error(error.message || '获取导入任务详情失败');
  }

  return response.json();
}

/**
 * Get error details
 */
export async function getErrorDetails(
  taskId: string,
  query: ErrorDetailsQuery = {},
): Promise<ErrorDetailsResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const params = new URLSearchParams();
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.offset) params.append('offset', query.offset.toString());

  const response = await fetch(`${API_URL}/import/customers/tasks/${taskId}/errors?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取错误详情失败' }));
    throw new Error(error.message || '获取错误详情失败');
  }

  return response.json();
}

/**
 * Retry import with failed records
 */
export async function retryImport(taskId: string): Promise<{ taskId: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/customers/retry/${taskId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '重新导入失败' }));
    throw new Error(error.message || '重新导入失败');
  }

  return response.json();
}

/**
 * Import history statistics
 */
export interface ImportHistoryStats {
  total: number;
  completed: number;
  failed: number;
  partial: number;
  processing: number;
}

/**
 * Get import history statistics
 */
export async function getImportHistoryStats(
  startDate?: string,
  endDate?: string,
): Promise<ImportHistoryStats> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(`${API_URL}/import/customers/history/stats?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取统计信息失败' }));
    throw new Error(error.message || '获取统计信息失败');
  }

  return response.json();
}

