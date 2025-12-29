/**
 * Roles Service Unit Tests
 * 
 * Tests for RolesService methods
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RolesService } from './roles.service';
import { AuditService } from '../audit/audit.service';
import { PermissionService } from '../permission/permission.service';
import { UserRole } from '../users/dto/create-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Pool, QueryResult } from 'pg';

describe('RolesService', () => {
  let service: RolesService;
  let configService: jest.Mocked<ConfigService>;
  let auditService: jest.Mocked<AuditService>;
  let permissionService: jest.Mocked<PermissionService>;
  let mockPgPool: any;

  const mockUserId = 'b68e3723-3099-4611-a1b0-d1cea4eef844';
  const mockRoleId = 'role-123';
  const mockOperatorId = 'operator-123';

  beforeEach(async () => {
    // Mock pg.Pool
    mockPgPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined),
    };

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL') {
          return 'postgresql://user:pass@host:5432/testdb';
        }
        return undefined;
      }),
    };

    // Mock AuditService
    const mockAuditService = {
      logRoleChange: jest.fn().mockResolvedValue(undefined),
    };

    // Mock PermissionService
    const mockPermissionService = {
      invalidateUserCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    configService = module.get(ConfigService);
    auditService = module.get(AuditService);
    permissionService = module.get(PermissionService);

    // Inject mock pool
    (service as any).pgPool = mockPgPool;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: mockRoleId, name: 'ADMIN', description: 'Administrator role' },
        { id: 'role-2', name: 'DIRECTOR', description: 'Director role' },
      ];

      const mockQueryResult: Partial<QueryResult> = {
        rows: mockRoles,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: mockRoleId,
        name: 'ADMIN',
        description: 'Administrator role',
      });
    });

    it('should return empty array when no roles found', async () => {
      const mockQueryResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserRole', () => {
    it('should return user role successfully', async () => {
      // Mock user check
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ id: mockUserId }],
      } as QueryResult);

      // Mock role query
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: mockUserId,
          role_id: mockRoleId,
          assigned_at: new Date('2025-01-01T00:00:00Z'),
          role_name: 'ADMIN',
        }],
      } as QueryResult);

      const result = await service.getUserRole(mockUserId);

      expect(result).toMatchObject({
        userId: mockUserId,
        role: UserRole.ADMIN,
        roleId: mockRoleId,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      } as QueryResult);

      await expect(service.getUserRole(mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no role assigned', async () => {
      // Mock user check
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ id: mockUserId }],
      } as QueryResult);

      // Mock role query - no roles
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      } as QueryResult);

      await expect(service.getUserRole(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      role: UserRole.ADMIN,
      reason: 'Test assignment',
    };

    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPgPool.connect.mockResolvedValue(mockClient);
    });

    it('should successfully assign role to user', async () => {
      // Mock transaction queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: mockUserId }] }) // User check
        .mockResolvedValueOnce({ rows: [{ id: mockRoleId, name: 'ADMIN' }] }) // Get role
        .mockResolvedValueOnce({ rows: [] }) // Old role query (no old role)
        .mockResolvedValueOnce({ rows: [] }) // Delete old roles
        .mockResolvedValueOnce({ rows: [{ assigned_at: new Date() }] }); // Insert new role

      const result = await service.assignRole(mockUserId, assignRoleDto, mockOperatorId);

      expect(result).toMatchObject({
        userId: mockUserId,
        role: UserRole.ADMIN,
        roleId: mockRoleId,
        assignedBy: mockOperatorId,
      });
      expect(auditService.logRoleChange).toHaveBeenCalled();
      expect(permissionService.invalidateUserCache).toHaveBeenCalledWith(mockUserId);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // User check - not found

      await expect(service.assignRole(mockUserId, assignRoleDto, mockOperatorId)).rejects.toThrow(NotFoundException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw NotFoundException when role not found', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: mockUserId }] }) // User check
        .mockResolvedValueOnce({ rows: [] }); // Role not found

      await expect(service.assignRole(mockUserId, assignRoleDto, mockOperatorId)).rejects.toThrow(NotFoundException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('removeRole', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPgPool.connect.mockResolvedValue(mockClient);
    });

    it('should successfully remove role from user', async () => {
      // Mock transaction queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: mockUserId }] }) // User check
        .mockResolvedValueOnce({ rows: [{ role_name: 'ADMIN' }] }) // Old role query
        .mockResolvedValueOnce({ rows: [] }); // Delete role

      await service.removeRole(mockUserId, mockOperatorId);

      expect(auditService.logRoleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          oldRole: 'ADMIN',
          newRole: 'NONE',
          userId: mockUserId,
          operatorId: mockOperatorId,
        })
      );
      expect(permissionService.invalidateUserCache).toHaveBeenCalledWith(mockUserId);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Mock BEGIN and user check - user not found
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // User check - not found

      await expect(service.removeRole(mockUserId, mockOperatorId)).rejects.toThrow(NotFoundException);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException when no role assigned', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: mockUserId }] }) // User check
        .mockResolvedValueOnce({ rows: [] }); // No old role

      await expect(service.removeRole(mockUserId, mockOperatorId)).rejects.toThrow(NotFoundException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('invalidateCaches', () => {
    it('should invalidate permission cache', () => {
      service.invalidateCaches(mockUserId);
      expect(permissionService.invalidateUserCache).toHaveBeenCalledWith(mockUserId);
    });
  });
});
