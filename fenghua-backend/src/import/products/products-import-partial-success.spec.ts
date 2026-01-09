/**
 * Partial Success Import Tests
 * 
 * Tests for partial success import scenarios (some records succeed, some fail)
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

(shouldSkipIntegrationTests ? describe.skip : describe)('Products Partial Success Import Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let partialSuccessExcelPath: string;

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

    // Create test Excel file with mixed valid/invalid data
    const testData = [
      // Valid records
      { '产品名称': '有效产品1', 'HS编码': '1111111111', '产品类别': '电子产品', '产品描述': '有效产品1' },
      { '产品名称': '有效产品2', 'HS编码': '2222222222', '产品类别': '机械设备', '产品描述': '有效产品2' },
      // Invalid records (missing required fields)
      { '产品名称': '', 'HS编码': '3333333333', '产品类别': '化工产品', '产品描述': '无效产品1' }, // Missing name
      { '产品名称': '无效产品2', 'HS编码': '', '产品类别': '电子产品', '产品描述': '无效产品2' }, // Missing HS code
      { '产品名称': '无效产品3', 'HS编码': '4444444444', '产品类别': '', '产品描述': '无效产品3' }, // Missing category
      // Invalid HS code format
      { '产品名称': '无效产品4', 'HS编码': '12345', '产品类别': '机械设备', '产品描述': '无效产品4' }, // Invalid HS code format
      // Valid record
      { '产品名称': '有效产品3', 'HS编码': '5555555555', '产品类别': '化工产品', '产品描述': '有效产品3' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    partialSuccessExcelPath = path.join(testDir, 'partial-success-products-test.xlsx');
    XLSX.writeFile(workbook, partialSuccessExcelPath);
  });

  afterAll(async () => {
    // Clean up test file
    if (partialSuccessExcelPath && fs.existsSync(partialSuccessExcelPath)) {
      fs.unlinkSync(partialSuccessExcelPath);
    }

    await app.close();
  });

  it('should handle partial success import (some records succeed, some fail)', async () => {
    // Upload file
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/products/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', partialSuccessExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    // Validate data - should detect errors
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
    expect(validateResponse.body.totalRecords).toBe(7);
    expect(validateResponse.body.validRecords).toBeGreaterThan(0);
    expect(validateResponse.body.invalidRecords).toBeGreaterThan(0);
    expect(validateResponse.body.hasErrors).toBe(true);
    expect(validateResponse.body.errors).toBeDefined();
    expect(validateResponse.body.errors.length).toBeGreaterThan(0);

    // Start import - should succeed for valid records
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
    expect(importResult.totalRecords).toBe(7);
    expect(importResult.successCount).toBeGreaterThan(0);
    expect(importResult.failureCount).toBeGreaterThan(0);
    expect(importResult.successCount + importResult.failureCount).toBe(importResult.totalRecords);

    // Should have error report if there are failures
    if (importResult.failureCount > 0) {
      expect(importResult.errorReportUrl).toBeDefined();
    }
  }, 120000); // 2 minute timeout
});


