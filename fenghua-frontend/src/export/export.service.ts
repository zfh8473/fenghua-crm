/**
 * Export Service
 * 
 * Frontend service for data export functionality
 * All custom code is proprietary and not open source.
 */

export enum ExportDataType {
  CUSTOMER = 'CUSTOMER',
  PRODUCT = 'PRODUCT',
  INTERACTION = 'INTERACTION',
}

export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

export enum ExportTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface FieldDefinition {
  fieldName: string;
  displayName: string;
  category: string;
  isRequired: boolean;
  dataType: string;
}

export interface ExportRequest {
  dataType: ExportDataType;
  format: ExportFormat;
  customerFilters?: any;
  productFilters?: any;
  interactionFilters?: any;
  selectedFields?: string[];
}

export interface ExportTaskResponse {
  taskId: string;
  status: ExportTaskStatus;
  dataType: ExportDataType;
  format: ExportFormat;
  totalRecords?: number;
  processedRecords?: number;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  estimatedTimeRemaining?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportHistoryItem {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  total_records: number;
  export_type: ExportDataType;
  export_format: ExportFormat;
  status: ExportTaskStatus;
  created_by: string;
  created_at: Date;
  expires_at: Date;
}

export interface ExportHistoryResponse {
  history: ExportHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('fenghua_auth_token');
}

/**
 * Start export task
 */
export async function startExport(
  type: 'customers' | 'products' | 'interactions',
  request: ExportRequest,
): Promise<{ taskId: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`/api/export/${type}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '导出任务启动失败' }));
    throw new Error(error.message || '导出任务启动失败');
  }

  return response.json();
}

/**
 * Get export task status
 */
export async function getExportTaskStatus(taskId: string): Promise<ExportTaskResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`/api/export/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取导出任务状态失败' }));
    throw new Error(error.message || '获取导出任务状态失败');
  }

  const data = await response.json();
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
  };
}

/**
 * Download export file
 */
export async function downloadExportFile(fileId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`/api/export/files/${fileId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '下载文件失败' }));
    throw new Error(error.message || '下载文件失败');
  }

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let fileName = `export-${fileId}.json`;
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
    if (fileNameMatch) {
      fileName = decodeURIComponent(fileNameMatch[1]);
    }
  }

  // Create blob and download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Get available fields for export data type
 */
export async function getAvailableFields(dataType: ExportDataType): Promise<FieldDefinition[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const typeMap: Record<ExportDataType, string> = {
    [ExportDataType.CUSTOMER]: 'customer',
    [ExportDataType.PRODUCT]: 'product',
    [ExportDataType.INTERACTION]: 'interaction',
  };

  const response = await fetch(`/api/export/fields/${typeMap[dataType]}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取字段列表失败' }));
    throw new Error(error.message || '获取字段列表失败');
  }

  return response.json();
}

/**
 * Get export history
 */
export async function getExportHistory(filters?: {
  exportType?: ExportDataType;
  format?: ExportFormat;
  status?: ExportTaskStatus;
  limit?: number;
  offset?: number;
}): Promise<ExportHistoryResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const params = new URLSearchParams();
  if (filters?.exportType) params.append('exportType', filters.exportType);
  if (filters?.format) params.append('format', filters.format);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const response = await fetch(`/api/export/history?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '获取导出历史失败' }));
    throw new Error(error.message || '获取导出历史失败');
  }

  const data = await response.json();
  return {
    ...data,
    history: data.history.map((item: any) => ({
      ...item,
      created_at: new Date(item.created_at),
      expires_at: new Date(item.expires_at),
    })),
  };
}

