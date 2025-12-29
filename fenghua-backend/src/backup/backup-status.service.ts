/**
 * Backup Status Service
 * 
 * Handles backup status queries
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupMetadata, BackupStatusResponseDto, BackupHistoryQueryDto, BackupHistoryResponseDto } from './dto/backup-status.dto';

@Injectable()
export class BackupStatusService {
  private readonly logger = new Logger(BackupStatusService.name);

  constructor(private readonly backupService: BackupService) {}

  /**
   * Get backup status (last backup information)
   */
  async getBackupStatus(): Promise<BackupStatusResponseDto> {
    try {
      const backups = await this.backupService.loadBackupMetadata();
      
      if (backups.length === 0) {
        return {
          lastBackupTime: undefined,
          lastBackupStatus: undefined,
          lastBackupFileSize: undefined,
          lastBackupFilePath: undefined,
          lastBackupError: undefined,
        };
      }

      // Sort by timestamp (newest first)
      const sortedBackups = backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const lastBackup = sortedBackups[0];

      return {
        lastBackupTime: lastBackup.timestamp,
        lastBackupStatus: lastBackup.status,
        lastBackupFileSize: lastBackup.fileSize,
        lastBackupFilePath: lastBackup.filePath,
        lastBackupError: lastBackup.errorMessage,
      };
    } catch (error) {
      this.logger.error('Failed to get backup status', error);
      throw error;
    }
  }

  /**
   * Get backup history (last 30 days by default)
   */
  async getBackupHistory(query: BackupHistoryQueryDto): Promise<BackupHistoryResponseDto> {
    try {
      let backups = await this.backupService.loadBackupMetadata();

      // Filter by date range (default: last 30 days)
      const endDate = query.endDate ? new Date(query.endDate) : new Date();
      const startDate = query.startDate 
        ? new Date(query.startDate) 
        : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      backups = backups.filter(backup => {
        const backupDate = new Date(backup.timestamp);
        return backupDate >= startDate && backupDate <= endDate;
      });

      // Filter by status if provided
      if (query.status) {
        backups = backups.filter(backup => backup.status === query.status);
      }

      // Sort by timestamp (newest first)
      backups = backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply pagination
      const limit = query.limit || 50;
      const offset = query.offset || 0;
      const total = backups.length;
      const paginatedBackups = backups.slice(offset, offset + limit);

      return {
        backups: paginatedBackups,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error('Failed to get backup history', error);
      throw error;
    }
  }

  /**
   * Get backup details by ID
   */
  async getBackupDetails(backupId: string): Promise<BackupMetadata> {
    try {
      const backups = await this.backupService.loadBackupMetadata();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new NotFoundException(`Backup not found: ${backupId}`);
      }

      return backup;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get backup details for ${backupId}`, error);
      throw error;
    }
  }
}

