/**
 * CSV Parser Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CsvParserService } from './csv-parser.service';
import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

describe('CsvParserService', () => {
  let service: CsvParserService;
  let testCsvPath: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvParserService],
    }).compile();

    service = module.get<CsvParserService>(CsvParserService);

    // Use the test CSV file (relative to project root)
    testCsvPath = path.join(process.cwd(), 'test/fixtures/test-customers.csv');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseFile', () => {
    it('should parse CSV file and return rows', async () => {
      const result = await service.parseFile(testCsvPath);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result[0]['客户名称']).toBe('测试公司1');
      expect(result[0]['客户类型']).toBe('BUYER');
      expect(result[0]['邮箱']).toBe('test1@example.com');
    });

    it('should throw BadRequestException for non-existent file', async () => {
      await expect(service.parseFile('/nonexistent/file.csv')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getColumns', () => {
    it('should get column names from CSV file', async () => {
      const columns = await service.getColumns(testCsvPath);

      expect(columns).toBeDefined();
      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
      expect(columns).toContain('客户名称');
      expect(columns).toContain('客户类型');
      expect(columns).toContain('邮箱');
    });

    it('should throw BadRequestException for non-existent file', async () => {
      await expect(service.getColumns('/nonexistent/file.csv')).rejects.toThrow(BadRequestException);
    });
  });
});

