/**
 * Authentication Integration Tests
 * 
 * Tests for complete authentication flows
 * All custom code is proprietary and not open source.
 * 
 * Note: These tests require a running database and backend server.
 * Set RUN_INTEGRATION_TESTS=true to run integration tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

// Skip integration tests if not explicitly enabled
const shouldSkipIntegrationTests = !process.env.RUN_INTEGRATION_TESTS;

(shouldSkipIntegrationTests ? describe.skip : describe)('Authentication Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123456',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user).toHaveProperty('role');
        });
    });

    it('should return 401 with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid');
        });
    });

    it('should return 400 with missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'test123456',
        })
        .expect(400);
    });

    it('should return 400 with missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/validate', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123456',
        });

      authToken = response.body.token;
    });

    it('should validate token and return user info', () => {
      return request(app.getHttpServer())
        .post('/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('role');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/auth/validate')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/validate')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123456',
        });

      authToken = response.body.token;
    });

    it('should allow access to protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should deny access to protected route without token', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should deny access to protected route with invalid token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
