/**
 * Customer Product Interaction History Service Tests
 * 
 * Unit tests for CustomerProductInteractionHistoryService
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CustomerProductInteractionHistoryService } from './customer-product-interaction-history.service';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '../permission/permission.service';
import { Pool, QueryResult } from 'pg';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock pg.Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('CustomerProductInteractionHistoryService', () => {
  let service: CustomerProductInteractionHistoryService;
  let configService: jest.Mocked<ConfigService>;
  let permissionService: jest.Mocked<PermissionService>;
  let mockPgPool: jest.Mocked<Pool>;

  const mockCustomerId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const mockProductId = 'b2c3d4e5-f6a7-8901-2345-678901bcdefg';
  const mockToken = 'mock-jwt-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerProductInteractionHistoryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'DATABASE_URL' || key === 'PG_DATABASE_URL') {
                return 'postgresql://user:pass@host:5432/testdb';
              }
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

    service = module.get<CustomerProductInteractionHistoryService>(
      CustomerProductInteractionHistoryService,
    );
    configService = module.get(ConfigService);
    permissionService = module.get(PermissionService);
    mockPgPool = service['pgPool'] as jest.Mocked<Pool>;

    // Ensure pgPool is initialized for tests
    (service as any).initializeDatabaseConnection();
    jest.clearAllMocks(); // Clear mocks after init
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomerProductInteractions', () => {
    it('should return customer product interactions for admin role', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null, // Admin has no specific filter
      });
      
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: mockProductId }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'interaction-1',
              interaction_type: 'product_inquiry',
              interaction_date: new Date('2024-01-01'),
              description: 'Test interaction',
              status: 'active',
              additional_info: null,
              created_at: new Date('2024-01-01'),
              created_by: 'user-1',
              creator_email: 'user@example.com',
              creator_first_name: 'John',
              creator_last_name: 'Doe',
              attachments: '[]',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '1' }],
        });

      const result = await service.getCustomerProductInteractions(
        mockCustomerId,
        mockProductId,
        mockToken,
        1,
        20,
      );

      expect(result.interactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.interactions[0].interactionType).toBe('product_inquiry');
      expect(permissionService.getDataAccessFilter).toHaveBeenCalledWith(mockToken);
    });

    it('should return buyer interactions for frontend specialist', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: 'buyer',
      });
      
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: mockProductId }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'interaction-1',
              interaction_type: 'product_inquiry',
              interaction_date: new Date('2024-01-01'),
              description: 'Test interaction',
              status: null,
              additional_info: null,
              created_at: new Date('2024-01-01'),
              created_by: 'user-1',
              creator_email: 'user@example.com',
              creator_first_name: 'John',
              creator_last_name: 'Doe',
              attachments: '[]',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '1' }],
        });

      const result = await service.getCustomerProductInteractions(
        mockCustomerId,
        mockProductId,
        mockToken,
        1,
        20,
      );

      expect(result.interactions).toHaveLength(1);
      const interactionsQueryCall = queryMock.mock.calls[2];
      expect(interactionsQueryCall[1]).toEqual(
        expect.arrayContaining([mockCustomerId, mockProductId, 'BUYER']),
      );
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock.mockResolvedValueOnce({
        rows: [], // Customer not found
      });

      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow('客户不存在');
    });

    it('should throw NotFoundException if product does not exist', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [], // Product not found
        });

      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow('产品不存在');
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'NONE',
      });

      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow('您没有权限查看互动历史');

      // Verify customer check was not called
      expect(mockPgPool.query).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if customer type does not match user role', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: 'buyer', // Frontend specialist
      });

      const queryMock = mockPgPool.query as jest.Mock;
      queryMock.mockResolvedValueOnce({
        rows: [{ id: mockCustomerId, customer_type: 'SUPPLIER' }], // Wrong type
      });

      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow('您没有权限查看该客户的互动历史');
    });

    it('should return empty list if no interactions exist', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: mockProductId }],
        })
        .mockResolvedValueOnce({
          rows: [], // No interactions
        })
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        });

      const result = await service.getCustomerProductInteractions(
        mockCustomerId,
        mockProductId,
        mockToken,
        1,
        20,
      );

      expect(result.interactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: mockProductId }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'interaction-3',
              interaction_type: 'quotation',
              interaction_date: new Date('2024-01-03'),
              description: 'Page 2 interaction',
              status: null,
              additional_info: null,
              created_at: new Date('2024-01-03'),
              created_by: 'user-1',
              creator_email: null,
              creator_first_name: null,
              creator_last_name: null,
              attachments: '[]',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '25' }], // Total 25 interactions
        });

      const result = await service.getCustomerProductInteractions(
        mockCustomerId,
        mockProductId,
        mockToken,
        2,
        20,
      );

      expect(result.interactions).toHaveLength(1);
      expect(result.total).toBe(25);
      // Verify offset was calculated correctly (page 2, limit 20 = offset 20)
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, mockProductId, null, 20, 20]),
      );
    });

    it('should throw BadRequestException if database connection not initialized', async () => {
      service['pgPool'] = null;

      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 20),
      ).rejects.toThrow('数据库连接未初始化');
    });

    it('should normalize page and limit parameters', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: null,
      });
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValue({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValue({
          rows: [{ id: mockProductId }],
        })
        .mockResolvedValue({
          rows: [],
        })
        .mockResolvedValue({
          rows: [{ total: '0' }],
        });

      // Test with invalid page (should default to 1)
      await service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 0, 20);
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, mockProductId, null, 20, 0]), // offset = (1-1) * 20 = 0
      );

      // Test with invalid limit (should default to 20)
      await service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 0);
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, mockProductId, null, 20, 0]),
      );

      // Test with limit > 100 (should cap at 100)
      await service.getCustomerProductInteractions(mockCustomerId, mockProductId, mockToken, 1, 200);
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, mockProductId, null, 100, 0]),
      );
    });

    it('should parse attachments JSON correctly', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const queryMock = mockPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: mockProductId }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'interaction-1',
              interaction_type: 'product_inquiry',
              interaction_date: new Date('2024-01-01'),
              description: 'Test interaction',
              status: null,
              additional_info: null,
              created_at: new Date('2024-01-01'),
              created_by: 'user-1',
              creator_email: 'user@example.com',
              creator_first_name: 'John',
              creator_last_name: 'Doe',
              attachments: JSON.stringify([
                {
                  id: 'attachment-1',
                  fileName: 'test.pdf',
                  fileUrl: 'https://example.com/test.pdf',
                  fileType: 'pdf',
                  fileSize: 1024,
                  mimeType: 'application/pdf',
                },
              ]),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '1' }],
        });

      const result = await service.getCustomerProductInteractions(
        mockCustomerId,
        mockProductId,
        mockToken,
        1,
        20,
      );

      expect(result.interactions[0].attachments).toHaveLength(1);
      expect(result.interactions[0].attachments[0].fileName).toBe('test.pdf');
    });
  });

  describe('onModuleDestroy', () => {
    it('should close database connection pool', async () => {
      // Ensure pgPool is initialized
      if (!service['pgPool']) {
        (service as any).initializeDatabaseConnection();
      }
      const pgPool = service['pgPool'] as jest.Mocked<Pool>;
      const endSpy = jest.spyOn(pgPool, 'end').mockResolvedValue(undefined as never);
      await service.onModuleDestroy();
      expect(endSpy).toHaveBeenCalled();
    });

    it('should handle errors when closing pool', async () => {
      // Ensure pgPool is initialized
      if (!service['pgPool']) {
        (service as any).initializeDatabaseConnection();
      }
      const pgPool = service['pgPool'] as jest.Mocked<Pool>;
      const endSpy = jest.spyOn(pgPool, 'end').mockRejectedValue(new Error('Close failed') as never);
      await service.onModuleDestroy();
      expect(endSpy).toHaveBeenCalled();
    });
  });
});

