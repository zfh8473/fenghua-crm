/**
 * Products Import Error Handling and Recovery Tests
 * 
 * Tests for error handling and recovery mechanisms
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

(shouldSkipIntegrationTests ? describe.skip : describe)('Products Import Error Handling Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let errorTestExcelPath: string;

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

    // Create test Excel file with various error scenarios
    const testData = [
      // Duplicate HS codes (should be detected)
      { '产品名称': '重复产品1', 'HS编码': '9999999999', '产品类别': '电子产品', '产品描述': '重复产品1' },
      { '产品名称': '重复产品2', 'HS编码': '9999999999', '产品类别': '机械设备', '产品描述': '重复产品2' },
      // Invalid category (should fail validation)
      { '产品名称': '无效类别产品', 'HS编码': '8888888888', '产品类别': '不存在的类别', '产品描述': '无效类别产品' },
      // Invalid HS code format
      { '产品名称': '无效HS编码产品', 'HS编码': '12345', '产品类别': '电子产品', '产品描述': '无效HS编码产品' },
      // Valid record
      { '产品名称': '有效产品', 'HS编码': '7777777777', '产品类别': '化工产品', '产品描述': '有效产品' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    errorTestExcelPath = path.join(testDir, 'error-handling-products-test.xlsx');
    XLSX.writeFile(workbook, errorTestExcelPath);
  });

  afterAll(async () => {
    // Clean up test file
    if (errorTestExcelPath && fs.existsSync(errorTestExcelPath)) {
      fs.unlinkSync(errorTestExcelPath);
    }

    await app.close();
  });

  it('should detect duplicate HS codes', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/products/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    const validateResponse = await request(app.getHttpServer())
      .post('/import/products/validate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        customMappings: [
          { excelColumn: '产品名称', crmField: 'name' },
          { excelColumn: 'HS编码', crmField: 'hsCode' },
          { excelColumn: '产品类别', crmField: 'category' },
          { excelColumn: '产品描述', crmField: 'description' },
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasDuplicates).toBe(true);
    expect(validateResponse.body.duplicates).toBeDefined();
    expect(validateResponse.body.duplicates.length).toBeGreaterThan(0);
  });

  it('should detect invalid category', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/products/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    const validateResponse = await request(app.getHttpServer())
      .post('/import/products/validate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        customMappings: [
          { excelColumn: '产品名称', crmField: 'name' },
          { excelColumn: 'HS编码', crmField: 'hsCode' },
          { excelColumn: '产品类别', crmField: 'category' },
          { excelColumn: '产品描述', crmField: 'description' },
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasErrors).toBe(true);
    expect(validateResponse.body.errors).toBeDefined();

    // Should have errors for invalid category
    const categoryErrors = validateResponse.body.errors.filter((e: any) =>
      e.errors.some((err: string) => err.includes('类别') || err.includes('category')),
    );
    expect(categoryErrors.length).toBeGreaterThan(0);
  });

  it('should detect invalid HS code format', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/products/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    const validateResponse = await request(app.getHttpServer())
      .post('/import/products/validate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        customMappings: [
          { excelColumn: '产品名称', crmField: 'name' },
          { excelColumn: 'HS编码', crmField: 'hsCode' },
          { excelColumn: '产品类别', crmField: 'category' },
          { excelColumn: '产品描述', crmField: 'description' },
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasErrors).toBe(true);
    expect(validateResponse.body.errors).toBeDefined();

    // Should have errors for invalid HS code format
    const hsCodeErrors = validateResponse.body.errors.filter((e: any) =>
      e.errors.some((err: string) => err.includes('HS编码') || err.includes('格式')),
    );
    expect(hsCodeErrors.length).toBeGreaterThan(0);
  });

  it('should generate error report for failed imports', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/products/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    const startResponse = await request(app.getHttpServer())
      .post('/import/products/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        columnMappings: [
          { excelColumn: '产品名称', crmField: 'name' },
          { excelColumn: 'HS编码', crmField: 'hsCode' },
          { excelColumn: '产品类别', crmField: 'category' },
          { excelColumn: '产品描述', crmField: 'description' },
        ],
      });

    expect(startResponse.status).toBe(202);
    const taskId = startResponse.body.taskId;

    // Wait for import to complete
    let completed = false;
    let importResult: any = null;
    const maxWaitTime = 60000; // 1 minute max wait time
    const startTime = Date.now();

    while (!completed && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await request(app.getHttpServer())
        .get(`/import/products/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      const status = statusResponse.body.status;

      if (status === 'completed' || status === 'failed') {
        completed = true;
        importResult = statusResponse.body;
      }
    }

    expect(completed).toBe(true);
    expect(importResult).toBeDefined();

    // If there are failures, error report URL should be available
    if (importResult.failureCount > 0 && importResult.errorReportUrl) {
      const reportResponse = await request(app.getHttpServer())
        .get(`/import/products/reports/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(reportResponse.status).toBe(200);
      expect(reportResponse.headers['content-type']).toContain('spreadsheetml');
    }
  }, 120000); // 2 minute timeout
});


