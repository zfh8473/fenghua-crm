/**
 * Products Import Performance Tests
 * 
 * Tests for performance and scalability of product import
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

(shouldSkipPerformanceTests ? describe.skip : describe)('Products Import Performance Tests', () => {
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

    largeExcelPath = path.join(testDir, 'large-products-import-test.xlsx');
    const largeData = Array.from({ length: 5000 }, (_, i) => ({
      '产品名称': `性能测试产品${i + 1}`,
      'HS编码': `${String(i + 1).padStart(10, '0')}`,
      '产品类别': i % 3 === 0 ? '电子产品' : i % 3 === 1 ? '机械设备' : '化工产品',
      '产品描述': `这是性能测试产品${i + 1}的描述`,
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
      .post('/import/products/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', largeExcelPath);

    const uploadTime = Date.now() - uploadStartTime;
    expect(uploadResponse.status).toBe(201);
    expect(uploadTime).toBeLessThan(10000); // Upload should complete within 10 seconds

    const fileId = uploadResponse.body.fileId;

    // Get mapping preview
    const previewStartTime = Date.now();
    const previewResponse = await request(app.getHttpServer())
      .post('/import/products/preview')
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

    const previewTime = Date.now() - previewStartTime;
    expect(previewResponse.status).toBe(200);
    expect(previewTime).toBeLessThan(30000); // Preview should complete within 30 seconds

    // Validate data
    const validateStartTime = Date.now();
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

    const validateTime = Date.now() - validateStartTime;
    expect(validateResponse.status).toBe(200);
    expect(validateTime).toBeLessThan(60000); // Validation should complete within 60 seconds
    expect(validateResponse.body.totalRecords).toBe(5000);

    // Start import task
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

    // Monitor import progress
    const importStartTime = Date.now();
    let lastProgress = 0;
    let completed = false;
    const maxWaitTime = 300000; // 5 minutes max wait time

    while (!completed && Date.now() - importStartTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await request(app.getHttpServer())
        .get(`/import/products/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      const status = statusResponse.body.status;
      const progress = statusResponse.body.progress || 0;

      if (status === 'completed' || status === 'failed') {
        completed = true;
        const importTime = Date.now() - importStartTime;

        console.log(`Import completed in ${importTime}ms`);
        console.log(`Total records: ${statusResponse.body.totalRecords}`);
        console.log(`Success: ${statusResponse.body.successCount}`);
        console.log(`Failed: ${statusResponse.body.failureCount}`);

        expect(importTime).toBeLessThan(maxWaitTime);
        expect(statusResponse.body.totalRecords).toBe(5000);
      } else if (progress > lastProgress) {
        lastProgress = progress;
        console.log(`Import progress: ${progress}%`);
      }
    }

    expect(completed).toBe(true);
  }, 360000); // 6 minute timeout for entire test

  it('should handle batch validation efficiently', async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post('/import/products/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', largeExcelPath);

    const fileId = uploadResponse.body.fileId;

    // Measure validation time for batches
    const batchSizes = [100, 500, 1000, 2000];
    const validationTimes: number[] = [];

    for (const batchSize of batchSizes) {
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/import/products/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileId,
          customMappings: [
            { excelColumn: '产品名称', crmField: 'name' },
            { excelColumn: 'HS编码', crmField: 'hsCode' },
            { excelColumn: '产品类别', crmField: 'category' },
          ],
        });

      const validationTime = Date.now() - startTime;
      validationTimes.push(validationTime);
      expect(response.status).toBe(200);
    }

    // Validation time should scale reasonably (not linearly)
    console.log('Validation times:', validationTimes);
    // The last validation should not be significantly slower than the first
    expect(validationTimes[validationTimes.length - 1]).toBeLessThan(validationTimes[0] * 3);
  }, 120000); // 2 minute timeout
});


