/**
 * JSON Exporter Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JsonExporterService } from './json-exporter.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('JsonExporterService', () => {
  let service: JsonExporterService;
  let testDir: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonExporterService],
    }).compile();

    service = module.get<JsonExporterService>(JsonExporterService);
    testDir = path.join(os.tmpdir(), `json-exporter-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('exportToFile', () => {
    it('should export data to JSON file', async () => {
      const data = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];
      const filePath = path.join(testDir, 'test.json');

      await service.exportToFile(data, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.metadata).toBeDefined();
      expect(content.metadata.format).toBe('JSON');
      expect(content.metadata.totalRecords).toBe(2);
      expect(content.data).toEqual(data);
    });

    it('should export empty array to JSON file', async () => {
      const data: any[] = [];
      const filePath = path.join(testDir, 'empty.json');

      await service.exportToFile(data, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.metadata.totalRecords).toBe(0);
      expect(content.data).toEqual([]);
    });

    it('should include custom metadata', async () => {
      const data = [{ id: '1', name: 'Test' }];
      const filePath = path.join(testDir, 'metadata.json');
      const metadata = {
        exportType: 'CUSTOMER',
        version: '2.0',
      };

      await service.exportToFile(data, filePath, metadata);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.metadata.exportType).toBe('CUSTOMER');
      expect(content.metadata.version).toBe('2.0');
    });
  });

  describe('exportToStream', () => {
    it('should export data to JSON stream', async () => {
      async function* dataGenerator() {
        yield { id: '1', name: 'Test 1' };
        yield { id: '2', name: 'Test 2' };
      }

      const filePath = path.join(testDir, 'stream.json');

      await service.exportToStream(dataGenerator(), filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.metadata).toBeDefined();
      expect(content.data).toHaveLength(2);
    });
  });
});


