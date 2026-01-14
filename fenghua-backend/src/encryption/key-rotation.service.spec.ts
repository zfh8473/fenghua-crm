/**
 * Key Rotation Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KeyRotationService } from './key-rotation.service';
import { KeyManagementService } from './key-management.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

describe('KeyRotationService', () => {
  let service: KeyRotationService;
  let keyManagementService: jest.Mocked<KeyManagementService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockKeyManagementService = {
      rotateKey: jest.fn(),
      listKeys: jest.fn(),
      getActiveKeyVersion: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn(),
    };

    const mockAuthService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyRotationService,
        {
          provide: KeyManagementService,
          useValue: mockKeyManagementService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_KEY_ROTATION_DAYS') {
                return '90';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<KeyRotationService>(KeyRotationService);
    keyManagementService = module.get(KeyManagementService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rotateKey', () => {
    it('should rotate key successfully', async () => {
      keyManagementService.rotateKey.mockResolvedValue({
        newVersion: 2,
        oldVersion: 1,
      });
      auditService.log.mockResolvedValue(undefined);

      const result = await service.rotateKey('user-id-123', '127.0.0.1', 'test-agent');

      expect(result.newVersion).toBe(2);
      expect(result.oldVersion).toBe(1);
      expect(keyManagementService.rotateKey).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'KEY_ROTATION',
          entityType: 'ENCRYPTION_KEY',
        }),
      );
    });

    it('should handle rotation without user info', async () => {
      keyManagementService.rotateKey.mockResolvedValue({
        newVersion: 1,
        oldVersion: null,
      });

      const result = await service.rotateKey();

      expect(result.newVersion).toBe(1);
      expect(result.oldVersion).toBeNull();
    });
  });

  describe('shouldRotateKey', () => {
    it('should return true if no active key exists', async () => {
      keyManagementService.listKeys.mockResolvedValue([]);

      const shouldRotate = await service.shouldRotateKey();

      expect(shouldRotate).toBe(true);
    });

    it('should return false if key age is less than rotation period', async () => {
      const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      keyManagementService.listKeys.mockResolvedValue([
        {
          id: 'key-1',
          version: 1,
          key: Buffer.from('test'),
          isActive: true,
          createdAt: recentDate,
          rotatedAt: null,
        },
      ]);

      const shouldRotate = await service.shouldRotateKey();

      expect(shouldRotate).toBe(false);
    });

    it('should return true if key age exceeds rotation period', async () => {
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
      keyManagementService.listKeys.mockResolvedValue([
        {
          id: 'key-1',
          version: 1,
          key: Buffer.from('test'),
          isActive: true,
          createdAt: oldDate,
          rotatedAt: null,
        },
      ]);

      const shouldRotate = await service.shouldRotateKey();

      expect(shouldRotate).toBe(true);
    });
  });
});
