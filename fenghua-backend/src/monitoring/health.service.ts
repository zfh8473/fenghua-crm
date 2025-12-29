/**
 * Health Service
 * 
 * Provides system health check functionality
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import { Pool } from 'pg';
import * as redis from 'redis';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  service: {
    status: 'running' | 'stopped';
    uptime: number;
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: Date;
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private pgPool: Pool | null = null;
  private redisClient: redis.RedisClientType | null = null;
  private redisEnabled = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeDatabaseConnection();
    this.initializeRedisConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl = this.configService.get<string>('DATABASE_URL') || 
                       this.configService.get<string>('PG_DATABASE_URL');
    
    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, health check will show disconnected');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 1, // Use minimal connections for health checks
      });
      this.logger.log('PostgreSQL connection pool initialized for health checks');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Initialize Redis connection (if configured)
   * Connection is created once and reused for all health checks
   */
  private initializeRedisConnection(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.log('REDIS_URL not configured, Redis health check will be skipped');
      return;
    }

    this.redisEnabled = true;
    try {
      this.redisClient = redis.createClient({
        url: redisUrl,
      });
      // Connect immediately to reuse connection for health checks
      this.redisClient.connect().catch((error) => {
        this.logger.warn('Redis connection will be established on first health check', error);
      });
      this.logger.log('Redis client initialized for health checks');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', error);
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; latency?: number }> {
    if (!this.pgPool) {
      return { status: 'disconnected' };
    }

    try {
      const startTime = Date.now();
      await this.pgPool.query('SELECT 1');
      const latency = Date.now() - startTime;
      return { status: 'connected', latency };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return { status: 'disconnected' };
    }
  }

  /**
   * Check Redis connection
   */
  private async checkRedis(): Promise<{ status: 'connected' | 'disconnected'; latency?: number } | undefined> {
    if (!this.redisEnabled || !this.redisClient) {
      return undefined; // Don't include in response if not configured
    }

    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
      const startTime = Date.now();
      await this.redisClient.ping();
      const latency = Date.now() - startTime;
      return { status: 'connected', latency };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return { status: 'disconnected' };
    }
  }

  /**
   * Get system memory usage
   */
  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.round((used / total) * 100);
    
    return {
      used,
      total,
      percentage,
    };
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const uptime = Math.floor((Date.now() - this.startTime) / 1000); // seconds
    const memory = this.getMemoryUsage();

    const isHealthy = database.status === 'connected' && 
                     (!redis || redis.status === 'connected');

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database,
      ...(redis && { redis }), // Only include redis if configured
      service: {
        status: 'running',
        uptime,
      },
      memory,
      timestamp: new Date(),
    };
  }

  /**
   * Cleanup connections on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('PostgreSQL connection pool closed');
    }
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.quit();
      this.logger.log('Redis client closed');
    }
  }
}

