/**
 * Customer Product Association Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CustomerProductAssociationService } from './customer-product-association.service';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '../permission/permission.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';

// Mock pg.Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('CustomerProductAssociationService', () => {
  let service: CustomerProductAssociationService;
  let configService: jest.Mocked<ConfigService>;
  let permissionService: jest.Mocked<PermissionService>;
  let mockPgPool: jest.Mocked<Pool>;

  const mockCustomerId = 'customer-123';
  const mockToken = 'mock-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerProductAssociationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'DATABASE_URL') return 'postgresql://user:pass@host:5432/testdb';
              return undefined;
            }),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            getDataAccessFilter: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomerProductAssociationService>(CustomerProductAssociationService);
    configService = module.get(ConfigService);
    permissionService = module.get(PermissionService);
    mockPgPool = service['pgPool'] as jest.Mocked<Pool>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomerProducts', () => {
    it('should return customer products with pagination', async () => {
      // Mock permission service
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null, // Director/Admin - no filter
      });

      // Mock customer check
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
      });

      // Mock products query
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'product-1',
            name: 'Product 1',
            hs_code: '123456',
            interaction_count: '5',
          },
          {
            id: 'product-2',
            name: 'Product 2',
            hs_code: '789012',
            interaction_count: '3',
          },
        ],
      });

      // Mock count query
      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '2' }],
      });

      const result = await service.getCustomerProducts(mockCustomerId, mockToken, 1, 10);

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.products[0].name).toBe('Product 1');
      expect(result.products[0].interactionCount).toBe(5);
      expect(result.products[1].interactionCount).toBe(3);
    });

    it('should filter by customer type for frontend specialist', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: 'buyer', // Frontend specialist
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'product-1',
            name: 'Product 1',
            hs_code: '123456',
            interaction_count: '2',
          },
        ],
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '1' }],
      });

      const result = await service.getCustomerProducts(mockCustomerId, mockToken, 1, 10);

      expect(result.products).toHaveLength(1);
      // Verify customer type filter was applied (BUYER)
      const queryCalls = (mockPgPool.query as jest.Mock).mock.calls;
      const productsQueryCall = queryCalls.find((call) => 
        call[0]?.includes('SELECT') && call[0]?.includes('p.id')
      );
      expect(productsQueryCall).toBeDefined();
      expect(productsQueryCall[1]).toEqual(expect.arrayContaining([mockCustomerId, 'BUYER']));
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: null,
      });

      (mockPgPool.query as jest.Mock).mockResolvedValue({
        rows: [], // Customer not found
      });

      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow('客户不存在');
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'NONE',
      });

      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow('您没有权限查看产品信息');
      
      // Verify customer check was not called
      expect(mockPgPool.query).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if customer type does not match user role', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer', // Frontend specialist
      });

      (mockPgPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: mockCustomerId, customer_type: 'SUPPLIER' }], // Wrong type
      });

      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow('您没有权限查看该客户关联的产品');
    });

    it('should return empty list if customer has no products', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [], // No products
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }],
      });

      const result = await service.getCustomerProducts(mockCustomerId, mockToken, 1, 10);

      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'product-3',
            name: 'Product 3',
            hs_code: '345678',
            interaction_count: '1',
          },
        ],
      });

      (mockPgPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '15' }], // Total 15 products
      });

      const result = await service.getCustomerProducts(mockCustomerId, mockToken, 2, 10);

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(15);
      // Verify offset was calculated correctly (page 2, limit 10 = offset 10)
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, null, 10, 10]),
      );
    });

    it('should throw BadRequestException if database connection not initialized', async () => {
      service['pgPool'] = null;

      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getCustomerProducts(mockCustomerId, mockToken, 1, 10),
      ).rejects.toThrow('数据库连接未初始化');
    });

    it('should normalize page and limit parameters', async () => {
      // Test with invalid page (should default to 1)
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await service.getCustomerProducts(mockCustomerId, mockToken, 0, 10);
      const calls1 = (mockPgPool.query as jest.Mock).mock.calls;
      const productsQueryCall1 = calls1.find((call) => 
        call[0]?.includes('SELECT') && call[0]?.includes('p.id')
      );
      expect(productsQueryCall1[1]).toEqual(expect.arrayContaining([mockCustomerId, null, 10, 0]));

      jest.clearAllMocks();

      // Test with invalid limit (should default to 10)
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await service.getCustomerProducts(mockCustomerId, mockToken, 1, 0);
      const calls2 = (mockPgPool.query as jest.Mock).mock.calls;
      const productsQueryCall2 = calls2.find((call) => 
        call[0]?.includes('SELECT') && call[0]?.includes('p.id')
      );
      expect(productsQueryCall2[1]).toEqual(expect.arrayContaining([mockCustomerId, null, 10, 0]));

      jest.clearAllMocks();

      // Test with limit > 100 (should cap at 100)
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      (mockPgPool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await service.getCustomerProducts(mockCustomerId, mockToken, 1, 200);
      const calls3 = (mockPgPool.query as jest.Mock).mock.calls;
      const productsQueryCall3 = calls3.find((call) => 
        call[0]?.includes('SELECT') && call[0]?.includes('p.id')
      );
      expect(productsQueryCall3[1]).toEqual(expect.arrayContaining([mockCustomerId, null, 100, 0]));
    });
  });

  describe('onModuleDestroy', () => {
    it('should close database connection pool', async () => {
      const endMock = mockPgPool.end as jest.Mock;
      endMock.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(endMock).toHaveBeenCalled();
    });

    it('should handle errors when closing pool', async () => {
      const endMock = mockPgPool.end as jest.Mock;
      endMock.mockRejectedValue(new Error('Close failed'));

      await service.onModuleDestroy();

      expect(endMock).toHaveBeenCalled();
    });
  });
});

