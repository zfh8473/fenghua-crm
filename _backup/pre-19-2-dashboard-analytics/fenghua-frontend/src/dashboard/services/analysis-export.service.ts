/**
 * Analysis Export Service
 * 
 * Service for exporting analysis results in multiple formats
 * All custom code is proprietary and not open source.
 */

export type AnalysisType =
  | 'product-association'
  | 'customer'
  | 'supplier'
  | 'buyer'
  | 'business-trend';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'png' | 'jpeg';

export interface AnalysisExportRequest {
  analysisType: AnalysisType;
  format: ExportFormat;
  queryParams?: Record<string, any>;
  includeCharts?: boolean;
}

/**
 * Export analysis results
 * @param token User authentication token
 * @param request Export request parameters
 * @returns Promise that resolves when download starts
 */
export async function exportAnalysis(
  token: string,
  request: AnalysisExportRequest,
): Promise<void> {
  const apiBaseUrl =
    (import.meta.env?.VITE_API_BASE_URL as string) ||
    (import.meta.env?.VITE_BACKEND_URL as string) ||
    '/api';

  // For image formats, handle on frontend
  if (request.format === 'png' || request.format === 'jpeg') {
    throw new Error('图片导出功能由前端处理，请使用图表导出工具函数');
  }

  // For other formats, call backend API
  const response = await fetch(`${apiBaseUrl}/dashboard/analysis-export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = '导出失败，请稍后重试';
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // If parsing fails, use default message
    }
    throw new Error(errorMessage);
  }

  // Get file name from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  let fileName = `analysis_${new Date().toISOString().split('T')[0]}.${request.format}`;
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''));
    }
  }

  // Download file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

