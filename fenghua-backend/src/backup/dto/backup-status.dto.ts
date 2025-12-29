/**
 * DTOs for backup status
 * All custom code is proprietary and not open source.
 */

import { IsOptional, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Backup metadata interface
 */
export interface BackupMetadata {
  id: string;
  timestamp: Date;
  status: 'success' | 'failed';
  fileSize: number;
  filePath: string;
  checksum: string;
  workspaceId: string;
  databaseName: string;
  errorMessage?: string;
}

/**
 * Backup status response DTO
 */
export class BackupStatusResponseDto {
  lastBackupTime?: Date;
  lastBackupStatus?: 'success' | 'failed';
  lastBackupFileSize?: number;
  lastBackupFilePath?: string;
  lastBackupError?: string;
}

/**
 * Backup history query DTO
 */
export class BackupHistoryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['success', 'failed'])
  status?: 'success' | 'failed';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Backup history response DTO
 */
export class BackupHistoryResponseDto {
  backups: BackupMetadata[];
  total: number;
  limit: number;
  offset: number;
}

