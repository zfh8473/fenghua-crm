/**
 * Backup Service Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BackupService } from './backup.service';
import { TwentyClientService } from '../services/twenty-client/twenty-client.service';
import { SettingsService } from '../settings/settings.service';
import { LogsService } from '../logs/logs.service';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('BackupService', () => {
  let service: BackupService;
  let configService: jest.Mocked<ConfigService>;
  let twentyClient: jest.Mocked<TwentyClientService>;
  let settingsService: jest.Mocked<SettingsService>;
  let logsService: jest.Mocked<LogsService>;

  const mockWorkspaceId = 'workspace-123';
  const mockToken = 'test-token';
  const mockDatabaseUrl = 'postgresql://user:pass@localhost:5432/testdb';
  const mockBackupStoragePath = './test-backups';

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'BACKUP_STORAGE_PATH') return mockBackupStoragePath;
        if (key === 'DATABASE_URL') return mockDatabaseUrl;
        return defaultValue;
      }),
    };

    const mockTwentyClient = {
      executeQueryWithToken: jest.fn().mockResolvedValue({
        currentUser: {
          workspaceMember: {
            workspace: {
              id: mockWorkspaceId,
            },
          },
        },
      }),
    };

    const mockSettingsService = {
      getAllSettings: jest.fn().mockResolvedValue({
        backupRetentionDays: 30,
        emailNotificationsEnabled: false,
        notificationRecipients: [],
      }),
    };

    const mockLogsService = {
      log: jest.fn(),
      logError: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TwentyClientService,
          useValue: mockTwentyClient,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: LogsService,
          useValue: mockLogsService,
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    configService = module.get(ConfigService);
    twentyClient = module.get(TwentyClientService);
    settingsService = module.get(SettingsService);
    logsService = module.get(LogsService);

    // Mock fs.existsSync
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'statSync').mockReturnValue({ size: 1024 } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkspaceId', () => {
    it('should get workspace ID from token', async () => {
      const workspaceId = await service.getWorkspaceId(mockToken);
      expect(workspaceId).toBe(mockWorkspaceId);
      expect(twentyClient.executeQueryWithToken).toHaveBeenCalled();
    });

    it('should throw error if workspace ID cannot be retrieved', async () => {
      twentyClient.executeQueryWithToken.mockRejectedValueOnce(new Error('Failed'));
      await expect(service.getWorkspaceId(mockToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('executeBackup', () => {
    it('should prevent concurrent backups', async () => {
      // Mock exec to simulate a quick backup
      const { exec } = require('child_process');
      exec.mockImplementation((command, options, callback) => {
        // Simulate successful backup after a short delay
        setTimeout(() => {
          callback(null, { stdout: '', stderr: '' });
        }, 100);
      });

      // Mock file operations
      jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from('test'));
      const crypto = require('crypto');
      jest.spyOn(crypto, 'createHash').mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('abc123'),
      }));

      const promise1 = service.executeBackup(mockToken);
      // Wait a bit to ensure first backup starts
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Second backup should fail with concurrent operation error
      await expect(service.executeBackup(mockToken)).rejects.toThrow(BadRequestException);
      
      // Wait for first backup to complete
      await promise1.catch(() => {}); // Ignore errors from first backup
    }, 10000);

    it('should validate database name format', async () => {
      configService.get.mockReturnValueOnce('postgresql://user:pass@localhost:5432/invalid-db-name!');
      
      await expect(service.executeBackup(mockToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('loadBackupMetadata', () => {
    it('should load backup metadata from file', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: new Date().toISOString(),
          status: 'success',
          fileSize: 1024,
          filePath: '/path/to/backup.dump',
          checksum: 'abc123',
          workspaceId: mockWorkspaceId,
          databaseName: 'testdb',
        },
      ];

      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValueOnce(JSON.stringify(mockBackups));

      const backups = await service.loadBackupMetadata();
      expect(backups).toHaveLength(1);
      expect(backups[0].id).toBe('backup-1');
    });

    it('should return empty array if file does not exist', async () => {
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockRejectedValueOnce({ code: 'ENOENT' });

      const backups = await service.loadBackupMetadata();
      expect(backups).toEqual([]);
    });
  });

  describe('verifyBackup', () => {
    it('should verify backup file integrity', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: new Date().toISOString(),
          status: 'success',
          fileSize: 1024,
          filePath: '/path/to/backup.dump',
          checksum: 'abc123',
          workspaceId: mockWorkspaceId,
          databaseName: 'testdb',
        },
      ];

      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValueOnce(JSON.stringify(mockBackups));
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(Buffer.from('test data'));

      // Mock crypto
      const crypto = require('crypto');
      const originalCreateHash = crypto.createHash;
      jest.spyOn(crypto, 'createHash').mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('abc123'),
      }));

      const isValid = await service.verifyBackup('backup-1');
      expect(isValid).toBe(true);
    });
  });
});

