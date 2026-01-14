/**
 * DTOs for GDPR export requests
 * All custom code is proprietary and not open source.
 */

import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, Max, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * GDPR export formats
 */
export enum GdprExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
}

/**
 * GDPR export request status
 */
export enum GdprExportRequestStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  GENERATING_FILE = 'GENERATING_FILE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * DTO for creating a GDPR export request
 */
export class CreateGdprExportRequestDto {
  @IsEnum(GdprExportFormat)
  format: GdprExportFormat;
}

/**
 * DTO for GDPR export request ID parameter
 */
export class GdprExportRequestIdDto {
  @IsUUID('4', { message: '导出请求ID必须是有效的UUID' })
  id: string;
}

/**
 * DTO for GDPR export request list query parameters
 */
export class GdprExportRequestListQueryDto {
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
 * DTO for GDPR export request response
 */
export class GdprExportRequestResponseDto {
  id: string;
  userId: string;
  requestType: string;
  status: GdprExportRequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  downloadUrl?: string;
  downloadToken?: string; // Only included in single request detail, not in list
  fileFormat: GdprExportFormat;
  fileSize?: number;
  metadata?: any;
}

/**
 * DTO for GDPR export request list response
 */
export class GdprExportRequestListResponseDto {
  data: GdprExportRequestResponseDto[];
  total: number;
  page?: number;
  limit?: number;
}
