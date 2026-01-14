/**
 * Data Retention Integration Tests
 * 
 * Tests for Story 9-7: Data Retention Policy
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { DataRetentionService } from '../src/data-retention/data-retention.service';

describe('Data Retention Integration Tests (Story 9-7)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let dataRetentionService: DataRetentionService;
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    authService = moduleFixture.get<AuthService>(AuthService);
    dataRetentionService = moduleFixture.get<DataRetentionService>(DataRetentionService);

    // Create admin user and get token
    try {
      const adminLogin = await authService.login({
        email: 'admin@test.com',
        password: 'admin123',
      });
      adminToken = adminLogin.token;
      adminUserId = adminLogin.user.id;
    } catch (error) {
      const adminRegister = await authService.register({
        email: 'admin@test.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
      });
      adminToken = adminRegister.token;
      adminUserId = adminRegister.user.id;
    }

    // Create regular user and get token
    try {
      const userLogin = await authService.login({
        email: 'user@test.com',
        password: 'user123',
      });
      userToken = userLogin.token;
    } catch (error) {
      await authService.register({
        email: 'user@test.com',
        password: 'user123',
        firstName: 'Test',
        lastName: 'User',
      });
      const userLogin = await authService.login({
        email: 'user@test.com',
        password: 'user123',
      });
      userToken = userLogin.token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/data-retention/policy - Get Retention Policy (Story 9-7)', () => {
    it('[P0] should return retention policy for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/data-retention/policy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customerDataRetentionDays');
      expect(response.body).toHaveProperty('productDataRetentionDays');
      expect(response.body).toHaveProperty('interactionDataRetentionDays');
      expect(response.body).toHaveProperty('auditLogRetentionDays');
      expect(typeof response.body.customerDataRetentionDays).toBe('number');
      expect(typeof response.body.productDataRetentionDays).toBe('number');
      expect(typeof response.body.interactionDataRetentionDays).toBe('number');
      expect(typeof response.body.auditLogRetentionDays).toBe('number');
    });

    it('[P0] should return 403 for non-admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/data-retention/policy')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('[P0] should return 401 for unauthenticated request', async () => {
      const response = await request(app.getHttpServer()).get('/api/data-retention/policy');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/data-retention/statistics - Get Statistics (Story 9-7)', () => {
    it('[P0] should return retention statistics for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/data-retention/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('interactions');
      expect(response.body).toHaveProperty('auditLogs');

      // Check structure
      expect(response.body.customers).toHaveProperty('expiringIn30Days');
      expect(response.body.customers).toHaveProperty('expiringIn60Days');
      expect(response.body.customers).toHaveProperty('expiringIn90Days');
    });

    it('[P0] should return 403 for non-admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/data-retention/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/data-retention/cleanup-history - Get Cleanup History (Story 9-7)', () => {
    it('[P0] should return cleanup history for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/data-retention/cleanup-history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('[P0] should return 403 for non-admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/data-retention/cleanup-history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Data Retention Service (Story 9-7)', () => {
    it('[P0] should get retention policy', async () => {
      const policy = await dataRetentionService.getRetentionPolicy();

      expect(policy).toHaveProperty('customerDataRetentionDays');
      expect(policy).toHaveProperty('productDataRetentionDays');
      expect(policy).toHaveProperty('interactionDataRetentionDays');
      expect(policy).toHaveProperty('auditLogRetentionDays');
    });

    it('[P1] should get expiring data count', async () => {
      const count = await dataRetentionService.getExpiringDataCount('customers', 30);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('[P1] should identify expired customers', async () => {
      const expired = await dataRetentionService.findExpiredCustomers(10, 0);

      expect(Array.isArray(expired)).toBe(true);
    });
  });
});
