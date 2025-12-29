/**
 * Users Controller Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AuthService } from '../auth/auth.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockToken = 'mock-jwt-token';
  const mockUser: UserResponseDto = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    const mockUsersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockAuthService = {
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers: UserResponseDto[] = [mockUser];
      service.findAll.mockResolvedValue(mockUsers);

      const mockRequest: any = {
        query: {},
      };

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should filter by role when role query param is provided', async () => {
      const mockUsers: UserResponseDto[] = [mockUser];
      service.findAll.mockResolvedValue(mockUsers);

      const mockRequest: any = {
        query: { role: 'ADMIN' },
      };

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalledWith('ADMIN', undefined);
    });

    it('should search when search query param is provided', async () => {
      const mockUsers: UserResponseDto[] = [mockUser];
      service.findAll.mockResolvedValue(mockUsers);

      const mockRequest: any = {
        query: { search: 'test' },
      };

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalledWith(undefined, 'test');
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        role: UserRole.FRONTEND_SPECIALIST,
      };

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        firstName: 'Updated',
      };

      const updatedUser: UserResponseDto = {
        ...mockUser,
        email: updateUserDto.email,
        firstName: updateUserDto.firstName,
      };

      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser.id, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const mockRequest = {
        user: {
          id: 'current-user-id',
        },
      };

      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockUser.id, mockRequest as any);

      expect(service.remove).toHaveBeenCalledWith(
        mockUser.id,
        mockRequest.user.id,
      );
    });
  });
});

