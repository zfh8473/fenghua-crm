/**
 * Interactions Import Performance Tests
 * 
 * Tests for performance and scalability of interaction import
 * All custom code is proprietary and not open source.
 * 
 * Note: These tests require a running database, Redis, and backend server.
 * Set RUN_PERFORMANCE_TESTS=true to run performance tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Skip performance tests if not explicitly enabled
const shouldSkipPerformanceTests = !process.env.RUN_PERFORMANCE_TESTS;

(shouldSkipPerformanceTests ? describe.skip : describe)('Interactions Import Performance Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let largeExcelPath: string;

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

    // Create large test Excel file (5000+ records)
    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    largeExcelPath = path.join(testDir, 'large-interactions-import-test.xlsx');
    const largeData = Array.from({ length: 5000 }, (_, i) => ({
      '客户名称': `性能测试客户${(i % 10) + 1}`,
      '产品名称': `性能测试产品${(i % 20) + 1}`,
      '互动类型': i % 2 === 0 ? '初步接触' : '产品询价',
      '互动时间': new Date(2025, 0, 1 + (i % 365), 10 + (i % 12), i % 60).toISOString(),
      '互动描述': `这是性能测试互动${i + 1}的描述`,
      '状态': i % 4 === 0 ? '进行中' : i % 4 === 1 ? '已完成' : i % 4 === 2 ? '已取消' : '需要跟进',
    }));

    const worksheet = XLSX.utils.json_to_sheet(largeData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, largeExcelPath);
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    // Clean up test file
    if (largeExcelPath && fs.existsSync(largeExcelPath)) {
      fs.unlinkSync(largeExcelPath);
    }

    await app.close();
  });

  it('should handle large file import (5000+ records) within reasonable time', async () => {
    // Upload file
    const uploadStartTime = Date.now();
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/interactions/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', largeExcelPath);

    const uploadTime = Date.now() - uploadStartTime;
    expect(uploadResponse.status).toBe(201);
    expect(uploadTime).toBeLessThan(10000); // Upload should complete within 10 seconds

    const fileId = uploadResponse.body.fileId;

    // Get mapping preview
    const previewStartTime = Date.now();
    const previewResponse = await request(app.getHttpServer())
      .post('/import/interactions/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        customMappings: [
          { excelColumn: '客户名称', crmField: 'customerName' },
          { excelColumn: '产品名称', crmField: 'productName' },
          { excelColumn: '互动类型', crmField: 'interactionType' },
          { excelColumn: '互动时间', crmField: 'interactionDate' },
          { excelColumn: '互动描述', crmField: 'description' },
          { excelColumn: '状态', crmField: 'status' },
        ],
      });

    const previewTime = Date.now() - previewStartTime;
    expect(previewResponse.status).toBe(200);
    expect(previewTime).toBeLessThan(30000); // Preview should complete within 30 seconds

    // Validate data
    const validateStartTime = Date.now();
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

    const validateTime = Date.now() - validateStartTime;
    expect(validateResponse.status).toBe(200);
    expect(validateTime).toBeLessThan(60000); // Validation should complete within 60 seconds for 5000 records

    console.log(`Performance metrics:
      - Upload: ${uploadTime}ms
      - Preview: ${previewTime}ms
      - Validation: ${validateTime}ms
      - Total: ${uploadTime + previewTime + validateTime}ms`);
  }, 120000); // 2 minute timeout for large file test
});


