/**
 * Excel Parser Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExcelParserService } from './excel-parser.service';
import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

describe('ExcelParserService', () => {
  let service: ExcelParserService;
  let testExcelPath: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelParserService],
    }).compile();

    service = module.get<ExcelParserService>(ExcelParserService);

    // Create a test Excel file
    const testData = [
      { '客户名称': '测试公司1', '客户类型': 'BUYER', '邮箱': 'test1@example.com', '电话': '123-456-7890', '员工数': 100 },
      { '客户名称': '测试公司2', '客户类型': 'SUPPLIER', '邮箱': 'test2@example.com', '电话': '234-567-8901', '员工数': 200 },
      { '客户名称': '测试公司3', '客户类型': 'BUYER', '邮箱': 'test3@example.com', '电话': '345-678-9012', '员工数': 300 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const testDir = path.join(process.cwd(), 'test/fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    testExcelPath = path.join(testDir, 'test-customers.xlsx');
    XLSX.writeFile(workbook, testExcelPath);
  });

  afterEach(() => {
    // Clean up test file
    if (testExcelPath && fs.existsSync(testExcelPath)) {
      fs.unlinkSync(testExcelPath);
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseFile', () => {
    it('should parse Excel file and return rows', async () => {
      const result = await service.parseFile(testExcelPath);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]['客户名称']).toBe('测试公司1');
      expect(result[0]['客户类型']).toBe('BUYER');
    });

    it('should throw BadRequestException for non-existent file', async () => {
      await expect(service.parseFile('/nonexistent/file.xlsx')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getColumns', () => {
    it('should get column names from Excel file', async () => {
      const columns = await service.getColumns(testExcelPath);

      expect(columns).toBeDefined();
      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
      expect(columns).toContain('客户名称');
      expect(columns).toContain('客户类型');
    });

    it('should throw BadRequestException for non-existent file', async () => {
      await expect(service.getColumns('/nonexistent/file.xlsx')).rejects.toThrow(BadRequestException);
    });
  });
});

