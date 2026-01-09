/**
 * Interactions Import Error Handling and Recovery Tests
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

(shouldSkipIntegrationTests ? describe.skip : describe)('Interactions Import Error Handling Tests', () => {
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
      // Invalid customer (non-existent)
      {
        '客户名称': '不存在的客户',
        '产品名称': '测试产品1',
        '互动类型': '初步接触',
        '互动时间': '2025-01-08T10:00:00Z',
        '互动描述': '无效客户测试',
      },
      // Invalid product (non-existent)
      {
        '客户名称': '测试客户1',
        '产品名称': '不存在的产品',
        '互动类型': '产品询价',
        '互动时间': '2025-01-08T11:00:00Z',
        '互动描述': '无效产品测试',
      },
      // Invalid interaction type
      {
        '客户名称': '测试客户2',
        '产品名称': '测试产品2',
        '互动类型': '无效的互动类型',
        '互动时间': '2025-01-08T12:00:00Z',
        '互动描述': '无效互动类型测试',
      },
      // Invalid date format
      {
        '客户名称': '测试客户3',
        '产品名称': '测试产品3',
        '互动类型': '初步接触',
        '互动时间': 'invalid-date-format',
        '互动描述': '无效日期格式测试',
      },
      // Valid record
      {
        '客户名称': '测试客户4',
        '产品名称': '测试产品4',
        '互动类型': '报价',
        '互动时间': '2025-01-08T13:00:00Z',
        '互动描述': '有效互动测试',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    errorTestExcelPath = path.join(testDir, 'error-handling-interactions-test.xlsx');
    XLSX.writeFile(workbook, errorTestExcelPath);
  });

  afterAll(async () => {
    // Clean up test file
    if (errorTestExcelPath && fs.existsSync(errorTestExcelPath)) {
      fs.unlinkSync(errorTestExcelPath);
    }

    await app.close();
  });

  it('should detect invalid customer names', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/interactions/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

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
    expect(validateResponse.body.errors).toBeDefined();
    expect(validateResponse.body.errors.length).toBeGreaterThan(0);
  });

  it('should detect invalid product names', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/interactions/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

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
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasErrors).toBe(true);
  });

  it('should detect invalid interaction types', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/interactions/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

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
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasErrors).toBe(true);
  });

  it('should detect invalid date formats', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/interactions/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', errorTestExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

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
        ],
      });

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.hasErrors).toBe(true);
  });

  it('should handle missing file gracefully', async () => {
    const response = await request(app.getHttpServer())
      .post('/import/interactions/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId: 'non-existent-file-id',
      });

    expect([400, 404]).toContain(response.status);
  });

  it('should handle invalid file format', async () => {
    // Create invalid file
    const invalidFilePath = path.join(process.cwd(), 'test/fixtures/invalid-file.txt');
    fs.writeFileSync(invalidFilePath, 'This is not a valid Excel or CSV file');

    const response = await request(app.getHttpServer())
      .post('/import/interactions/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', invalidFilePath);

    expect([400, 415]).toContain(response.status);

    // Clean up
    if (fs.existsSync(invalidFilePath)) {
      fs.unlinkSync(invalidFilePath);
    }
  });
});


