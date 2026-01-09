/**
 * DTOs for export responses
 * All custom code is proprietary and not open source.
 */

import { ExportFormat, ExportDataType } from './export-request.dto';

/**
 * Export task status
 */
export enum ExportTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Export task response DTO
 */
export interface ExportTaskResponseDto {
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

/**
 * Export file download response DTO
 */
export interface ExportFileDownloadDto {
  fileId: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  expiresAt: Date;
}

/**
 * Export history response DTO
 */
export interface ExportHistoryDto {
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

/**
 * Export history query response DTO
 */
export interface ExportHistoryResponseDto {
  history: ExportHistoryDto[];
  total: number;
  limit: number;
  offset: number;
}


