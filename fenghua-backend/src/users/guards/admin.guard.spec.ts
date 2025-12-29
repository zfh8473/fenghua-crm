/**
 * Admin Guard Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../dto/create-user.dto';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let authService: jest.Mocked<AuthService>;

  const mockToken = 'mock-jwt-token';
  const mockAdminUser = {
    id: 'user-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockNonAdminUser = {
    id: 'user-456',
    email: 'user@example.com',
    role: UserRole.FRONTEND_SPECIALIST,
  };

  const createMockContext = (authHeader: string, user?: any) => {
    const request = {
      headers: {
        authorization: authHeader,
      },
      user: user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const mockAuthService = {
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for admin user', async () => {
      const context = createMockContext(`Bearer ${mockToken}`);
      authService.validateToken.mockResolvedValue(mockAdminUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(authService.validateToken).toHaveBeenCalledWith(mockToken);
    });

    it('should deny access for non-admin user', async () => {
      const context = createMockContext(`Bearer ${mockToken}`);
      authService.validateToken.mockResolvedValue(mockNonAdminUser);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Only administrators can access this resource',
      );
    });

    it('should deny access when authorization header is missing', async () => {
      const context = createMockContext('');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header not found',
      );
    });

    it('should deny access when authorization header format is invalid', async () => {
      const context = createMockContext('InvalidFormat token');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid authorization header format',
      );
    });

    it('should deny access when token is invalid', async () => {
      const context = createMockContext(`Bearer ${mockToken}`);
      authService.validateToken.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired token',
      );
    });

    it('should handle lowercase admin role', async () => {
      const context = createMockContext(`Bearer ${mockToken}`);
      const lowercaseAdminUser = {
        ...mockAdminUser,
        role: 'admin',
      };
      authService.validateToken.mockResolvedValue(lowercaseAdminUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should attach user to request', async () => {
      const context = createMockContext(`Bearer ${mockToken}`);
      authService.validateToken.mockResolvedValue(mockAdminUser);

      await guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual(mockAdminUser);
    });
  });
});

