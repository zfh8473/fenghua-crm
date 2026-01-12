/**
 * Dashboard Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '../permission/permission.service';
import { DashboardService } from './dashboard.service';
import { Pool } from 'pg';
import * as redis from 'redis';

describe('DashboardService', () => {
  let service: DashboardService;
  let configService: jest.Mocked<ConfigService>;
  let permissionService: jest.Mocked<PermissionService>;
  let mockPgPool: jest.Mocked<Pool>;
  let mockRedisClient: jest.Mocked<redis.RedisClientType>;

  const mockToken = 'mock-jwt-token';

  beforeEach(async () => {
    // Mock pg.Pool
    mockPgPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock Redis client
    mockRedisClient = {
      get: jest.fn(),
      setEx: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL' || key === 'PG_DATABASE_URL') {
          return 'postgresql://user:pass@host:5432/testdb';
        }
        if (key === 'REDIS_URL') {
          return 'redis://localhost:6379';
        }
        return undefined;
      }),
    };

    // Mock PermissionService
    const mockPermissionService = {
      getDataAccessFilter: jest.fn().mockResolvedValue(null), // ADMIN/DIRECTOR returns null
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    configService = module.get(ConfigService);
    permissionService = module.get(PermissionService);

    // Replace pgPool with mock
    (service as any).pgPool = mockPgPool;
    (service as any).redisClient = mockRedisClient;
    (service as any).redisEnabled = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return dashboard overview data', async () => {
      const mockResult = {
        rows: [{
          total_customers: '100',
          total_buyers: '60',
          total_suppliers: '40',
          total_products: '200',
          total_interactions: '500',
          new_customers_this_month: '10',
          new_interactions_this_month: '50',
        }],
      };

      (mockPgPool.query as jest.Mock).mockResolvedValue(mockResult);
      mockRedisClient.get.mockResolvedValue(null); // No cache

      const result = await service.getOverview(mockToken);

      expect(result).toEqual({
        totalCustomers: 100,
        totalBuyers: 60,
        totalSuppliers: 40,
        totalProducts: 200,
        totalInteractions: 500,
        newCustomersThisMonth: 10,
        newInteractionsThisMonth: 50,
      });

      expect(mockPgPool.query).toHaveBeenCalled();
      expect(permissionService.getDataAccessFilter).toHaveBeenCalledWith(mockToken);
    });

    it('should return cached data if available', async () => {
      const cachedData = {
        totalCustomers: 100,
        totalBuyers: 60,
        totalSuppliers: 40,
        totalProducts: 200,
        totalInteractions: 500,
        newCustomersThisMonth: 10,
        newInteractionsThisMonth: 50,
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getOverview(mockToken);

      expect(result).toEqual(cachedData);
      expect(mockPgPool.query).not.toHaveBeenCalled();
      expect(mockRedisClient.get).toHaveBeenCalledWith('dashboard:overview');
    });

    it('should throw error if user has no access', async () => {
      permissionService.getDataAccessFilter.mockResolvedValue({ customerType: 'NONE' });

      await expect(service.getOverview(mockToken)).rejects.toThrow('您没有权限查看仪表板数据');
    });

    it('should handle database connection errors', async () => {
      (service as any).pgPool = null;

      await expect(service.getOverview(mockToken)).rejects.toThrow('数据库连接未初始化');
    });
  });
});

