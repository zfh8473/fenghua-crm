/**
 * Permission Service Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PermissionService, Permission } from './permission.service';
import { AuthService } from '../auth/auth.service';
import { PermissionAuditService } from './permission-audit.service';
import { UserRole } from '../users/dto/create-user.dto';

describe('PermissionService', () => {
  let service: PermissionService;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;
  let permissionAuditService: jest.Mocked<PermissionAuditService>;

  const mockToken = 'mock-token';
  const mockUserId = 'e1523409-53b9-484b-b920-baf9d2ea1152';

  beforeEach(async () => {
    const mockAuthService = {
      validateToken: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        // Default: permission verification logging is disabled
        if (key === 'AUDIT_LOG_PERMISSION_VERIFICATION_ENABLED' || key === 'auditLogPermissionVerificationEnabled') {
          return defaultValue !== undefined ? defaultValue : false;
        }
        return defaultValue;
      }),
    };

    const mockPermissionAuditService = {
      logPermissionVerification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PermissionAuditService,
          useValue: mockPermissionAuditService,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
    permissionAuditService = module.get(PermissionAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return permissions for ADMIN role', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const permissions = await service.getUserPermissions(mockToken);

      expect(permissions).toContain(Permission.MANAGE_USERS);
      expect(permissions).toContain(Permission.MANAGE_SYSTEM);
      expect(permissions).toContain(Permission.EXPORT_DATA);
      expect(permissions).toContain(Permission.ACCESS_ALL_CUSTOMERS);
    });

    it('should return permissions for FRONTEND_SPECIALIST role', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });

      const permissions = await service.getUserPermissions(mockToken);

      expect(permissions).toContain(Permission.ACCESS_BUYERS);
      expect(permissions).not.toContain(Permission.ACCESS_SUPPLIERS);
      expect(permissions).not.toContain(Permission.MANAGE_USERS);
    });

    it('should return empty array when user has no role', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'user@test.com',
        role: null,
      });

      const permissions = await service.getUserPermissions(mockToken);

      expect(permissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const hasPermission = await service.hasPermission(mockToken, Permission.MANAGE_USERS);

      expect(hasPermission).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });

      const hasPermission = await service.hasPermission(mockToken, Permission.MANAGE_USERS);

      expect(hasPermission).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('should return true for ADMIN accessing buyers', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const canAccess = await service.canAccess(mockToken, 'buyer');

      expect(canAccess).toBe(true);
    });

    it('should return false for FRONTEND_SPECIALIST accessing suppliers', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });

      const canAccess = await service.canAccess(mockToken, 'supplier');

      expect(canAccess).toBe(false);
    });
  });

  describe('getDataAccessFilter', () => {
    it('should return null for ADMIN (access all)', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const filter = await service.getDataAccessFilter(mockToken);

      expect(filter).toBeNull();
    });

    it('should return buyer filter for FRONTEND_SPECIALIST', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });

      const filter = await service.getDataAccessFilter(mockToken);

      expect(filter).toEqual({ customerType: 'buyer' });
    });

    it('should return supplier filter for BACKEND_SPECIALIST', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'backend@test.com',
        role: 'BACKEND_SPECIALIST',
      });

      const filter = await service.getDataAccessFilter(mockToken);

      expect(filter).toEqual({ customerType: 'supplier' });
    });

    it('should not log permission verification when disabled', async () => {
      configService.get.mockReturnValue(false); // Disabled
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      await service.getDataAccessFilter(mockToken);

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(permissionAuditService.logPermissionVerification).not.toHaveBeenCalled();
    });

    it('should log permission verification when enabled', async () => {
      configService.get.mockReturnValue(true); // Enabled
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'frontend@test.com',
        role: 'FRONTEND_SPECIALIST',
      });

      await service.getDataAccessFilter(mockToken);

      // Wait a bit for async operations (setImmediate)
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(permissionAuditService.logPermissionVerification).toHaveBeenCalledWith(
        mockToken,
        'CUSTOMER',
        null,
        'GRANTED',
        'BUYER',
        null,
        true,
      );
    });

    it('should log DENIED when user has no access', async () => {
      configService.get.mockReturnValue(true); // Enabled
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'user@test.com',
        role: null, // No role = no access
      });

      await service.getDataAccessFilter(mockToken);

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(permissionAuditService.logPermissionVerification).toHaveBeenCalledWith(
        mockToken,
        'CUSTOMER',
        null,
        'DENIED',
        null,
        null,
        true,
      );
    });
  });

  describe('invalidateUserCache', () => {
    it('should invalidate cache for user', async () => {
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      // First call - should cache
      await service.getUserPermissions(mockToken);

      // Invalidate
      service.invalidateUserCache(mockUserId);

      // Second call - should not use cache (will call validateToken again)
      authService.validateToken.mockResolvedValueOnce({
        id: mockUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      await service.getUserPermissions(mockToken);

      // Should have been called twice (cache was invalidated)
      expect(authService.validateToken).toHaveBeenCalledTimes(2);
    });
  });
});

