/**
 * DTOs for import result
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Error detail for a failed record
 */
export class ImportErrorDetail {
  @IsNumber()
  row: number;

  @IsString()
  @IsNotEmpty()
  field: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

/**
 * DTO for import result
 */
export class ImportResultDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  status: 'processing' | 'completed' | 'failed';

  @IsNumber()
  totalRecords: number;

  @IsNumber()
  successCount: number;

  @IsNumber()
  failureCount: number;

  @IsOptional()
  @IsNumber()
  progress?: number; // 0-100

  @IsOptional()
  @IsString()
  errorReportUrl?: string; // URL to download failed records file

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportErrorDetail)
  errors?: ImportErrorDetail[]; // Sample of errors for display
}

