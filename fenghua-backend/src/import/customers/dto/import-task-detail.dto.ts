/**
 * DTOs for import task detail
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImportStatus } from './import-history.dto';

/**
 * Error detail item
 */
export class ErrorDetailItemDto {
  @IsNumber()
  row: number;

  @IsObject()
  data: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorFieldDto)
  errors: ErrorFieldDto[];
}

/**
 * Error field
 */
export class ErrorFieldDto {
  @IsString()
  field: string;

  @IsString()
  message: string;
}

/**
 * Import task detail DTO
 */
export class ImportTaskDetailDto {
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

  @IsString()
  @IsOptional()
  importType?: string;

  @IsNumber()
  totalRecords: number;

  @IsNumber()
  successCount: number;

  @IsNumber()
  failureCount: number;

  @IsString()
  @IsOptional()
  errorReportPath?: string;

  @IsDateString()
  startedAt: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorDetailItemDto)
  @IsOptional()
  errorDetails?: ErrorDetailItemDto[];
}

