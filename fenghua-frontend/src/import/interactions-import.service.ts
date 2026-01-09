/**
 * Interactions Import Service
 * 
 * Handles interaction data import API calls
 * All custom code is proprietary and not open source.
 */

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('fenghua_auth_token');
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
 * Validation result
 */
export interface ValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors?: ValidationErrorDetail[];
  cleaningSuggestions?: DataCleaningSuggestion[];
  hasErrors: boolean;
  hasDuplicates: boolean;
  hasCleaningSuggestions: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  errors?: ValidationErrorDetail[];
  taskId: string;
  progress?: {
    processed: number;
    total: number;
    estimatedTimeRemaining?: number | null;
  };
}

/**
 * Start import request
 */
export interface StartImportRequest {
  fileId: string;
  columnMappings: ColumnMapping[];
}

/**
 * Upload import file
 */
export async function uploadImportFile(file: File): Promise<UploadFileResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/import/interactions/upload`, {
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

  const response = await fetch(`${API_URL}/import/interactions/preview`, {
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
export async function validateImportData(request: {
  fileId: string;
  columnMappings: ColumnMapping[];
}): Promise<ValidationResult> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/import/interactions/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileId: request.fileId,
      columnMappings: request.columnMappings,
    }),
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

  const response = await fetch(`${API_URL}/import/interactions/start`, {
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

  const response = await fetch(`${API_URL}/import/interactions/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取任务状态失败' }));
    throw new Error(error.message || '获取任务状态失败');
  }

  return response.json();
}

/**
 * Get import history
 */
export async function getImportHistory(
  limit: number = 20,
  offset: number = 0,
): Promise<{ history: any[]; total: number }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(
    `${API_URL}/import/interactions/history?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取导入历史失败' }));
    throw new Error(error.message || '获取导入历史失败');
  }

  return response.json();
}


