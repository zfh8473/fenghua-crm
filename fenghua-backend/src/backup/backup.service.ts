/**
 * Backup Service
 * 
 * Handles database backup operations
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { TwentyClientService } from '../services/twenty-client/twenty-client.service';
import { SettingsService } from '../settings/settings.service';
import { LogsService } from '../logs/logs.service';
import { LogLevel, ErrorType } from '../logs/dto/log-query.dto';
import { BackupMetadata } from './dto/backup-status.dto';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private backupStoragePath: string;
  private metadataPath: string;
  private isBackupInProgress: boolean = false;
  private currentBackupPromise: Promise<BackupMetadata> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly twentyClient: TwentyClientService,
    private readonly settingsService: SettingsService,
    private readonly logsService: LogsService,
  ) {
    // Initialize backup storage path
    this.backupStoragePath = this.configService.get<string>('BACKUP_STORAGE_PATH', './backups');
    this.metadataPath = path.join(this.backupStoragePath, 'metadata', 'backups.json');

    // Ensure backup directories exist
    this.initializeBackupDirectories();
  }

  /**
   * Initialize backup directories
   */
  private initializeBackupDirectories(): void {
    try {
      // Create backup storage directory
      if (!fs.existsSync(this.backupStoragePath)) {
        fs.mkdirSync(this.backupStoragePath, { recursive: true });
        this.logger.log(`Created backup storage directory: ${this.backupStoragePath}`);
      }

      // Create metadata directory
      const metadataDir = path.dirname(this.metadataPath);
      if (!fs.existsSync(metadataDir)) {
        fs.mkdirSync(metadataDir, { recursive: true });
        this.logger.log(`Created metadata directory: ${metadataDir}`);
      }

      // Initialize metadata file if it doesn't exist
      if (!fs.existsSync(this.metadataPath)) {
        fs.writeFileSync(this.metadataPath, JSON.stringify([], null, 2));
        this.logger.log(`Initialized metadata file: ${this.metadataPath}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize backup directories', error);
      throw new BadRequestException('Failed to initialize backup storage');
    }
  }

  /**
   * Get workspace ID from token
   */
  async getWorkspaceId(token: string): Promise<string> {
    try {
      const query = `
        query {
          currentUser {
            workspaceMember {
              workspace {
                id
              }
            }
          }
        }
      `;
      const result = await this.twentyClient.executeQueryWithToken<{
        currentUser: {
          workspaceMember: {
            workspace: {
              id: string;
            };
          };
        };
      }>(query, token);

      return result.currentUser.workspaceMember.workspace.id;
    } catch (error) {
      this.logger.error('Failed to get workspace ID', error);
      throw new BadRequestException('Failed to get workspace ID');
    }
  }

  /**
   * Get database connection string and name
   */
  private getDatabaseInfo(): { url: string; name: string } {
    const databaseUrl = this.configService.get<string>('DATABASE_URL') ||
                       this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      throw new BadRequestException('DATABASE_URL not configured');
    }

    try {
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1); // Remove leading '/'
      
      // Validate database name to prevent command injection
      if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
        throw new BadRequestException('Invalid database name format');
      }
      
      return { url: databaseUrl, name: dbName };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to parse database URL', error);
      throw new BadRequestException('Invalid DATABASE_URL format');
    }
  }

  /**
   * Validate and sanitize file path to prevent command injection
   */
  private validateFilePath(filePath: string): string {
    // Check for path traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
      throw new BadRequestException('Invalid file path');
    }
    
    // Ensure path is within backup storage directory
    const resolvedPath = path.resolve(filePath);
    const resolvedStoragePath = path.resolve(this.backupStoragePath);
    
    if (!resolvedPath.startsWith(resolvedStoragePath)) {
      throw new BadRequestException('File path outside backup storage directory');
    }
    
    return resolvedPath;
  }

  /**
   * Calculate file checksum (SHA256)
   */
  private calculateChecksum(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * Execute database backup using pg_dump
   */
  async executeBackup(token: string): Promise<BackupMetadata> {
    // Check if backup is already in progress
    if (this.isBackupInProgress && this.currentBackupPromise) {
      throw new BadRequestException('A backup operation is already in progress. Please wait for it to complete.');
    }

    // Set backup in progress flag
    this.isBackupInProgress = true;
    const backupId = `backup_${Date.now()}`;
    const startTime = new Date();

    try {
      // Get workspace ID and database info
      const workspaceId = await this.getWorkspaceId(token);
      const { url: databaseUrl, name: databaseName } = this.getDatabaseInfo();

      // Generate backup file name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupFileName = `backup_${databaseName}_${workspaceId}_${timestamp}.dump`;
      const backupFilePath = path.join(this.backupStoragePath, backupFileName);

      // Validate file path
      const validatedPath = this.validateFilePath(backupFilePath);

      this.logger.log(`Starting backup: ${backupFileName}`);

      // Execute pg_dump with validated inputs
      const url = new URL(databaseUrl);
      // Use array format to prevent command injection
      const command = ['pg_dump', '-Fc', '-f', validatedPath, databaseName];
      
      await execAsync(command.join(' '), {
        env: { ...process.env, PGPASSWORD: url.password },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Verify backup file exists and is not empty
      if (!fs.existsSync(backupFilePath)) {
        throw new Error('Backup file was not created');
      }

      const stats = fs.statSync(backupFilePath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // Calculate checksum
      const checksum = this.calculateChecksum(backupFilePath);

      // Create backup metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: startTime,
        status: 'success',
        fileSize: stats.size,
        filePath: backupFilePath,
        checksum,
        workspaceId,
        databaseName,
      };

      // Save metadata
      await this.saveBackupMetadata(metadata);

      // Log backup success
      this.logsService.log(LogLevel.INFO, `Backup completed successfully: ${backupFileName}`, 'BackupService', undefined, {
        backupId,
        fileSize: stats.size,
        workspaceId,
      });

      this.logger.log(`Backup completed: ${backupFileName} (${stats.size} bytes)`);

      // Cleanup old backups (async, don't block)
      this.cleanupOldBackups().catch((error) => {
        this.logger.error('Failed to cleanup old backups', error);
      });

      // Reset backup in progress flag
      this.isBackupInProgress = false;
      this.currentBackupPromise = null;

      return metadata;
    } catch (error) {
      this.logger.error('Backup failed', error);

      // Create failed backup metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: startTime,
        status: 'failed',
        fileSize: 0,
        filePath: '',
        checksum: '',
        workspaceId: '',
        databaseName: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      // Save failed metadata
      await this.saveBackupMetadata(metadata);

      // Log backup failure
      await this.logsService.logError(ErrorType.SYSTEM, `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : '', undefined, '/backup', undefined, {
        backupId,
      });

      // Send notification (MVP: log to console, production: send email)
      await this.sendBackupFailureNotification(error instanceof Error ? error.message : 'Unknown error');

      // Reset backup in progress flag
      this.isBackupInProgress = false;
      this.currentBackupPromise = null;

      throw new BadRequestException(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send backup failure notification
   * MVP: Log to console and system logs
   * Production: Send email to configured recipients
   */
  private async sendBackupFailureNotification(errorMessage: string): Promise<void> {
    try {
      const settings = await this.settingsService.getAllSettings();
      
      if (settings.emailNotificationsEnabled && settings.notificationRecipients.length > 0) {
        // MVP: Log notification (production should send email)
        this.logger.warn(`Backup failure notification should be sent to: ${settings.notificationRecipients.join(', ')}`);
        this.logger.warn(`Notification message: Backup failed - ${errorMessage}`);
        
        // Log to system logs
        this.logsService.log(LogLevel.WARN, `Backup failure notification (would send to: ${settings.notificationRecipients.join(', ')})`, 'BackupService', undefined, {
          errorMessage,
          recipients: settings.notificationRecipients,
        });
        
        // TODO: In production, implement email sending using SendGrid, AWS SES, etc.
      } else {
        this.logger.debug('Email notifications disabled or no recipients configured');
      }
    } catch (error) {
      this.logger.error('Failed to send backup failure notification', error);
    }
  }

  /**
   * Save backup metadata to file
   */
  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      let backups: BackupMetadata[] = [];
      
      try {
        const content = await fsPromises.readFile(this.metadataPath, 'utf-8');
        backups = JSON.parse(content);
      } catch (error: any) {
        // File doesn't exist or is empty, start with empty array
        if (error.code !== 'ENOENT') {
          this.logger.warn('Failed to read backup metadata file, starting fresh', error);
        }
      }

      backups.push(metadata);

      // Keep only last 100 backups in memory (for performance)
      if (backups.length > 100) {
        backups = backups.slice(-100);
      }

      await fsPromises.writeFile(this.metadataPath, JSON.stringify(backups, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to save backup metadata', error);
    }
  }

  /**
   * Load backup metadata from file
   */
  async loadBackupMetadata(): Promise<BackupMetadata[]> {
    try {
      const content = await fsPromises.readFile(this.metadataPath, 'utf-8');
      const backups: BackupMetadata[] = JSON.parse(content);
      
      // Convert timestamp strings to Date objects
      return backups.map(backup => ({
        ...backup,
        timestamp: new Date(backup.timestamp),
      }));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        return [];
      }
      this.logger.error('Failed to load backup metadata', error);
      return [];
    }
  }

  /**
   * Cleanup old backups (older than retention period)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const settings = await this.settingsService.getAllSettings();
      const retentionDays = settings.backupRetentionDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const backups = await this.loadBackupMetadata();
      const backupsToDelete = backups.filter(backup => new Date(backup.timestamp) < cutoffDate);

      for (const backup of backupsToDelete) {
        // Delete backup file if it exists
        if (backup.filePath) {
          try {
            await fsPromises.unlink(backup.filePath);
            this.logger.log(`Deleted old backup file: ${backup.filePath}`);
          } catch (error: any) {
            if (error.code !== 'ENOENT') {
              this.logger.error(`Failed to delete backup file: ${backup.filePath}`, error);
            }
          }
        }
      }

      // Update metadata file (remove deleted backups)
      const remainingBackups = backups.filter(backup => new Date(backup.timestamp) >= cutoffDate);
      await fsPromises.writeFile(this.metadataPath, JSON.stringify(remainingBackups, null, 2), 'utf-8');

      if (backupsToDelete.length > 0) {
        this.logger.log(`Cleaned up ${backupsToDelete.length} old backup(s)`);
        this.logsService.log(LogLevel.INFO, `Cleaned up ${backupsToDelete.length} old backup(s)`, 'BackupService');
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old backups', error);
    }
  }

  /**
   * Verify backup file integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const backups = await this.loadBackupMetadata();
      const backup = backups.find(b => b.id === backupId);

      if (!backup || !backup.filePath) {
        return false;
      }

      if (!fs.existsSync(backup.filePath)) {
        return false;
      }

      // Verify checksum
      const currentChecksum = this.calculateChecksum(backup.filePath);
      return currentChecksum === backup.checksum;
    } catch (error) {
      this.logger.error(`Failed to verify backup ${backupId}`, error);
      return false;
    }
  }

  /**
   * Scheduled backup task (runs daily at 2:00 AM by default)
   * Schedule can be configured via SettingsService
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup(): Promise<void> {
    this.logger.log('Starting scheduled backup...');

    try {
      // Get backup frequency from settings
      const settings = await this.settingsService.getAllSettings();
      
      // For MVP, we use a simple token from environment variable
      // In production, this should use a service account token
      const serviceToken = process.env.TWENTY_SERVICE_TOKEN || process.env.TWENTY_API_TOKEN;
      
      if (!serviceToken) {
        this.logger.warn('No service token configured for scheduled backup');
        return;
      }

      // Execute backup
      await this.executeBackup(serviceToken);
      
      this.logger.log('Scheduled backup completed successfully');
    } catch (error) {
      this.logger.error('Scheduled backup failed', error);
      // Error is already logged in executeBackup
    }
  }
}

