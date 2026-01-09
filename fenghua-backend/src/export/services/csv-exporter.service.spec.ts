/**
 * CSV Exporter Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CsvExporterService } from './csv-exporter.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CsvExporterService', () => {
  let service: CsvExporterService;
  let testDir: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvExporterService],
    }).compile();

    service = module.get<CsvExporterService>(CsvExporterService);
    testDir = path.join(os.tmpdir(), `csv-exporter-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('exportToFile', () => {
    it('should export data to CSV file', async () => {
      const data = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];
      const filePath = path.join(testDir, 'test.csv');

      await service.exportToFile(data, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('"id","name","value"');
      expect(content).toContain('"1","Test 1","100"');
      expect(content).toContain('"2","Test 2","200"');
    });

    it('should export empty array to CSV file with headers only', async () => {
      const data: any[] = [];
      const filePath = path.join(testDir, 'empty.csv');
      const headers = ['id', 'name'];

      await service.exportToFile(data, filePath, headers);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      // When data is empty, csv-stringify may not quote headers
      expect(content.trim()).toMatch(/id.*name/);
    });

    it('should handle custom headers', async () => {
      const data = [{ id: '1', name: 'Test', value: 100 }];
      const filePath = path.join(testDir, 'custom-headers.csv');
      const headers = ['id', 'name']; // Only export id and name

      await service.exportToFile(data, filePath, headers);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('"id","name"');
      expect(content).not.toContain('"value"');
    });

    it('should handle special characters in CSV', async () => {
      const data = [
        { id: '1', name: 'Test, with comma', description: 'Test "quoted" text' },
      ];
      const filePath = path.join(testDir, 'special-chars.csv');

      await service.exportToFile(data, filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      // csv-stringify automatically quotes fields with special characters
      expect(content).toContain('"Test, with comma"');
      // Double quotes are escaped as double double quotes in CSV (""quoted"")
      // The actual output has the quoted text with escaped quotes
      expect(content).toContain('""quoted""');
    });
  });
});

