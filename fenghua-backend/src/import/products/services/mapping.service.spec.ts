/**
 * Product Mapping Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductMappingService } from './mapping.service';

describe('ProductMappingService', () => {
  let service: ProductMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductMappingService],
    }).compile();

    service = module.get<ProductMappingService>(ProductMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoMapColumns', () => {
    it('should map Chinese column names to CRM fields', () => {
      const columns = ['产品名称', 'HS编码', '产品类别'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('产品名称')).toBe('name');
      expect(mapping.get('HS编码')).toBe('hsCode');
      expect(mapping.get('产品类别')).toBe('category');
    });

    it('should handle case-insensitive matching', () => {
      const columns = ['产品名称', 'hs编码', '产品类别'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('产品名称')).toBe('name');
      expect(mapping.get('hs编码')).toBe('hsCode');
      expect(mapping.get('产品类别')).toBe('category');
    });

    it('should return empty map for unmapped columns', () => {
      const columns = ['未知列1', '未知列2'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.size).toBe(0);
    });

    it('should preserve original column names as keys', () => {
      const columns = ['产品名称 ', ' HS编码', '产品类别'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.has('产品名称 ')).toBe(true);
      expect(mapping.has(' HS编码')).toBe(true);
      expect(mapping.has('产品类别')).toBe(true);
    });
  });
});


