/**
 * Users Service Unit Tests
 * 
 * Tests for UsersService methods
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Pool, QueryResult } from 'pg';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let configService: jest.Mocked<ConfigService>;
  let mockPgPool: any;

  const mockUserId = 'b68e3723-3099-4611-a1b0-d1cea4eef844';
  const mockRoleId = 'role-123';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
    deleted_at: null,
    roles: [
      { role_id: mockRoleId, role_name: 'ADMIN' },
    ],
  };

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    configService = module.get(ConfigService);

    // Inject mock pool
    (service as any).pgPool = mockPgPool;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
      });
    });

    it('should filter users by role', async () => {
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.findAll('ADMIN');

      expect(result).toHaveLength(1);
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND r.name = $1'),
        ['ADMIN']
      );
    });

    it('should search users by email or name', async () => {
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.findAll(undefined, 'test');

      expect(result).toHaveLength(1);
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        ['%test%']
      );
    });

    it('should return empty array when no users found', async () => {
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

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.findOne(mockUserId);

      expect(result).toMatchObject({
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockQueryResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.ADMIN,
    };

    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPgPool.connect.mockResolvedValue(mockClient);
    });

    it('should create a new user with role', async () => {
      // Mock transaction queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [{ id: mockRoleId }] }) // Get role
        .mockResolvedValueOnce({ rows: [{ id: mockUserId, email: createUserDto.email, first_name: createUserDto.firstName, last_name: createUserDto.lastName, created_at: new Date(), updated_at: new Date() }] }) // Create user
        .mockResolvedValueOnce({ rows: [] }); // Assign role

      // Mock password hashing
      mockedBcrypt.hash.mockResolvedValueOnce('$2b$10$hashedpassword' as never);

      const result = await service.create(createUserDto);

      expect(result).toMatchObject({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw ConflictException if user already exists', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] }); // Existing user

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [] }); // Role not found

      await expect(service.create(createUserDto)).rejects.toThrow(NotFoundException);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      role: UserRole.DIRECTOR,
    };

    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPgPool.connect.mockResolvedValue(mockClient);

      // Mock findOne (called at start of update)
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);
    });

    it('should update user information', async () => {
      // Mock transaction queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: mockUserId }] }) // Update user
        .mockResolvedValueOnce({ rows: [{ id: 'role-2' }] }) // Get role
        .mockResolvedValueOnce({ rows: [] }) // Delete old roles
        .mockResolvedValueOnce({ rows: [] }); // Assign new role

      // Mock findOne (called at end of update)
      const mockQueryResult: Partial<QueryResult> = {
        rows: [{
          ...mockUser,
          first_name: updateUserDto.firstName,
          last_name: updateUserDto.lastName,
          roles: [{ role_id: 'role-2', role_name: 'DIRECTOR' }],
        }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.update(mockUserId, updateUserDto);

      expect(result.firstName).toBe(updateUserDto.firstName);
      expect(result.lastName).toBe(updateUserDto.lastName);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException if user not found', async () => {
      // Mock findOne() call - user not found
      const mockQueryResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      // findOne() uses this.pgPool.query, so we need to mock it
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      await expect(service.update('non-existent-id', updateUserDto)).rejects.toThrow(NotFoundException);
      
      // Verify that findOne was called (which uses pgPool.query)
      expect(mockPgPool.query).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if trying to delete self', async () => {
      await expect(
        service.remove(mockUserId, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.remove(mockUserId, mockUserId),
      ).rejects.toThrow('不能删除自己的账户');
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockQueryResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      await expect(
        service.remove('non-existent-id', 'other-user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should soft delete user successfully', async () => {
      // Mock findOne (called at start of remove)
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query
        .mockResolvedValueOnce(mockQueryResult as QueryResult) // findOne
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as QueryResult); // Update deleted_at

      await service.remove(mockUserId, 'other-user-id');

      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET deleted_at'),
        [mockUserId]
      );
    });
  });
});
