/**
 * Customer Timeline Service Tests
 * 
 * Unit tests for CustomerTimelineService
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CustomerTimelineService } from './customer-timeline.service';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '../permission/permission.service';
import { Pool } from 'pg';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock pg.Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('CustomerTimelineService', () => {
  let service: CustomerTimelineService;
  let configService: jest.Mocked<ConfigService>;
  let permissionService: jest.Mocked<PermissionService>;
  let mockPgPool: jest.Mocked<Pool>;

  const mockCustomerId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const mockToken = 'mock-jwt-token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerTimelineService,
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

    service = module.get<CustomerTimelineService>(CustomerTimelineService);
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

  describe('getCustomerTimeline', () => {
    it('should return customer timeline for admin role', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null, // Admin has no specific filter
      });
      // Re-get mockPgPool reference after clearAllMocks
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      const queryMock = currentPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        }) // Customer check
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
              product_id: 'product-1',
              product_name: 'Test Product',
              product_hs_code: '1234.56.78',
              creator_email: 'user@example.com',
              creator_first_name: 'John',
              creator_last_name: 'Doe',
              attachments: '[]',
            },
          ],
        }) // Interactions query
        .mockResolvedValueOnce({
          rows: [{ total: '1' }],
        }); // Count query

      const result = await service.getCustomerTimeline(
        mockCustomerId,
        mockToken,
        1,
        50,
        'desc',
        'all',
      );

      expect(result.interactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.interactions[0].interactionType).toBe('product_inquiry');
      expect(result.interactions[0].productName).toBe('Test Product');
      expect(result.interactions[0].productHsCode).toBe('1234.56.78');
      expect(permissionService.getDataAccessFilter).toHaveBeenCalledWith(mockToken);
    });

    it('should throw NotFoundException if customer does not exist', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: null,
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      (currentPgPool.query as jest.Mock).mockResolvedValue({
        rows: [],
      }); // Customer not found

      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow('客户不存在');
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'NONE',
      });

      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow('您没有权限查看时间线');

      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      expect(currentPgPool.query).not.toHaveBeenCalled(); // No DB query should happen
    });

    it('should throw ForbiddenException if customer type does not match user role', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: 'buyer', // Frontend specialist
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      (currentPgPool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: mockCustomerId, customer_type: 'SUPPLIER' }],
      }); // Customer found, but wrong type

      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow('您没有权限查看该客户的时间线');
    });

    it('should return empty list if no interactions', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      const queryMock = currentPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        }) // Customer check
        .mockResolvedValueOnce({
          rows: [],
        }) // No interactions
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        }); // Count query

      const result = await service.getCustomerTimeline(
        mockCustomerId,
        mockToken,
        1,
        50,
        'desc',
        'all',
      );

      expect(result.interactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      const queryMock = currentPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        }) // Customer check
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'interaction-51',
              interaction_type: 'order_completed',
              interaction_date: new Date('2024-01-21'),
              description: 'Another interaction',
              status: null,
              additional_info: null,
              created_at: new Date('2024-01-21'),
              created_by: 'user-1',
              product_id: null,
              product_name: null,
              product_hs_code: null,
              creator_email: 'user@example.com',
              creator_first_name: 'John',
              creator_last_name: 'Doe',
              attachments: '[]',
            },
          ],
        }) // Interactions query (page 2, 1 item)
        .mockResolvedValueOnce({
          rows: [{ total: '75' }],
        }); // Count query (total 75)

      const result = await service.getCustomerTimeline(
        mockCustomerId,
        mockToken,
        2,
        50,
        'desc',
        'all',
      );

      expect(result.interactions).toHaveLength(1);
      expect(result.total).toBe(75);
      // Verify offset was calculated correctly (page 2, limit 50 = offset 50)
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, null, null, 50, 50]),
      );
    });

    it('should handle sortOrder parameter correctly', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      const queryMock = currentPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        });

      await service.getCustomerTimeline(
        mockCustomerId,
        mockToken,
        1,
        50,
        'asc',
        'all',
      );

      // Verify SQL query contains ORDER BY ... ASC (using string interpolation)
      const interactionsQueryCall = queryMock.mock.calls[1];
      expect(interactionsQueryCall[0]).toContain('ORDER BY pci.interaction_date ASC');
    });

    it('should handle dateRange parameter correctly', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      const queryMock = currentPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        });

      // Test 'week' dateRange
      await service.getCustomerTimeline(
        mockCustomerId,
        mockToken,
        1,
        50,
        'desc',
        'week',
      );

      // Verify dateRangeStart was calculated (should be approximately 7 days ago)
      const interactionsQueryCall = queryMock.mock.calls[1];
      const dateRangeStart = interactionsQueryCall[1][2]; // Third parameter
      expect(dateRangeStart).toBeInstanceOf(Date);
      const daysDiff = (Date.now() - dateRangeStart.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(7, 0); // Approximately 7 days
    });

    it('should normalize page and limit parameters', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({
        customerType: null,
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      const queryMock = currentPgPool.query as jest.Mock;
      
      // Test with invalid page (should default to 1)
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        });
      await service.getCustomerTimeline(mockCustomerId, mockToken, 0, 50, 'desc', 'all');
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, null, null, 50, 0]), // offset = (1-1) * 50 = 0
      );

      // Test with invalid limit (should default to 50)
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        });
      await service.getCustomerTimeline(mockCustomerId, mockToken, 1, 0, 'desc', 'all');
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, null, null, 50, 0]),
      );

      // Test with limit > 100 (should cap at 100)
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [{ total: '0' }],
        });
      await service.getCustomerTimeline(mockCustomerId, mockToken, 1, 200, 'desc', 'all');
      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockCustomerId, null, null, 100, 0]),
      );
    });

    it('should parse attachments JSON correctly', async () => {
      permissionService.getDataAccessFilter.mockResolvedValueOnce({
        customerType: null,
      });
      const currentPgPool = service['pgPool'] as jest.Mocked<Pool>;
      const queryMock = currentPgPool.query as jest.Mock;
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: mockCustomerId, customer_type: 'BUYER' }],
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
              product_id: 'product-1',
              product_name: 'Test Product',
              product_hs_code: '1234.56.78',
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

      const result = await service.getCustomerTimeline(
        mockCustomerId,
        mockToken,
        1,
        50,
        'desc',
        'all',
      );

      expect(result.interactions[0].attachments).toHaveLength(1);
      expect(result.interactions[0].attachments[0].fileName).toBe('test.pdf');
    });

    it('should throw BadRequestException if database connection not initialized', async () => {
      service['pgPool'] = null; // Manually set to null

      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getCustomerTimeline(mockCustomerId, mockToken, 1, 50, 'desc', 'all'),
      ).rejects.toThrow('数据库连接未初始化');
      
      // Verify no database queries were made
      expect(mockPgPool.query).not.toHaveBeenCalled();
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

