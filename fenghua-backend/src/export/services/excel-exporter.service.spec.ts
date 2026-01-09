/**
 * Excel Exporter Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExcelExporterService } from './excel-exporter.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as XLSX from 'xlsx';

describe('ExcelExporterService', () => {
  let service: ExcelExporterService;
  let testDir: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelExporterService],
    }).compile();

    service = module.get<ExcelExporterService>(ExcelExporterService);
    testDir = path.join(os.tmpdir(), `excel-exporter-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('exportToFile', () => {
    it('should export data to Excel file', async () => {
      const data = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];
      const filePath = path.join(testDir, 'test.xlsx');

      await service.exportToFile(data, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      expect(jsonData).toHaveLength(2);
      expect(jsonData[0]).toMatchObject({ id: '1', name: 'Test 1', value: 100 });
    });

    it('should export empty array to Excel file with headers only', async () => {
      const data: any[] = [];
      const filePath = path.join(testDir, 'empty.xlsx');
      const headers = ['id', 'name'];

      await service.exportToFile(data, filePath, 'Sheet1', headers);

      expect(fs.existsSync(filePath)).toBe(true);

      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      expect(jsonData).toHaveLength(0);
      // Check headers
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      expect(range.e.c - range.s.c + 1).toBe(2); // 2 columns
    });

    it('should use custom sheet name', async () => {
      const data = [{ id: '1', name: 'Test' }];
      const filePath = path.join(testDir, 'custom-sheet.xlsx');

      await service.exportToFile(data, filePath, 'CustomSheet');

      const workbook = XLSX.readFile(filePath);
      expect(workbook.SheetNames[0]).toBe('CustomSheet');
    });

    it('should handle custom headers', async () => {
      const data = [{ id: '1', name: 'Test', value: 100 }];
      const filePath = path.join(testDir, 'custom-headers.xlsx');
      const headers = ['id', 'name']; // Only export id and name

      await service.exportToFile(data, filePath, 'Sheet1', headers);

      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      expect(jsonData[0]).toHaveProperty('id');
      expect(jsonData[0]).toHaveProperty('name');
      expect(jsonData[0]).not.toHaveProperty('value');
    });
  });
});


