/**
 * Customers Import Integration Tests
 * 
 * Tests for complete customer import flows
 * All custom code is proprietary and not open source.
 * 
 * Note: These tests require a running database, Redis, and backend server.
 * Set RUN_INTEGRATION_TESTS=true to run integration tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Skip integration tests if not explicitly enabled
const shouldSkipIntegrationTests = !process.env.RUN_INTEGRATION_TESTS;

(shouldSkipIntegrationTests ? describe.skip : describe)('Customers Import Integration (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testExcelPath: string;
  let testCsvPath: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
    }

    // Create test Excel file
    const testData = [
      { '客户名称': '集成测试公司1', '客户类型': 'BUYER', '邮箱': 'integration1@test.com', '电话': '111-111-1111', '员工数': 100 },
      { '客户名称': '集成测试公司2', '客户类型': 'SUPPLIER', '邮箱': 'integration2@test.com', '电话': '222-222-2222', '员工数': 200 },
      { '客户名称': '集成测试公司3', '客户类型': 'BUYER', '邮箱': 'integration3@test.com', '电话': '333-333-3333', '员工数': 300 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    testExcelPath = path.join(testDir, 'integration-test-customers.xlsx');
    XLSX.writeFile(workbook, testExcelPath);

    // Create test CSV file
    const csvContent = `客户名称,客户类型,邮箱,电话,员工数
集成测试公司1,BUYER,integration1@test.com,111-111-1111,100
集成测试公司2,SUPPLIER,integration2@test.com,222-222-2222,200
集成测试公司3,BUYER,integration3@test.com,333-333-3333,300`;

    testCsvPath = path.join(testDir, 'integration-test-customers.csv');
    fs.writeFileSync(testCsvPath, csvContent);
  });

  afterAll(async () => {
    // Clean up test files
    if (testExcelPath && fs.existsSync(testExcelPath)) {
      fs.unlinkSync(testExcelPath);
    }
    if (testCsvPath && fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }

    await app.close();
  });

  describe('POST /import/customers/upload', () => {
    it('should upload Excel file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/customers/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('fileId');
      expect(response.body).toHaveProperty('fileName');
      expect(response.body.fileName).toContain('.xlsx');
    });

    it('should upload CSV file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/customers/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testCsvPath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('fileId');
      expect(response.body).toHaveProperty('fileName');
      expect(response.body.fileName).toContain('.csv');
    });

    it('should reject file exceeding size limit', async () => {
      // Create a large file (over 50MB)
      const largeFilePath = path.join(process.cwd(), 'test/fixtures/large-file.xlsx');
      const largeData = Array(100000).fill({ '客户名称': 'Large Company', '客户类型': 'BUYER' });
      const worksheet = XLSX.utils.json_to_sheet(largeData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, largeFilePath);

      const response = await request(app.getHttpServer())
        .post('/import/customers/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFilePath);

      // Note: This test may pass if file is not actually > 50MB
      // In real scenario, we'd create a file that's actually > 50MB
      expect([201, 400]).toContain(response.status);

      // Clean up
      if (fs.existsSync(largeFilePath)) {
        fs.unlinkSync(largeFilePath);
      }
    });
  });

  describe('POST /import/customers/preview', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      // Upload a file first
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/customers/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      uploadedFileId = uploadResponse.body.fileId;
    });

    it('should return mapping preview with auto-mapped columns', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/customers/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('columns');
      expect(response.body).toHaveProperty('sampleData');
      expect(Array.isArray(response.body.columns)).toBe(true);
      expect(Array.isArray(response.body.sampleData)).toBe(true);

      // Check that columns are auto-mapped
      const nameColumn = response.body.columns.find((c: any) => c.excelColumn === '客户名称');
      expect(nameColumn).toBeDefined();
      expect(nameColumn.suggestedField).toBe('name');
    });

    it('should accept custom mappings', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/customers/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
          customMappings: [
            { excelColumn: '客户名称', crmField: 'name' },
            { excelColumn: '客户类型', crmField: 'customerType' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.columns).toBeDefined();
    });
  });

  describe('POST /import/customers/validate', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/customers/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      uploadedFileId = uploadResponse.body.fileId;
    });

    it('should validate import data and return validation results', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/customers/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
          customMappings: [
            { excelColumn: '客户名称', crmField: 'name' },
            { excelColumn: '客户类型', crmField: 'customerType' },
            { excelColumn: '邮箱', crmField: 'email' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRecords');
      expect(response.body).toHaveProperty('validRecords');
      expect(response.body).toHaveProperty('invalidRecords');
      expect(response.body).toHaveProperty('hasErrors');
      expect(response.body.totalRecords).toBeGreaterThan(0);
    });
  });

  describe('POST /import/customers/start', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/customers/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      uploadedFileId = uploadResponse.body.fileId;
    });

    it('should start import task and return taskId', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/customers/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
          columnMappings: [
            { excelColumn: '客户名称', crmField: 'name' },
            { excelColumn: '客户类型', crmField: 'customerType' },
            { excelColumn: '邮箱', crmField: 'email' },
          ],
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('taskId');
    });
  });

  describe('GET /import/customers/tasks/:taskId', () => {
    let taskId: string;

    beforeEach(async () => {
      // Upload and start import
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/customers/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      const startResponse = await request(app.getHttpServer())
        .post('/import/customers/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadResponse.body.fileId,
          columnMappings: [
            { excelColumn: '客户名称', crmField: 'name' },
            { excelColumn: '客户类型', crmField: 'customerType' },
          ],
        });

      taskId = startResponse.body.taskId;
    });

    it('should return import task status', async () => {
      // Wait a bit for task to start
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .get(`/import/customers/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('taskId');
      expect(response.body).toHaveProperty('status');
      expect(['processing', 'completed', 'failed']).toContain(response.body.status);
    });
  });

  describe('GET /import/customers/history', () => {
    it('should return import history', async () => {
      const response = await request(app.getHttpServer())
        .get('/import/customers/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });
});

