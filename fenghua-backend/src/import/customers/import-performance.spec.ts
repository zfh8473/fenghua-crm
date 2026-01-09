/**
 * Import Performance Tests
 * 
 * Tests for large file import performance (5000+ records)
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

(shouldSkipPerformanceTests ? describe.skip : describe)('Import Performance Tests', () => {
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

    largeExcelPath = path.join(testDir, 'large-import-test.xlsx');
    const largeData = Array.from({ length: 5000 }, (_, i) => ({
      '客户名称': `性能测试公司${i + 1}`,
      '客户类型': i % 2 === 0 ? 'BUYER' : 'SUPPLIER',
      '邮箱': `perf-test-${i + 1}@test.com`,
      '电话': `${String(i + 1).padStart(10, '0')}`,
      '员工数': (i + 1) * 10,
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
    const startTime = Date.now();

    // 1. Upload file
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/customers/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', largeExcelPath);

    expect(uploadResponse.status).toBe(201);
    const fileId = uploadResponse.body.fileId;

    const uploadTime = Date.now() - startTime;
    console.log(`📤 File upload took ${uploadTime}ms (${(uploadTime / 1000).toFixed(2)}s)`);

    // 2. Get mapping preview
    const previewStartTime = Date.now();
    const previewResponse = await request(app.getHttpServer())
      .post('/import/customers/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fileId,
        customMappings: [
          { excelColumn: '客户名称', crmField: 'name' },
          { excelColumn: '客户类型', crmField: 'customerType' },
          { excelColumn: '邮箱', crmField: 'email' },
          { excelColumn: '电话', crmField: 'phone' },
          { excelColumn: '员工数', crmField: 'employees' },
        ],
      });

    expect(previewResponse.status).toBe(200);
    const previewTime = Date.now() - previewStartTime;
    console.log(`🔍 Mapping preview took ${previewTime}ms (${(previewTime / 1000).toFixed(2)}s)`);

    // 3. Validate data
    const validateStartTime = Date.now();
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
    expect(validateResponse.body.totalRecords).toBe(5000);
    const validateTime = Date.now() - validateStartTime;
    console.log(`✅ Data validation took ${validateTime}ms (${(validateTime / 1000).toFixed(2)}s)`);
    console.log(`   - Valid records: ${validateResponse.body.validRecords}`);
    console.log(`   - Invalid records: ${validateResponse.body.invalidRecords}`);

    // 4. Start import
    const importStartTime = Date.now();
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
    console.log(`🚀 Import task started: ${taskId}`);

    // 5. Poll for completion (with timeout)
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes
    const pollInterval = 2000; // 2 seconds
    const pollStartTime = Date.now();

    let importResult;
    let pollCount = 0;
    while (Date.now() - pollStartTime < maxWaitTime) {
      pollCount++;
      const statusResponse = await request(app.getHttpServer())
        .get(`/import/customers/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      importResult = statusResponse.body;

      if (pollCount % 10 === 0 || importResult.status !== 'processing') {
        console.log(
          `📊 Poll #${pollCount}: Status=${importResult.status}, Progress=${importResult.progress || 0}%, ` +
          `Success=${importResult.successCount}, Failed=${importResult.failureCount}`,
        );
      }

      if (importResult.status === 'completed' || importResult.status === 'failed') {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    const totalTime = Date.now() - startTime;
    const importTime = Date.now() - importStartTime;
    console.log(`\n📈 Performance Summary:`);
    console.log(`   - Upload: ${uploadTime}ms (${(uploadTime / 1000).toFixed(2)}s)`);
    console.log(`   - Preview: ${previewTime}ms (${(previewTime / 1000).toFixed(2)}s)`);
    console.log(`   - Validation: ${validateTime}ms (${(validateTime / 1000).toFixed(2)}s)`);
    console.log(`   - Import: ${importTime}ms (${(importTime / 1000).toFixed(2)}s)`);
    console.log(`   - Total: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`\n📊 Import Result:`);
    console.log(`   - Status: ${importResult.status}`);
    console.log(`   - Total Records: ${importResult.totalRecords}`);
    console.log(`   - Success: ${importResult.successCount}`);
    console.log(`   - Failed: ${importResult.failureCount}`);

    // Assertions
    expect(importResult).toBeDefined();
    expect(importResult.status).toBe('completed');
    expect(importResult.totalRecords).toBe(5000);
    expect(importResult.successCount).toBeGreaterThan(0);

    // Performance assertions
    expect(uploadTime).toBeLessThan(10000); // Upload should take < 10s
    expect(previewTime).toBeLessThan(30000); // Preview should take < 30s
    expect(validateTime).toBeLessThan(60000); // Validation should take < 60s
    expect(totalTime).toBeLessThan(10 * 60 * 1000); // Total should take < 10 minutes
  }, 15 * 60 * 1000); // 15 minute timeout
});

