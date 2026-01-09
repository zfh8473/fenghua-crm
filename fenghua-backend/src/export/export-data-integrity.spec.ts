/**
 * Export Data Integrity Tests
 * 
 * Tests export data integrity and completeness
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

describe('Export Data Integrity', () => {
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

    testDir = path.join(os.tmpdir(), `export-integrity-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Data Completeness', () => {
    const testData = [
      { id: '1', name: 'Test 1', value: 100, description: 'Description 1' },
      { id: '2', name: 'Test 2', value: 200, description: 'Description 2' },
      { id: '3', name: 'Test 3', value: 300, description: 'Description 3' },
    ];

    it('should export all records in JSON format', async () => {
      const filePath = path.join(testDir, 'complete.json');

      await jsonExporter.exportToFile(testData, filePath);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.data).toHaveLength(3);
      expect(content.metadata.totalRecords).toBe(3);
    });

    it('should export all records in CSV format', async () => {
      const filePath = path.join(testDir, 'complete.csv');

      await csvExporter.exportToFile(testData, filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      // Header + 3 data rows
      expect(lines.length).toBe(4);
    });

    it('should export all records in Excel format', async () => {
      const filePath = path.join(testDir, 'complete.xlsx');

      await excelExporter.exportToFile(testData, filePath);

      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      expect(jsonData).toHaveLength(3);
    });
  });

  describe('Data Accuracy', () => {
    it('should preserve data values in JSON export', async () => {
      const testData = [
        { id: '1', name: 'Test', value: 123.45, active: true },
      ];
      const filePath = path.join(testDir, 'accuracy.json');

      await jsonExporter.exportToFile(testData, filePath);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.data[0].id).toBe('1');
      expect(content.data[0].name).toBe('Test');
      expect(content.data[0].value).toBe(123.45);
      expect(content.data[0].active).toBe(true);
    });

    it('should preserve data values in CSV export', async () => {
      const testData = [
        { id: '1', name: 'Test', value: 123.45 },
      ];
      const filePath = path.join(testDir, 'accuracy.csv');

      await csvExporter.exportToFile(testData, filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('1');
      expect(content).toContain('Test');
      expect(content).toContain('123.45');
    });

    it('should preserve data values in Excel export', async () => {
      const testData = [
        { id: '1', name: 'Test', value: 123.45 },
      ];
      const filePath = path.join(testDir, 'accuracy.xlsx');

      await excelExporter.exportToFile(testData, filePath);

      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      expect(jsonData[0].id).toBe('1');
      expect(jsonData[0].name).toBe('Test');
      expect(jsonData[0].value).toBe(123.45);
    });
  });

  describe('Field Mapping', () => {
    it('should export all fields in JSON', async () => {
      const testData = [
        {
          id: '1',
          name: 'Test',
          email: 'test@example.com',
          phone: '123-456-7890',
          address: '123 Main St',
        },
      ];
      const filePath = path.join(testDir, 'fields.json');

      await jsonExporter.exportToFile(testData, filePath);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const exportedRecord = content.data[0];

      expect(exportedRecord).toHaveProperty('id');
      expect(exportedRecord).toHaveProperty('name');
      expect(exportedRecord).toHaveProperty('email');
      expect(exportedRecord).toHaveProperty('phone');
      expect(exportedRecord).toHaveProperty('address');
    });

    it('should export all fields in CSV', async () => {
      const testData = [
        {
          id: '1',
          name: 'Test',
          email: 'test@example.com',
        },
      ];
      const filePath = path.join(testDir, 'fields.csv');

      await csvExporter.exportToFile(testData, filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('id');
      expect(content).toContain('name');
      expect(content).toContain('email');
    });

    it('should export all fields in Excel', async () => {
      const testData = [
        {
          id: '1',
          name: 'Test',
          email: 'test@example.com',
        },
      ];
      const filePath = path.join(testDir, 'fields.xlsx');

      await excelExporter.exportToFile(testData, filePath);

      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      expect(jsonData[0]).toHaveProperty('id');
      expect(jsonData[0]).toHaveProperty('name');
      expect(jsonData[0]).toHaveProperty('email');
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty data in JSON export', async () => {
      const filePath = path.join(testDir, 'empty.json');

      await jsonExporter.exportToFile([], filePath);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.data).toEqual([]);
      expect(content.metadata.totalRecords).toBe(0);
    });

    it('should handle empty data in CSV export', async () => {
      const filePath = path.join(testDir, 'empty.csv');

      await csvExporter.exportToFile([], filePath, ['id', 'name']);

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.trim()).toMatch(/id.*name/);
    });

    it('should handle empty data in Excel export', async () => {
      const filePath = path.join(testDir, 'empty.xlsx');

      await excelExporter.exportToFile([], filePath, 'Sheet1', ['id', 'name']);

      expect(fs.existsSync(filePath)).toBe(true);
      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      expect(jsonData).toHaveLength(0);
    });
  });
});

