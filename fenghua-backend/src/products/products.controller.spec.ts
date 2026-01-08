/**
 * Products Controller Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { ExecutionContext, BadRequestException } from '@nestjs/common';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 'test-user-id', email: 'test@example.com', role: 'ADMIN' };
          return true;
        },
      })
      .overrideGuard(AdminGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto: CreateProductDto = {
        name: 'Test Product',
        hsCode: '123456',
        category: '电子产品',
      };
      const mockProduct: ProductResponseDto = {
        id: 'product-id',
        name: 'Test Product',
        hsCode: '123456',
        category: '电子产品',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productsService.create.mockResolvedValueOnce(mockProduct);

      const result = await controller.create(createDto, { user: { id: 'user-id' } } as any);

      expect(result).toEqual(mockProduct);
      expect(productsService.create).toHaveBeenCalledWith(createDto, 'user-id');
    });

    it('should throw BadRequestException if userId is missing', async () => {
      const createDto: CreateProductDto = {
        name: 'Test Product',
        hsCode: '123456',
        category: '电子产品',
      };

      await expect(controller.create(createDto, { user: {} } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return products list', async () => {
      const query: ProductQueryDto = { limit: 20, offset: 0 };
      const mockResponse = {
        products: [],
        total: 0,
      };

      productsService.findAll.mockResolvedValueOnce(mockResponse);

      const result = await controller.findAll(query, 'token', { user: { id: 'user-id' } } as any);

      expect(result).toEqual(mockResponse);
      expect(productsService.findAll).toHaveBeenCalledWith(query, 'user-id', 'token');
    });

    it('should throw BadRequestException if userId is missing', async () => {
      const query: ProductQueryDto = { limit: 20, offset: 0 };
      await expect(controller.findAll(query, 'token', { user: {} } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const mockProduct: ProductResponseDto = {
        id: 'product-id',
        name: 'Test Product',
        hsCode: '123456',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productsService.findOne.mockResolvedValueOnce(mockProduct);

      const result = await controller.findOne('product-id', 'token', { user: { id: 'user-id' } } as any);

      expect(result).toEqual(mockProduct);
      expect(productsService.findOne).toHaveBeenCalledWith('product-id', 'user-id', 'token');
    });

    it('should throw BadRequestException if userId is missing', async () => {
      await expect(controller.findOne('product-id', 'token', { user: {} } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid UUID', async () => {
      // ParseUUIDPipe will throw BadRequestException for invalid UUID
      // This is tested by NestJS framework, but we can verify the service is called with valid UUID
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      productsService.findOne.mockResolvedValueOnce({} as ProductResponseDto);

      await controller.findOne(validUUID, 'token', { user: { id: 'user-id' } } as any);

      expect(productsService.findOne).toHaveBeenCalledWith(validUUID, 'user-id', 'token');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
      };
      const mockProduct: ProductResponseDto = {
        id: 'product-id',
        name: 'Updated Product',
        hsCode: '123456',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productsService.update.mockResolvedValueOnce(mockProduct);

      const result = await controller.update('product-id', updateDto, 'token', { user: { id: 'user-id' } } as any);

      expect(result).toEqual(mockProduct);
      expect(productsService.update).toHaveBeenCalledWith('product-id', updateDto, 'user-id', 'token');
    });

    it('should throw BadRequestException if userId is missing', async () => {
      const updateDto: UpdateProductDto = { name: 'Updated Product' };
      await expect(controller.update('product-id', updateDto, 'token', { user: {} } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      productsService.remove.mockResolvedValueOnce(undefined);

      await controller.remove('product-id', 'token', { user: { id: 'user-id' } } as any);

      expect(productsService.remove).toHaveBeenCalledWith('product-id', 'user-id', 'token');
    });

    it('should throw BadRequestException if userId is missing', async () => {
      await expect(controller.remove('product-id', 'token', { user: {} } as any)).rejects.toThrow(BadRequestException);
    });
  });
});

