/**
 * Settings Service Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto, DEFAULT_SETTINGS, BackupFrequency, LogLevel } from './dto/settings.dto';
import { NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
      logRoleChange: jest.fn().mockResolvedValue(undefined),
      getUserAuditLogs: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
  });

  describe('getAllSettings', () => {
    it('should return all default settings', async () => {
      const settings = await service.getAllSettings();

      expect(settings.dataRetentionDays).toBe(DEFAULT_SETTINGS.dataRetentionDays);
      expect(settings.backupFrequency).toBe(DEFAULT_SETTINGS.backupFrequency);
      expect(settings.backupRetentionDays).toBe(DEFAULT_SETTINGS.backupRetentionDays);
      expect(settings.emailNotificationsEnabled).toBe(DEFAULT_SETTINGS.emailNotificationsEnabled);
      expect(settings.notificationRecipients).toEqual(DEFAULT_SETTINGS.notificationRecipients);
      expect(settings.logLevel).toBe(DEFAULT_SETTINGS.logLevel);
    });

    it('should return updated settings after modification', async () => {
      const updateDto: UpdateSettingsDto = {
        dataRetentionDays: 1825,
        backupFrequency: BackupFrequency.WEEKLY,
      };

      await service.updateSettings(updateDto, 'operator-123');
      const settings = await service.getAllSettings();

      expect(settings.dataRetentionDays).toBe(1825);
      expect(settings.backupFrequency).toBe(BackupFrequency.WEEKLY);
    });
  });

  describe('getSetting', () => {
    it('should return default value for existing setting key', async () => {
      const value = await service.getSetting('dataRetentionDays');
      expect(value).toBe(DEFAULT_SETTINGS.dataRetentionDays);
    });

    it('should return updated value after modification', async () => {
      await service.updateSettings({ dataRetentionDays: 1825 }, 'operator-123');
      const value = await service.getSetting('dataRetentionDays');
      expect(value).toBe(1825);
    });

    it('should throw NotFoundException for non-existent setting key', async () => {
      await expect(service.getSetting('nonExistentKey')).rejects.toThrow(NotFoundException);
      await expect(service.getSetting('nonExistentKey')).rejects.toThrow('Setting nonExistentKey not found');
    });
  });

  describe('updateSettings', () => {
    it('should update single setting and log audit', async () => {
      const updateDto: UpdateSettingsDto = {
        dataRetentionDays: 1825,
      };

      const result = await service.updateSettings(updateDto, 'operator-123');

      expect(result.dataRetentionDays).toBe(1825);
      expect(auditService.log).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SETTING_UPDATE',
          entityType: 'SYSTEM_SETTINGS',
          entityId: 'dataRetentionDays',
          oldValue: DEFAULT_SETTINGS.dataRetentionDays,
          newValue: 1825,
          operatorId: 'operator-123',
        }),
      );
    });

    it('should update multiple settings and log audit for each', async () => {
      const updateDto: UpdateSettingsDto = {
        dataRetentionDays: 1825,
        backupFrequency: BackupFrequency.WEEKLY,
        logLevel: LogLevel.DEBUG,
      };

      const result = await service.updateSettings(updateDto, 'operator-123');

      expect(result.dataRetentionDays).toBe(1825);
      expect(result.backupFrequency).toBe(BackupFrequency.WEEKLY);
      expect(result.logLevel).toBe(LogLevel.DEBUG);
      expect(auditService.log).toHaveBeenCalledTimes(3);
    });

    it('should handle audit log failure gracefully', async () => {
      auditService.log.mockRejectedValueOnce(new Error('Audit log failed'));

      const updateDto: UpdateSettingsDto = {
        dataRetentionDays: 1825,
      };

      // Should not throw error, but log the failure
      const result = await service.updateSettings(updateDto, 'operator-123');

      expect(result.dataRetentionDays).toBe(1825);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should update notification recipients array', async () => {
      const updateDto: UpdateSettingsDto = {
        notificationRecipients: ['admin@example.com', 'user@example.com'],
      };

      const result = await service.updateSettings(updateDto, 'operator-123');

      expect(result.notificationRecipients).toEqual(['admin@example.com', 'user@example.com']);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should not update settings that are not provided', async () => {
      const updateDto: UpdateSettingsDto = {
        dataRetentionDays: 1825,
      };

      const result = await service.updateSettings(updateDto, 'operator-123');

      expect(result.dataRetentionDays).toBe(1825);
      expect(result.backupFrequency).toBe(DEFAULT_SETTINGS.backupFrequency);
      expect(result.backupRetentionDays).toBe(DEFAULT_SETTINGS.backupRetentionDays);
    });
  });

  describe('clearCache', () => {
    it('should clear cache and reinitialize defaults', () => {
      service.clearCache();
      // Cache should be cleared and reinitialized
      // This is tested indirectly through getAllSettings
      expect(service.getAllSettings()).resolves.toBeDefined();
    });
  });
});

