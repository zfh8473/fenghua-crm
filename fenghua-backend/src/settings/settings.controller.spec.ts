/**
 * Settings Controller Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { AuthService } from '../auth/auth.service';
import { UpdateSettingsDto, SettingsResponseDto, BackupFrequency, LogLevel } from './dto/settings.dto';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: jest.Mocked<SettingsService>;
  let authService: jest.Mocked<AuthService>;

  const mockToken = 'mock-jwt-token';
  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockSettings: SettingsResponseDto = {
    dataRetentionDays: 2555,
    backupFrequency: BackupFrequency.DAILY,
    backupRetentionDays: 30,
    emailNotificationsEnabled: false,
    notificationRecipients: [],
    logLevel: LogLevel.INFO,
  };

  beforeEach(async () => {
    const mockSettingsService = {
      getAllSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const mockAuthService = {
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get(SettingsService);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return all settings', async () => {
      service.getAllSettings.mockResolvedValue(mockSettings);

      const result = await controller.getSettings();

      expect(result).toEqual(mockSettings);
      expect(service.getAllSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSettings', () => {
    it('should update settings and return updated settings', async () => {
      const updateDto: UpdateSettingsDto = {
        dataRetentionDays: 1825,
        backupFrequency: BackupFrequency.WEEKLY,
      };

      const updatedSettings: SettingsResponseDto = {
        ...mockSettings,
        dataRetentionDays: 1825,
        backupFrequency: BackupFrequency.WEEKLY,
      };

      authService.validateToken.mockResolvedValue(mockUser);
      service.updateSettings.mockResolvedValue(updatedSettings);

      const result = await controller.updateSettings(updateDto, mockToken);

      expect(result).toEqual(updatedSettings);
      expect(authService.validateToken).toHaveBeenCalledWith(mockToken);
      expect(service.updateSettings).toHaveBeenCalledWith(updateDto, mockUser.id);
    });

    it('should handle validation errors from service', async () => {
      const updateDto: UpdateSettingsDto = {
        dataRetentionDays: -1, // Invalid value
      };

      authService.validateToken.mockResolvedValue(mockUser);
      service.updateSettings.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.updateSettings(updateDto, mockToken)).rejects.toThrow('Validation failed');
    });
  });
});

