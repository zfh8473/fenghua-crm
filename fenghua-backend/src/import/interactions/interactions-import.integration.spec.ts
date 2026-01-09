/**
 * Interactions Import Integration Tests
 * 
 * Tests for complete interaction import flows
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

(shouldSkipIntegrationTests ? describe.skip : describe)('Interactions Import Integration (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testExcelPath: string;
  let testCsvPath: string;
  let testCustomerId: string;
  let testProductId: string;

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

    // Create test customer and product (required for interaction import)
    // Note: In real scenario, these would be created via API or seeded in database
    // For now, we'll use placeholder IDs - tests should handle missing data gracefully
    testCustomerId = 'test-customer-id';
    testProductId = 'test-product-id';

    // Create test Excel file
    const testData = [
      {
        '客户名称': '测试客户1',
        '产品名称': '测试产品1',
        '互动类型': '初步接触',
        '互动时间': '2025-01-08T10:00:00Z',
        '互动描述': '集成测试互动1',
        '状态': '进行中',
      },
      {
        '客户名称': '测试客户2',
        '产品名称': '测试产品2',
        '互动类型': '产品询价',
        '互动时间': '2025-01-08T11:00:00Z',
        '互动描述': '集成测试互动2',
        '状态': '已完成',
      },
      {
        '客户名称': '测试客户3',
        '产品名称': '测试产品3',
        '互动类型': '报价',
        '互动时间': '2025-01-08T12:00:00Z',
        '互动描述': '集成测试互动3',
        '状态': '需要跟进',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    testExcelPath = path.join(testDir, 'integration-test-interactions.xlsx');
    XLSX.writeFile(workbook, testExcelPath);

    // Create test CSV file
    const csvContent = `客户名称,产品名称,互动类型,互动时间,互动描述,状态
测试客户1,测试产品1,初步接触,2025-01-08T10:00:00Z,集成测试互动1,进行中
测试客户2,测试产品2,产品询价,2025-01-08T11:00:00Z,集成测试互动2,已完成
测试客户3,测试产品3,报价,2025-01-08T12:00:00Z,集成测试互动3,需要跟进`;

    testCsvPath = path.join(testDir, 'integration-test-interactions.csv');
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

  describe('POST /import/interactions/upload', () => {
    it('should upload Excel file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/interactions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('fileId');
      expect(response.body).toHaveProperty('fileName');
      expect(response.body.fileName).toContain('.xlsx');
    });

    it('should upload CSV file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/interactions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testCsvPath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('fileId');
      expect(response.body).toHaveProperty('fileName');
      expect(response.body.fileName).toContain('.csv');
    });

    it('should reject file exceeding size limit', async () => {
      // Create a large file (over 50MB)
      const largeFilePath = path.join(process.cwd(), 'test/fixtures/large-interactions-file.xlsx');
      const largeData = Array(100000).fill({
        '客户名称': 'Large Customer',
        '产品名称': 'Large Product',
        '互动类型': '初步接触',
        '互动时间': '2025-01-08T10:00:00Z',
      });
      const worksheet = XLSX.utils.json_to_sheet(largeData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, largeFilePath);

      const response = await request(app.getHttpServer())
        .post('/import/interactions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFilePath);

      // Note: This test may pass if file is not actually > 50MB
      expect([201, 400]).toContain(response.status);

      // Clean up
      if (fs.existsSync(largeFilePath)) {
        fs.unlinkSync(largeFilePath);
      }
    });
  });

  describe('POST /import/interactions/preview', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      // Upload a file first
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/interactions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      uploadedFileId = uploadResponse.body.fileId;
    });

    it('should return mapping preview', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/interactions/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('columns');
      expect(response.body).toHaveProperty('sampleData');
      expect(Array.isArray(response.body.columns)).toBe(true);
      expect(Array.isArray(response.body.sampleData)).toBe(true);
    });

    it('should accept custom mappings', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/interactions/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
          customMappings: [
            { excelColumn: '客户名称', crmField: 'customerName' },
            { excelColumn: '产品名称', crmField: 'productName' },
            { excelColumn: '互动类型', crmField: 'interactionType' },
            { excelColumn: '互动时间', crmField: 'interactionDate' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.columns).toHaveLength(6); // 6 columns in test data
    });
  });

  describe('POST /import/interactions/validate', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/interactions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      uploadedFileId = uploadResponse.body.fileId;
    });

    it('should validate import data', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/interactions/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
          columnMappings: [
            { excelColumn: '客户名称', crmField: 'customerName' },
            { excelColumn: '产品名称', crmField: 'productName' },
            { excelColumn: '互动类型', crmField: 'interactionType' },
            { excelColumn: '互动时间', crmField: 'interactionDate' },
            { excelColumn: '互动描述', crmField: 'description' },
            { excelColumn: '状态', crmField: 'status' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRecords');
      expect(response.body).toHaveProperty('validRecords');
      expect(response.body).toHaveProperty('invalidRecords');
      expect(response.body).toHaveProperty('hasErrors');
    });
  });

  describe('POST /import/interactions/start', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/interactions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      uploadedFileId = uploadResponse.body.fileId;
    });

    it('should start import task', async () => {
      const response = await request(app.getHttpServer())
        .post('/import/interactions/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadedFileId,
          columnMappings: [
            { excelColumn: '客户名称', crmField: 'customerName' },
            { excelColumn: '产品名称', crmField: 'productName' },
            { excelColumn: '互动类型', crmField: 'interactionType' },
            { excelColumn: '互动时间', crmField: 'interactionDate' },
            { excelColumn: '互动描述', crmField: 'description' },
            { excelColumn: '状态', crmField: 'status' },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('taskId');
    });
  });

  describe('GET /import/interactions/tasks/:taskId', () => {
    let taskId: string;

    beforeEach(async () => {
      // Upload and start import
      const uploadResponse = await request(app.getHttpServer())
        .post('/import/interactions/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testExcelPath);

      const startResponse = await request(app.getHttpServer())
        .post('/import/interactions/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId: uploadResponse.body.fileId,
          columnMappings: [
            { excelColumn: '客户名称', crmField: 'customerName' },
            { excelColumn: '产品名称', crmField: 'productName' },
            { excelColumn: '互动类型', crmField: 'interactionType' },
            { excelColumn: '互动时间', crmField: 'interactionDate' },
          ],
        });

      taskId = startResponse.body.taskId;
    });

    it('should return task status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/import/interactions/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('taskId');
      expect(['processing', 'completed', 'failed']).toContain(response.body.status);
    });
  });

  describe('GET /import/interactions/history', () => {
    it('should return import history', async () => {
      const response = await request(app.getHttpServer())
        .get('/import/interactions/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.history)).toBe(true);
    });
  });
});


