/**
 * DTOs for GDPR deletion requests
 * All custom code is proprietary and not open source.
 */

import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, Max, ValidateIf, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * GDPR deletion request status
 */
export enum GdprDeletionRequestStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
}

/**
 * DTO for creating a GDPR deletion request
 */
export class CreateGdprDeletionRequestDto {
  @IsString({ message: '确认信息不能为空' })
  confirmation: string; // User must type "确认删除" or similar to confirm
}

/**
 * DTO for GDPR deletion request ID parameter
 */
export class GdprDeletionRequestIdDto {
  @IsUUID('4', { message: '删除请求ID必须是有效的UUID' })
  id: string;
}

/**
 * DTO for GDPR deletion request list query parameters
 */
export class GdprDeletionRequestListQueryDto {
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于 0' })
  @Max(100, { message: '每页数量不能超过 100' })
  limit?: number;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null)
  @IsInt({ message: '偏移量必须是整数' })
  @Min(0, { message: '偏移量不能小于 0' })
  offset?: number;
}

/**
 * Deletion summary structure
 */
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

/**
 * DTO for GDPR deletion request response
 */
export class GdprDeletionRequestResponseDto {
  id: string;
  userId: string;
  requestType: string;
  status: GdprDeletionRequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  deletionSummary?: DeletionSummary;
  metadata?: any;
}

/**
 * DTO for GDPR deletion request list response
 */
export class GdprDeletionRequestListResponseDto {
  data: GdprDeletionRequestResponseDto[];
  total: number;
  page?: number;
  limit?: number;
}
