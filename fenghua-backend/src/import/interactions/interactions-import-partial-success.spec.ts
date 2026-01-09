/**
 * Partial Success Import Tests for Interactions
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

(shouldSkipIntegrationTests ? describe.skip : describe)('Interactions Partial Success Import Tests', () => {
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
      {
        '客户名称': '有效客户1',
        '产品名称': '有效产品1',
        '互动类型': '初步接触',
        '互动时间': '2025-01-08T10:00:00Z',
        '互动描述': '有效互动1',
      },
      {
        '客户名称': '有效客户2',
        '产品名称': '有效产品2',
        '互动类型': '产品询价',
        '互动时间': '2025-01-08T11:00:00Z',
        '互动描述': '有效互动2',
      },
      // Invalid records (missing required fields)
      {
        '客户名称': '',
        '产品名称': '无效产品1',
        '互动类型': '报价',
        '互动时间': '2025-01-08T12:00:00Z',
        '互动描述': '无效互动1',
      }, // Missing customer name
      {
        '客户名称': '无效客户2',
        '产品名称': '',
        '互动类型': '初步接触',
        '互动时间': '2025-01-08T13:00:00Z',
        '互动描述': '无效互动2',
      }, // Missing product name
      {
        '客户名称': '无效客户3',
        '产品名称': '无效产品3',
        '互动类型': '',
        '互动时间': '2025-01-08T14:00:00Z',
        '互动描述': '无效互动3',
      }, // Missing interaction type
      {
        '客户名称': '无效客户4',
        '产品名称': '无效产品4',
        '互动类型': '初步接触',
        '互动时间': '',
        '互动描述': '无效互动4',
      }, // Missing interaction date
      // Invalid date format
      {
        '客户名称': '无效客户5',
        '产品名称': '无效产品5',
        '互动类型': '产品询价',
        '互动时间': 'invalid-date',
        '互动描述': '无效互动5',
      },
      // Valid record
      {
        '客户名称': '有效客户3',
        '产品名称': '有效产品3',
        '互动类型': '报价',
        '互动时间': '2025-01-08T15:00:00Z',
        '互动描述': '有效互动3',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    partialSuccessExcelPath = path.join(testDir, 'partial-success-interactions-test.xlsx');
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
      .post('/import/interactions/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', partialSuccessExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    // Validate data - should detect errors
    const validateResponse = await request(app.getHttpServer())
      .post('/import/interactions/validate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        columnMappings: [
          { excelColumn: '客户名称', crmField: 'customerName' },
          { excelColumn: '产品名称', crmField: 'productName' },
          { excelColumn: '互动类型', crmField: 'interactionType' },
          { excelColumn: '互动时间', crmField: 'interactionDate' },
          { excelColumn: '互动描述', crmField: 'description' },
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasErrors).toBe(true);
    expect(validateResponse.body.invalidRecords).toBeGreaterThan(0);
    expect(validateResponse.body.validRecords).toBeGreaterThan(0);

    // Start import - should handle partial success
    const startResponse = await request(app.getHttpServer())
      .post('/import/interactions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        columnMappings: [
          { excelColumn: '客户名称', crmField: 'customerName' },
          { excelColumn: '产品名称', crmField: 'productName' },
          { excelColumn: '互动类型', crmField: 'interactionType' },
          { excelColumn: '互动时间', crmField: 'interactionDate' },
          { excelColumn: '互动描述', crmField: 'description' },
        ],
      });

    expect(startResponse.status).toBe(201);
    const taskId = startResponse.body.taskId;

    // Wait for import to complete (polling)
    let importResult;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max

    while (attempts < maxAttempts) {
      const statusResponse = await request(app.getHttpServer())
        .get(`/import/interactions/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      importResult = statusResponse.body;

      if (importResult.status === 'completed' || importResult.status === 'failed') {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
    }

    // Verify partial success
    expect(importResult.status).toBe('completed');
    expect(importResult.successRecords).toBeGreaterThan(0);
    expect(importResult.failedRecords).toBeGreaterThan(0);
    expect(importResult.totalRecords).toBe(importResult.successRecords + importResult.failedRecords);
  }, 120000); // 2 minute timeout
});


