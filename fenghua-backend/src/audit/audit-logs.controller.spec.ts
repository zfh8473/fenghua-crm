/**
 * Audit Logs Controller Unit Tests
 * 
 * Tests for audit log query functionality
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditService } from './audit.service';
import { UsersService } from '../users/users.service';
import { AuditLogDto } from './dto/audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let auditService: jest.Mocked<AuditService>;
  let usersService: jest.Mocked<UsersService>;

  const mockAuditLog: AuditLogDto = {
    action: 'ROLE_CHANGE',
    entityType: 'USER',
    entityId: 'user-id-123',
    oldValue: 'FRONTEND_SPECIALIST',
    newValue: 'DIRECTOR',
    userId: 'user-id-123',
    operatorId: 'operator-id-456',
    timestamp: new Date('2025-01-03T10:00:00Z'),
    reason: 'Role reassignment',
    metadata: {},
  };

  const mockPermissionViolationLog: AuditLogDto = {
    action: 'PERMISSION_VIOLATION',
    entityType: 'CUSTOMER',
    entityId: 'customer-id-123',
    userId: 'user-id-789',
    operatorId: 'user-id-789',
    timestamp: new Date('2025-01-03T11:00:00Z'),
    metadata: {
      userRole: 'FRONTEND_SPECIALIST',
      attemptedAction: 'ACCESS',
      resourceType: 'CUSTOMER',
      expectedType: 'BUYER',
      actualType: 'SUPPLIER',
      result: 'DENIED',
    },
  };

  beforeEach(async () => {
    const mockAuditService = {
      getAuditLogs: jest.fn(),
    };

    const mockUsersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
    auditService = module.get(AuditService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    const mockToken = 'mock-jwt-token';

    it('should return audit logs without filters', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockResolvedValue({
        id: 'operator-id-456',
        email: 'operator@example.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs({}, mockToken);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].action).toBe('ROLE_CHANGE');
      expect(result.data[0].operatorEmail).toBe('operator@example.com');
      expect(auditService.getAuditLogs).toHaveBeenCalledWith({}, { page: undefined, limit: undefined });
    });

    it('should filter by action type (ROLE_CHANGE)', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockResolvedValue({
        id: 'operator-id-456',
        email: 'operator@example.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs({ action: 'ROLE_CHANGE' }, mockToken);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].action).toBe('ROLE_CHANGE');
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        { action: 'ROLE_CHANGE' },
        { page: undefined, limit: undefined },
      );
    });

    it('should filter by action type (PERMISSION_VIOLATION)', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockPermissionViolationLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockResolvedValue({
        id: 'user-id-789',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Name',
        role: 'FRONTEND_SPECIALIST',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs({ action: 'PERMISSION_VIOLATION' }, mockToken);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].action).toBe('PERMISSION_VIOLATION');
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        { action: 'PERMISSION_VIOLATION' },
        { page: undefined, limit: undefined },
      );
    });

    it('should filter by operatorId', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockResolvedValue({
        id: 'operator-id-456',
        email: 'operator@example.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs({ operatorId: 'operator-id-456' }, mockToken);

      expect(result.data).toHaveLength(1);
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        { operatorId: 'operator-id-456' },
        { page: undefined, limit: undefined },
      );
    });

    it('should filter by operatorEmail', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      const result = await controller.getAuditLogs({ operatorEmail: 'operator@example.com' }, mockToken);

      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        { operatorEmail: 'operator@example.com' },
        { page: undefined, limit: undefined },
      );
    });

    it('should filter by time range (startDate and endDate)', async () => {
      const startDate = '2025-01-01T00:00:00Z';
      const endDate = '2025-01-31T23:59:59Z';

      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockResolvedValue({
        id: 'operator-id-456',
        email: 'operator@example.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs({ startDate, endDate }, mockToken);

      expect(result.data).toHaveLength(1);
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        { page: undefined, limit: undefined },
      );
    });

    it('should support pagination', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 100,
        page: 2,
        limit: 10,
        totalPages: 10,
      });

      usersService.findOne.mockResolvedValue({
        id: 'operator-id-456',
        email: 'operator@example.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs({ page: 2, limit: 10 }, mockToken);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(10);
      expect(auditService.getAuditLogs).toHaveBeenCalledWith({}, { page: 2, limit: 10 });
    });

    it('should handle multiple filters combined', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockResolvedValue({
        id: 'operator-id-456',
        email: 'operator@example.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs(
        {
          action: 'ROLE_CHANGE',
          operatorId: 'operator-id-456',
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
        },
        mockToken,
      );

      expect(result.data).toHaveLength(1);
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        {
          action: 'ROLE_CHANGE',
          operatorId: 'operator-id-456',
          startDate: new Date('2025-01-01T00:00:00Z'),
          endDate: new Date('2025-01-31T23:59:59Z'),
        },
        { page: undefined, limit: undefined },
      );
    });

    it('should handle empty results', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });

      const result = await controller.getAuditLogs({ action: 'NON_EXISTENT_ACTION' }, mockToken);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(
        { action: 'NON_EXISTENT_ACTION' },
        { page: undefined, limit: undefined },
      );
    });

    it('should enrich logs with operator email', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog, mockPermissionViolationLog],
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne
        .mockResolvedValueOnce({
          id: 'operator-id-456',
          email: 'operator@example.com',
          firstName: 'Operator',
          lastName: 'User',
          role: 'ADMIN',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        })
        .mockResolvedValueOnce({
          id: 'user-id-789',
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
          role: 'FRONTEND_SPECIALIST',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        });

      const result = await controller.getAuditLogs({}, mockToken);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].operatorEmail).toBe('operator@example.com');
      expect(result.data[1].operatorEmail).toBe('user@example.com');
    });

    it('should handle operator email lookup failure gracefully', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockRejectedValue(new Error('User not found'));

      const result = await controller.getAuditLogs({}, mockToken);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].operatorEmail).toBeUndefined();
      // Should not throw error
    });

    it('should return all required fields in response', async () => {
      auditService.getAuditLogs.mockResolvedValue({
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      usersService.findOne.mockResolvedValue({
        id: 'operator-id-456',
        email: 'operator@example.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });

      const result = await controller.getAuditLogs({}, mockToken);

      expect(result.data[0]).toHaveProperty('action');
      expect(result.data[0]).toHaveProperty('entityType');
      expect(result.data[0]).toHaveProperty('entityId');
      expect(result.data[0]).toHaveProperty('userId');
      expect(result.data[0]).toHaveProperty('operatorId');
      expect(result.data[0]).toHaveProperty('operatorEmail');
      expect(result.data[0]).toHaveProperty('timestamp');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
    });
  });
});

