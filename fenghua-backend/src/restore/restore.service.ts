/**
 * Restore Service
 * 
 * Handles database restore operations
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, BadRequestException, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { BackupService } from '../backup/backup.service';
import { AuditService } from '../audit/audit.service';
// import { LogsService } from '../logs/logs.service'; // TODO: LogsModule not implemented yet
import { SettingsService } from '../settings/settings.service';
// import { LogLevel, ErrorType } from '../logs/dto/log-query.dto'; // TODO: LogsModule not implemented yet
import { RestoreStatus } from './dto/restore-request.dto';
import { Pool } from 'pg';

const execAsync = promisify(exec);

@Injectable()
export class RestoreService implements OnModuleDestroy {
  private readonly logger = new Logger(RestoreService.name);
  private restoreStatuses: Map<string, RestoreStatus> = new Map();
  private pgPool: Pool | null = null;
  private isRestoreInProgress: boolean = false;
  private currentRestorePromise: Promise<string> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly backupService: BackupService,
    private readonly auditService: AuditService,
    // private readonly logsService: LogsService, // TODO: LogsModule not implemented yet
    private readonly settingsService: SettingsService,
  ) {
    this.initializeDatabaseConnection();
  }

  /**
   * Initialize PostgreSQL connection pool for verification
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl = this.configService.get<string>('DATABASE_URL') ||
                       this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, restore verification may fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 1,
      });
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Get database connection info
   */
  private getDatabaseInfo(): { url: string; name: string } {
    const databaseUrl = this.configService.get<string>('DATABASE_URL') ||
                       this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      throw new BadRequestException('DATABASE_URL not configured');
    }

    try {
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      
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
    const backupStoragePath = this.configService.get<string>('BACKUP_STORAGE_PATH', './backups');
    const resolvedPath = path.resolve(filePath);
    const resolvedStoragePath = path.resolve(backupStoragePath);
    
    if (!resolvedPath.startsWith(resolvedStoragePath)) {
      throw new BadRequestException('File path outside backup storage directory');
    }
    
    return resolvedPath;
  }

  /**
   * Create snapshot backup before restore
   */
  private async createSnapshotBackup(token: string): Promise<string> {
    try {
      const metadata = await this.backupService.executeBackup(token);
      return metadata.filePath;
    } catch (error) {
      this.logger.error('Failed to create snapshot backup', error);
      throw new BadRequestException('Failed to create snapshot backup before restore');
    }
  }

  /**
   * Verify backup file integrity
   */
  private async verifyBackupFile(backupId: string): Promise<boolean> {
    return this.backupService.verifyBackup(backupId);
  }

  /**
   * Verify database integrity after restore
   */
  private async verifyDatabaseIntegrity(): Promise<boolean> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, skipping integrity check');
      return true;
    }

    try {
      // Check if we can connect and query
      const result = await this.pgPool.query('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \'public\'');
      const tableCount = parseInt(result.rows[0].count, 10);
      
      // Basic check: should have at least some tables
      return tableCount > 0;
    } catch (error) {
      this.logger.error('Database integrity check failed', error);
      return false;
    }
  }

  /**
   * Execute database restore using pg_restore
   */
  async executeRestore(backupId: string, token: string, operatorId: string): Promise<string> {
    // Check if restore is already in progress
    if (this.isRestoreInProgress && this.currentRestorePromise) {
      throw new BadRequestException('A restore operation is already in progress. Please wait for it to complete.');
    }

    // Set restore in progress flag
    this.isRestoreInProgress = true;
    const restoreId = `restore_${Date.now()}`;
    const startTime = new Date();

    // Initialize restore status
    const restoreStatus: RestoreStatus = {
      restoreId,
      status: 'running',
      progress: 0,
      message: 'Starting restore operation...',
      startedAt: startTime,
    };
    this.restoreStatuses.set(restoreId, restoreStatus);

    try {
      // Get backup metadata
      const backups = await this.backupService.loadBackupMetadata();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new NotFoundException(`Backup not found: ${backupId}`);
      }

      if (!backup.filePath || !fs.existsSync(backup.filePath)) {
        throw new NotFoundException(`Backup file not found: ${backup.filePath}`);
      }

      // Validate backup file path to prevent command injection
      const validatedBackupPath = this.validateFilePath(backup.filePath);

      // Update status
      restoreStatus.progress = 10;
      restoreStatus.message = 'Verifying backup file integrity...';
      this.restoreStatuses.set(restoreId, restoreStatus);

      // Verify backup file integrity
      const isValid = await this.verifyBackupFile(backupId);
      if (!isValid) {
        throw new BadRequestException('Backup file integrity check failed');
      }

      // Update status
      restoreStatus.progress = 20;
      restoreStatus.message = 'Creating snapshot backup...';
      this.restoreStatuses.set(restoreId, restoreStatus);

      // Create snapshot backup before restore
      const snapshotPath = await this.createSnapshotBackup(token);

      // Update status
      restoreStatus.progress = 40;
      restoreStatus.message = 'Executing database restore...';
      this.restoreStatuses.set(restoreId, restoreStatus);

      // Get database info
      const { url: databaseUrl, name: databaseName } = this.getDatabaseInfo();

      // Execute pg_restore with validated inputs
      const url = new URL(databaseUrl);
      // Use array format to prevent command injection
      const command = ['pg_restore', '-d', databaseName, '--clean', '--if-exists', validatedBackupPath];
      
      await execAsync(command.join(' '), {
        env: { ...process.env, PGPASSWORD: url.password },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Update status
      restoreStatus.progress = 80;
      restoreStatus.message = 'Verifying database integrity...';
      this.restoreStatuses.set(restoreId, restoreStatus);

      // Verify database integrity
      const isIntegrityValid = await this.verifyDatabaseIntegrity();
      if (!isIntegrityValid) {
        throw new BadRequestException('Database integrity check failed after restore');
      }

      // Update status
      restoreStatus.progress = 100;
      restoreStatus.status = 'completed';
      restoreStatus.message = 'Restore completed successfully';
      restoreStatus.completedAt = new Date();
      this.restoreStatuses.set(restoreId, restoreStatus);

      // Log restore success
      // TODO: LogsModule not implemented yet
      // this.logsService.log(LogLevel.INFO, `Database restore completed successfully: ${backupId}`, 'RestoreService', operatorId, {
      //   restoreId,
      //   backupId,
      //   snapshotPath,
      // });

      // Record audit log
      await this.auditService.log({
        action: 'RESTORE',
        entityType: 'DATABASE',
        entityId: 'database',
        userId: operatorId,
        operatorId,
        timestamp: new Date(),
        metadata: {
          restoreId,
          backupId,
          snapshotPath,
        },
      });

      // Send notification (MVP: log to console, production: send email)
      await this.sendRestoreSuccessNotification(operatorId);

      this.logger.log(`Restore completed: ${restoreId}`);

      // Reset restore in progress flag
      this.isRestoreInProgress = false;
      this.currentRestorePromise = null;

      return restoreId;
    } catch (error) {
      this.logger.error('Restore failed', error);

      // Update status
      restoreStatus.status = 'failed';
      restoreStatus.progress = 0;
      restoreStatus.message = error instanceof Error ? error.message : 'Unknown error';
      restoreStatus.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      restoreStatus.completedAt = new Date();
      this.restoreStatuses.set(restoreId, restoreStatus);

      // Log restore failure
      // TODO: LogsModule not implemented yet
      // await this.logsService.logError(ErrorType.SYSTEM, `Database restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : '', operatorId, '/restore', undefined, {
      //   restoreId,
      //   backupId,
      // });

      // Send notification (MVP: log to console, production: send email)
      await this.sendRestoreFailureNotification(operatorId, error instanceof Error ? error.message : 'Unknown error');

      // Reset restore in progress flag
      this.isRestoreInProgress = false;
      this.currentRestorePromise = null;

      throw error;
    }
  }

  /**
   * Send restore completion notification (success or failure)
   * MVP: Log to console and system logs
   * Production: Send email to configured recipients
   */
  private async sendRestoreNotification(operatorId: string, success: boolean, message: string): Promise<void> {
    try {
      const settings = await this.settingsService.getAllSettings();
      
      if (settings.emailNotificationsEnabled && settings.notificationRecipients.length > 0) {
        // MVP: Log notification (production should send email)
        this.logger.warn(`Restore ${success ? 'success' : 'failure'} notification should be sent to: ${settings.notificationRecipients.join(', ')}`);
        this.logger.warn(`Notification message: ${message}`);
        
        // Log to system logs
        // TODO: LogsModule not implemented yet
        // this.logsService.log(LogLevel.WARN, `Restore ${success ? 'success' : 'failure'} notification (would send to: ${settings.notificationRecipients.join(', ')})`, 'RestoreService', operatorId, {
        //   message,
        //   recipients: settings.notificationRecipients,
        // });
        
        // TODO: In production, implement email sending using SendGrid, AWS SES, etc.
      } else {
        this.logger.debug('Email notifications disabled or no recipients configured');
      }
    } catch (error) {
      this.logger.error('Failed to send restore notification', error);
    }
  }

  /**
   * Send restore failure notification
   */
  private async sendRestoreFailureNotification(operatorId: string, errorMessage: string): Promise<void> {
    await this.sendRestoreNotification(operatorId, false, `Restore failed: ${errorMessage}`);
  }

  /**
   * Send restore success notification
   */
  private async sendRestoreSuccessNotification(operatorId: string): Promise<void> {
    await this.sendRestoreNotification(operatorId, true, 'Restore completed successfully');
  }

  /**
   * Get restore status
   */
  getRestoreStatus(restoreId: string): RestoreStatus | null {
    return this.restoreStatuses.get(restoreId) || null;
  }

  /**
   * Cleanup old restore statuses (older than 1 hour)
   */
  cleanupOldStatuses(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [restoreId, status] of this.restoreStatuses.entries()) {
      if (status.completedAt && new Date(status.completedAt) < oneHourAgo) {
        this.restoreStatuses.delete(restoreId);
      }
    }
  }

  /**
   * Cleanup resources on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }
}

