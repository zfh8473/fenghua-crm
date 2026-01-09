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
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Skip integration tests if not explicitly enabled
const shouldSkipIntegrationTests = !process.env.RUN_INTEGRATION_TESTS;

(shouldSkipIntegrationTests ? describe.skip : describe)('Partial Success Import Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let mixedDataExcelPath: string;

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

    // Create test Excel file with mixed valid and invalid data
    const testData = [
      // Valid records
      { '客户名称': '有效公司1', '客户类型': 'BUYER', '邮箱': 'valid1@test.com' },
      { '客户名称': '有效公司2', '客户类型': 'SUPPLIER', '邮箱': 'valid2@test.com' },
      // Invalid records (missing required fields)
      { '客户名称': '', '客户类型': 'BUYER', '邮箱': 'invalid1@test.com' }, // Missing name
      { '客户名称': '无效公司2', '客户类型': '', '邮箱': 'invalid2@test.com' }, // Missing customerType
      { '客户名称': '无效公司3', '客户类型': 'INVALID', '邮箱': 'invalid3@test.com' }, // Invalid customerType
      // Valid records
      { '客户名称': '有效公司3', '客户类型': 'BUYER', '邮箱': 'valid3@test.com' },
      { '客户名称': '有效公司4', '客户类型': 'SUPPLIER', '邮箱': 'valid4@test.com' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    mixedDataExcelPath = path.join(testDir, 'mixed-data-import-test.xlsx');
    XLSX.writeFile(workbook, mixedDataExcelPath);
  });

  afterAll(async () => {
    // Clean up test file
    if (mixedDataExcelPath && fs.existsSync(mixedDataExcelPath)) {
      fs.unlinkSync(mixedDataExcelPath);
    }

    await app.close();
  });

  it('should handle partial success import (some records succeed, some fail)', async () => {
    // 1. Upload file
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/customers/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', mixedDataExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    // 2. Validate data
    const validateResponse = await request(app.getHttpServer())
      .post('/import/customers/validate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        customMappings: [
          { excelColumn: '客户名称', crmField: 'name' },
          { excelColumn: '客户类型', crmField: 'customerType' },
          { excelColumn: '邮箱', crmField: 'email' },
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasErrors).toBe(true);
    expect(validateResponse.body.validRecords).toBeGreaterThan(0);
    expect(validateResponse.body.invalidRecords).toBeGreaterThan(0);

    // 3. Start import (should proceed with valid records only)
    const startResponse = await request(app.getHttpServer())
      .post('/import/customers/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        columnMappings: [
          { excelColumn: '客户名称', crmField: 'name' },
          { excelColumn: '客户类型', crmField: 'customerType' },
          { excelColumn: '邮箱', crmField: 'email' },
        ],
      });

    expect(startResponse.status).toBe(202);
    const taskId = startResponse.body.taskId;

    // 4. Poll for completion
    const maxWaitTime = 60000; // 1 minute
    const pollInterval = 2000; // 2 seconds
    const pollStartTime = Date.now();

    let importResult;
    while (Date.now() - pollStartTime < maxWaitTime) {
      const statusResponse = await request(app.getHttpServer())
        .get(`/import/customers/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      importResult = statusResponse.body;

      if (importResult.status === 'completed' || importResult.status === 'failed') {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Assertions
    expect(importResult).toBeDefined();
    expect(importResult.status).toBe('completed');
    expect(importResult.successCount).toBeGreaterThan(0);
    expect(importResult.failureCount).toBeGreaterThan(0);
    expect(importResult.successCount + importResult.failureCount).toBe(importResult.totalRecords);

    // Verify that error report is generated
    if (importResult.failureCount > 0) {
      expect(importResult.errorReportUrl).toBeDefined();
    }
  }, 2 * 60 * 1000); // 2 minute timeout
});

