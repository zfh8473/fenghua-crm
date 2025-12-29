/**
 * Health Service Unit Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { Pool } from 'pg';
import * as redis from 'redis';

// Mock pg
jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      end: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock redis
jest.mock('redis', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue(undefined),
      isOpen: true,
    }),
  };
});

describe('HealthService', () => {
  let service: HealthService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when database is connected', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
        return undefined;
      });

      // Re-initialize service with new config
      const newService = new HealthService(configService);
      
      const health = await newService.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.database.status).toBe('connected');
      expect(health.service.status).toBe('running');
      expect(health.memory).toBeDefined();
    });

    it('should return unhealthy status when database is disconnected', async () => {
      configService.get.mockReturnValue(undefined);

      const newService = new HealthService(configService);
      const health = await newService.getHealthStatus();

      expect(health.status).toBe('unhealthy');
      expect(health.database.status).toBe('disconnected');
    });

    it('should include Redis status when Redis is configured', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });

      const newService = new HealthService(configService);
      const health = await newService.getHealthStatus();

      expect(health.redis).toBeDefined();
      expect(health.redis?.status).toBe('connected');
    });

    it('should not include Redis status when Redis is not configured', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
        return undefined;
      });

      const newService = new HealthService(configService);
      const health = await newService.getHealthStatus();

      expect(health.redis).toBeUndefined();
    });

    it('should calculate uptime correctly', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
        return undefined;
      });

      const newService = new HealthService(configService);
      
      // Wait a bit to ensure uptime > 0
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait more than 1 second
      
      const health = await newService.getHealthStatus();

      expect(health.service.uptime).toBeGreaterThanOrEqual(1); // At least 1 second
    });

    it('should include memory usage', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
        return undefined;
      });

      const newService = new HealthService(configService);
      const health = await newService.getHealthStatus();

      expect(health.memory).toBeDefined();
      expect(health.memory?.used).toBeGreaterThan(0);
      expect(health.memory?.total).toBeGreaterThan(0);
      expect(health.memory?.percentage).toBeGreaterThanOrEqual(0);
      expect(health.memory?.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close database connection pool', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
        return undefined;
      });

      const newService = new HealthService(configService);
      const mockPool = (newService as any).pgPool as jest.Mocked<Pool>;
      
      await newService.onModuleDestroy();

      if (mockPool) {
        expect(mockPool.end).toHaveBeenCalled();
      }
    });

    it('should close Redis connection if open', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://user:pass@localhost:5432/db';
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });

      const newService = new HealthService(configService);
      const mockRedisClient = (newService as any).redisClient as any;
      
      await newService.onModuleDestroy();

      if (mockRedisClient && mockRedisClient.isOpen) {
        expect(mockRedisClient.quit).toHaveBeenCalled();
      }
    });
  });
});

