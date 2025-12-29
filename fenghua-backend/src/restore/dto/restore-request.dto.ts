/**
 * DTOs for restore operations
 * All custom code is proprietary and not open source.
 */

import { IsString, IsUUID } from 'class-validator';

/**
 * Restore request DTO
 */
export class RestoreRequestDto {
  @IsString()
  @IsUUID()
  backupId: string;
}

/**
 * Restore status interface
 */
export interface RestoreStatus {
  restoreId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

/**
 * Restore status response DTO
 */
export class RestoreStatusResponseDto {
  restoreId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

