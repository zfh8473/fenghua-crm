/**
 * Authentication Service Unit Tests
 * 
 * Tests for AuthService methods
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Pool, QueryResult } from 'pg';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mockPgPool: any;

  const mockUserId = 'b68e3723-3099-4611-a1b0-d1cea4eef844';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    password_hash: '$2b$10$hashedpassword',
    first_name: 'Test',
    last_name: 'User',
    email_verified: true,
    deleted_at: null,
    roles: [
      { role_id: 'role-1', role_name: 'ADMIN' },
    ],
  };

  beforeEach(async () => {
    // Mock pg.Pool
    mockPgPool = {
      query: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined),
    };

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL') {
          return 'postgresql://user:pass@host:5432/testdb';
        }
        if (key === 'JWT_SECRET') {
          return 'test-jwt-secret';
        }
        if (key === 'JWT_EXPIRES_IN') {
          return '7d';
        }
        return undefined;
      }),
    };

    // Mock JwtService
    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: mockUserId,
        email: 'test@example.com',
        roles: ['ADMIN'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Inject mock pool
    (service as any).pgPool = mockPgPool;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'test123456',
    };

    it('should successfully login with valid credentials', async () => {
      // Mock database query - user query
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      // Mock password verification
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);

      // Mock last login update
      const mockUpdateResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockUpdateResult as QueryResult);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user.role).toBe('ADMIN');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUserId,
        email: 'test@example.com',
        roles: ['ADMIN'],
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password_hash);
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      // Mock database query - no user found
      const mockQueryResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      // Mock database query
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      // Mock password verification - invalid password
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password_hash);
    });

    it('should throw UnauthorizedException when user has no password hash', async () => {
      const userWithoutPassword = {
        ...mockUser,
        password_hash: null,
      };

      // Mock database query
      const mockQueryResult: Partial<QueryResult> = {
        rows: [userWithoutPassword],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null role when user has no roles', async () => {
      const userWithoutRoles = {
        ...mockUser,
        roles: [],
      };

      // Mock database query
      mockPgPool.query.mockResolvedValueOnce({
        rows: [userWithoutRoles],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as any);

      // Mock password verification
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);

      // Mock last login update
      const mockUpdateResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockUpdateResult as QueryResult);

      const result = await service.login(loginDto);

      expect(result.user.role).toBeNull();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUserId,
        email: 'test@example.com',
        roles: [],
      });
    });
  });

  describe('validateToken', () => {
    const mockToken = 'valid-jwt-token';

    it('should validate token and return user info', async () => {
      // Mock database query
      const mockQueryResult: Partial<QueryResult> = {
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.validateToken(mockToken);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result.role).toBe('ADMIN');
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken);
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      // Mock JWT verification failure
      jwtService.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(mockToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Mock database query - no user found
      const mockQueryResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      await expect(service.validateToken(mockToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should return null role when user has no roles', async () => {
      const userWithoutRoles = {
        ...mockUser,
        roles: [],
      };

      // Mock database query
      const mockQueryResult: Partial<QueryResult> = {
        rows: [userWithoutRoles],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      const result = await service.validateToken(mockToken);

      expect(result.role).toBeNull();
      expect(result.roles).toEqual([]);
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register new user', async () => {
      // Mock user existence check - user doesn't exist
      const mockCheckResult: Partial<QueryResult> = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockCheckResult as QueryResult);

      // Mock password hashing
      mockedBcrypt.hash.mockResolvedValueOnce('$2b$10$hashedpassword' as never);

      // Mock user creation
      const mockInsertResult: Partial<QueryResult> = {
        rows: [{
          id: 'new-user-id',
          email: registerData.email,
          first_name: registerData.firstName,
          last_name: registerData.lastName,
          email_verified: false,
        }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockInsertResult as QueryResult);

      const result = await service.register(registerData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.role).toBeNull(); // New users have no roles
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw ConflictException when user already exists', async () => {
      // Mock user existence check - user exists
      const mockQueryResult: Partial<QueryResult> = {
        rows: [{ id: 'existing-user-id' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPgPool.query.mockResolvedValueOnce(mockQueryResult as QueryResult);

      await expect(service.register(registerData)).rejects.toThrow(ConflictException);
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const mockToken = 'token-to-logout';
      await expect(service.logout(mockToken)).resolves.not.toThrow();
    });
  });
});



