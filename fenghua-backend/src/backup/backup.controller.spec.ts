/**
 * Backup Controller Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupStatusService } from './backup-status.service';
import { AdminGuard } from '../users/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

describe('BackupController', () => {
  let controller: BackupController;
  let backupService: jest.Mocked<BackupService>;
  let backupStatusService: jest.Mocked<BackupStatusService>;

  beforeEach(async () => {
    const mockBackupService = {
      executeBackup: jest.fn(),
      loadBackupMetadata: jest.fn(),
    };

    const mockBackupStatusService = {
      getBackupStatus: jest.fn(),
      getBackupHistory: jest.fn(),
      getBackupDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
        {
          provide: BackupStatusService,
          useValue: mockBackupStatusService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BackupController>(BackupController);
    backupService = module.get(BackupService);
    backupStatusService = module.get(BackupStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return backup status', async () => {
      const mockStatus = {
        lastBackupTime: new Date(),
        lastBackupStatus: 'success' as const,
        lastBackupFileSize: 1024,
      };
      backupStatusService.getBackupStatus.mockResolvedValueOnce(mockStatus);

      const result = await controller.getStatus();
      expect(result).toEqual(mockStatus);
      expect(backupStatusService.getBackupStatus).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return backup history with validation', async () => {
      const mockQuery = {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        limit: 50,
        offset: 0,
      };
      const mockHistory = {
        backups: [],
        total: 0,
        limit: 50,
        offset: 0,
      };
      backupStatusService.getBackupHistory.mockResolvedValueOnce(mockHistory);

      const result = await controller.getHistory(mockQuery);
      expect(result).toEqual(mockHistory);
      expect(backupStatusService.getBackupHistory).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('createBackup', () => {
    it('should trigger manual backup', async () => {
      const mockToken = 'test-token';
      const mockBackup = {
        id: 'backup-123',
        timestamp: new Date(),
        status: 'success' as const,
        fileSize: 1024,
        filePath: '/path/to/backup.dump',
        checksum: 'abc123',
        workspaceId: 'workspace-123',
        databaseName: 'testdb',
      };
      backupService.executeBackup.mockResolvedValueOnce(mockBackup);

      const result = await controller.createBackup(mockToken);
      expect(result).toEqual(mockBackup);
      expect(backupService.executeBackup).toHaveBeenCalledWith(mockToken);
    });
  });
});

