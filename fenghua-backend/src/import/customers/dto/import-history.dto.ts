/**
 * DTOs for import history
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ImportStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

export enum ImportType {
  CUSTOMER = 'CUSTOMER',
  PRODUCT = 'PRODUCT',
  INTERACTION = 'INTERACTION',
}

/**
 * DTO for import history item
 */
export class ImportHistoryItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsEnum(ImportStatus)
  status: ImportStatus;

  @IsNumber()
  totalRecords: number;

  @IsNumber()
  successCount: number;

  @IsNumber()
  failureCount: number;

  @IsString()
  @IsOptional()
  errorReportPath?: string;

  @IsString()
  @IsOptional()
  importType?: string;

  @IsDateString()
  startedAt: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}

/**
 * DTO for import history query
 */
export class ImportHistoryQueryDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @IsEnum(ImportStatus)
  @IsOptional()
  status?: ImportStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ImportType)
  @IsOptional()
  importType?: ImportType;

  @IsString()
  @IsOptional()
  search?: string;
}

/**
 * DTO for import history response
 */
export class ImportHistoryResponseDto {
  @IsNumber()
  total: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  offset: number;

  items: ImportHistoryItemDto[];
}

