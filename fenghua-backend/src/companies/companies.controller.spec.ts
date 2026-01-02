/**
 * Companies Controller Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCustomerDto, CustomerType } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecutionContext, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let companiesService: jest.Mocked<CompaniesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
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
      .compile();

    controller = module.get<CompaniesController>(CompaniesController);
    companiesService = module.get(CompaniesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      const createDto: CreateCustomerDto = {
        name: 'Test Customer',
        customerCode: 'CUST001',
        customerType: CustomerType.BUYER,
      };
      const mockCustomer: CustomerResponseDto = {
        id: 'customer-id',
        name: 'Test Customer',
        customerCode: 'CUST001',
        customerType: 'BUYER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      companiesService.create.mockResolvedValueOnce(mockCustomer);

      const result = await controller.create(createDto, 'token', { user: { id: 'user-id' } } as any);

      expect(result).toEqual(mockCustomer);
      expect(companiesService.create).toHaveBeenCalledWith(createDto, 'token', 'user-id');
    });
  });

  describe('findAll', () => {
    it('should return customers list', async () => {
      const query: CustomerQueryDto = { limit: 20, offset: 0 };
      const mockResponse = {
        customers: [],
        total: 0,
      };

      companiesService.findAll.mockResolvedValueOnce(mockResponse);

      const result = await controller.findAll(query, 'token');

      expect(result).toEqual(mockResponse);
      expect(companiesService.findAll).toHaveBeenCalledWith(query, 'token');
    });

    it('should filter by customer type', async () => {
      const query: CustomerQueryDto = { customerType: CustomerType.BUYER, limit: 20, offset: 0 };
      const mockResponse = {
        customers: [],
        total: 0,
      };

      companiesService.findAll.mockResolvedValueOnce(mockResponse);

      const result = await controller.findAll(query, 'token');

      expect(result).toEqual(mockResponse);
      expect(companiesService.findAll).toHaveBeenCalledWith(query, 'token');
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const mockCustomer: CustomerResponseDto = {
        id: 'customer-id',
        name: 'Test Customer',
        customerCode: 'CUST001',
        customerType: 'BUYER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      companiesService.findOne.mockResolvedValueOnce(mockCustomer);

      const result = await controller.findOne('customer-id', 'token');

      expect(result).toEqual(mockCustomer);
      expect(companiesService.findOne).toHaveBeenCalledWith('customer-id', 'token');
    });

    it('should throw NotFoundException when customer not found', async () => {
      companiesService.findOne.mockRejectedValueOnce(new NotFoundException('客户不存在'));

      await expect(controller.findOne('non-existent-id', 'token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const updateDto: UpdateCustomerDto = {
        name: 'Updated Customer Name',
      };
      const mockCustomer: CustomerResponseDto = {
        id: 'customer-id',
        name: 'Updated Customer Name',
        customerCode: 'CUST001',
        customerType: 'BUYER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      companiesService.update.mockResolvedValueOnce(mockCustomer);

      const result = await controller.update('customer-id', updateDto, 'token', { user: { id: 'user-id' } } as any);

      expect(result).toEqual(mockCustomer);
      expect(companiesService.update).toHaveBeenCalledWith('customer-id', updateDto, 'token', 'user-id');
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      const updateDto: UpdateCustomerDto = { name: 'Updated Name' };
      companiesService.update.mockRejectedValueOnce(new ForbiddenException('您没有权限编辑该客户'));

      await expect(controller.update('customer-id', updateDto, 'token', { user: { id: 'user-id' } } as any))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      companiesService.remove.mockResolvedValueOnce(undefined);

      await controller.remove('customer-id', 'token', { user: { id: 'user-id' } } as any);

      expect(companiesService.remove).toHaveBeenCalledWith('customer-id', 'token', 'user-id');
    });

    it('should throw NotFoundException when customer not found', async () => {
      companiesService.remove.mockRejectedValueOnce(new NotFoundException('客户不存在'));

      await expect(controller.remove('non-existent-id', 'token', { user: { id: 'user-id' } } as any))
        .rejects.toThrow(NotFoundException);
    });
  });
});

