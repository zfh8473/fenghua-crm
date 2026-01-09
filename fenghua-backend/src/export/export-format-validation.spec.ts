/**
 * Export Format Validation Tests
 * 
 * Tests export file format correctness
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JsonExporterService } from './services/json-exporter.service';
import { CsvExporterService } from './services/csv-exporter.service';
import { ExcelExporterService } from './services/excel-exporter.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as XLSX from 'xlsx';

describe('Export Format Validation', () => {
  let jsonExporter: JsonExporterService;
  let csvExporter: CsvExporterService;
  let excelExporter: ExcelExporterService;
  let testDir: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonExporterService,
        CsvExporterService,
        ExcelExporterService,
      ],
    }).compile();

    jsonExporter = module.get<JsonExporterService>(JsonExporterService);
    csvExporter = module.get<CsvExporterService>(CsvExporterService);
    excelExporter = module.get<ExcelExporterService>(ExcelExporterService);

    testDir = path.join(os.tmpdir(), `export-format-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('JSON Format', () => {
    it('should generate valid JSON file', async () => {
      const data = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];
      const filePath = path.join(testDir, 'test.json');

      await jsonExporter.exportToFile(data, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('data');
      expect(parsed.metadata.format).toBe('JSON');
      expect(parsed.metadata.totalRecords).toBe(2);
      expect(parsed.data).toEqual(data);
    });

    it('should include metadata in JSON export', async () => {
      const data = [{ id: '1', name: 'Test' }];
      const filePath = path.join(testDir, 'metadata.json');

      await jsonExporter.exportToFile(data, filePath, {
        exportType: 'CUSTOMER',
        version: '2.0',
      });

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.metadata.exportType).toBe('CUSTOMER');
      expect(content.metadata.version).toBe('2.0');
      expect(content.metadata.exportedAt).toBeDefined();
    });
  });

  describe('CSV Format', () => {
    it('should generate valid CSV file', async () => {
      const data = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];
      const filePath = path.join(testDir, 'test.csv');

      await csvExporter.exportToFile(data, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBeGreaterThan(1); // Header + data rows
      expect(lines[0]).toContain('id');
      expect(lines[0]).toContain('name');
      expect(lines[0]).toContain('value');
    });

    it('should handle special characters in CSV', async () => {
      const data = [
        { id: '1', name: 'Test, with comma', description: 'Test "quoted" text' },
      ];
      const filePath = path.join(testDir, 'special.csv');

      await csvExporter.exportToFile(data, filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      // CSV should properly quote fields with special characters
      expect(content).toContain('"Test, with comma"');
    });
  });

  describe('Excel Format', () => {
    it('should generate valid Excel file', async () => {
      const data = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];
      const filePath = path.join(testDir, 'test.xlsx');

      await excelExporter.exportToFile(data, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const workbook = XLSX.readFile(filePath);
      expect(workbook.SheetNames.length).toBeGreaterThan(0);

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      expect(jsonData).toHaveLength(2);
      expect(jsonData[0]).toMatchObject({ id: '1', name: 'Test 1', value: 100 });
    });

    it('should use custom sheet name', async () => {
      const data = [{ id: '1', name: 'Test' }];
      const filePath = path.join(testDir, 'custom-sheet.xlsx');

      await excelExporter.exportToFile(data, filePath, 'CustomSheet');

      const workbook = XLSX.readFile(filePath);
      expect(workbook.SheetNames[0]).toBe('CustomSheet');
    });
  });
});


