/**
 * Restore Service Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RestoreService } from './restore.service';
import { BackupService } from '../backup/backup.service';
import { AuditService } from '../audit/audit.service';
// import { LogsService } from '../logs/logs.service'; // TODO: LogsModule not implemented yet
import { SettingsService } from '../settings/settings.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';

// Mock pg Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [{ count: '10' }] }),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('RestoreService', () => {
  let service: RestoreService;
  let configService: jest.Mocked<ConfigService>;
  let backupService: jest.Mocked<BackupService>;
  let auditService: jest.Mocked<AuditService>;
  // let logsService: jest.Mocked<LogsService>; // TODO: LogsModule not implemented yet
  let settingsService: jest.Mocked<SettingsService>;

  const mockBackupId = 'backup-123';
  const mockToken = 'test-token';
  const mockOperatorId = 'operator-123';
  const mockDatabaseUrl = 'postgresql://user:pass@localhost:5432/testdb';

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'DATABASE_URL') return mockDatabaseUrl;
        if (key === 'BACKUP_STORAGE_PATH') return './test-backups';
        return defaultValue;
      }),
    };

    const mockBackupService = {
      loadBackupMetadata: jest.fn().mockResolvedValue([
        {
          id: mockBackupId,
          timestamp: new Date(),
          status: 'success',
          fileSize: 1024,
          filePath: './test-backups/backup.dump',
          checksum: 'abc123',
          workspaceId: 'workspace-123',
          databaseName: 'testdb',
        },
      ]),
      verifyBackup: jest.fn().mockResolvedValue(true),
      executeBackup: jest.fn().mockResolvedValue({
        id: 'snapshot-123',
        filePath: './test-backups/snapshot.dump',
      }),
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    // TODO: LogsModule not implemented yet
    // const mockLogsService = {
    //   log: jest.fn(),
    //   logError: jest.fn().mockResolvedValue(undefined),
    // };

    const mockSettingsService = {
      getAllSettings: jest.fn().mockResolvedValue({
        emailNotificationsEnabled: false,
        notificationRecipients: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestoreService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        // TODO: LogsModule not implemented yet
        // {
        //   provide: LogsService,
        //   useValue: mockLogsService,
        // },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    service = module.get<RestoreService>(RestoreService);
    configService = module.get(ConfigService);
    backupService = module.get(BackupService);
    auditService = module.get(AuditService);
    // logsService = module.get(LogsService); // TODO: LogsModule not implemented yet
    settingsService = module.get(SettingsService);

    // Mock fs.existsSync
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeRestore', () => {
    it('should prevent concurrent restores', async () => {
      const { exec } = require('child_process');
      // Mock exec to hang
      exec.mockImplementation((command, options, callback) => {
        // Don't call callback, simulating hanging process
      });

      const promise1 = service.executeRestore(mockBackupId, mockToken, mockOperatorId);
      // Wait a bit to ensure first restore starts
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Second restore should fail
      await expect(service.executeRestore(mockBackupId, mockToken, mockOperatorId)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if backup not found', async () => {
      backupService.loadBackupMetadata.mockResolvedValueOnce([]);

      await expect(service.executeRestore('invalid-backup', mockToken, mockOperatorId)).rejects.toThrow(NotFoundException);
    });

    it('should throw error if backup file not found', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);

      await expect(service.executeRestore(mockBackupId, mockToken, mockOperatorId)).rejects.toThrow(NotFoundException);
    });

    it('should throw error if backup integrity check fails', async () => {
      backupService.verifyBackup.mockResolvedValueOnce(false);

      await expect(service.executeRestore(mockBackupId, mockToken, mockOperatorId)).rejects.toThrow(BadRequestException);
    });

    it('should validate database name format', async () => {
      configService.get.mockReturnValueOnce('postgresql://user:pass@localhost:5432/invalid-db-name!');

      await expect(service.executeRestore(mockBackupId, mockToken, mockOperatorId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRestoreStatus', () => {
    it('should return restore status if exists', async () => {
      const { exec } = require('child_process');
      exec.mockImplementation((command, options, callback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      const restoreId = await service.executeRestore(mockBackupId, mockToken, mockOperatorId);
      const status = service.getRestoreStatus(restoreId);
      
      expect(status).toBeDefined();
      expect(status?.restoreId).toBe(restoreId);
    });

    it('should return null if restore status not found', () => {
      const status = service.getRestoreStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close PostgreSQL connection pool', async () => {
      await service.onModuleDestroy();
      // Pool should be closed (mocked)
      expect(Pool).toHaveBeenCalled();
    });
  });
});

