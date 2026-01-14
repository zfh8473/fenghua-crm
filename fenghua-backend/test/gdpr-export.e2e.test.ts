/**
 * GDPR Export E2E Test
 * 
 * Tests the GDPR export API endpoints to debug the 400 Bad Request issue
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

describe('GDPR Export E2E Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global validation pipe (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: true,
        exceptionFactory: (errors) => {
          const messages = errors.map((error) => {
            if (error.constraints) {
              return Object.values(error.constraints).join(', ');
            }
            return `${error.property} 验证失败`;
          });
          return new Error(messages.length > 0 ? messages.join('; ') : '请求数据验证失败');
        },
      }),
    );

    await app.init();
    authService = moduleFixture.get<AuthService>(AuthService);

    // Create test user and get token
    try {
      // Try to login with existing test user
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'testpassword123',
      });
      authToken = loginResult.token;
      testUserId = loginResult.user.id;
    } catch (error) {
      // If user doesn't exist, create one
      const registerResult = await authService.register({
        email: 'test@example.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User',
      });
      authToken = registerResult.token;
      testUserId = registerResult.user.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /gdpr/export-requests', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests')
        .expect(401);
    });

    it('should return 200 with valid token and default parameters', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should handle limit=50&offset=0 query parameters', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=50&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('should handle empty limit parameter', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should handle empty offset parameter', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=50&offset=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should handle both empty parameters', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=&offset=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject invalid limit (negative)', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=-1&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject invalid limit (too large)', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=101&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject invalid offset (negative)', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=50&offset=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle string numbers correctly', () => {
      return request(app.getHttpServer())
        .get('/gdpr/export-requests?limit=25&offset=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /gdpr/export-request', () => {
    it('should create export request with JSON format', () => {
      return request(app.getHttpServer())
        .post('/gdpr/export-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'JSON' })
        .expect(202)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('PENDING');
        });
    });

    it('should create export request with CSV format', () => {
      return request(app.getHttpServer())
        .post('/gdpr/export-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'CSV' })
        .expect(202);
    });
  });
});
