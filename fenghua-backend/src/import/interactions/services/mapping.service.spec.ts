/**
 * Interaction Mapping Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InteractionMappingService } from './mapping.service';

describe('InteractionMappingService', () => {
  let service: InteractionMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InteractionMappingService],
    }).compile();

    service = module.get<InteractionMappingService>(InteractionMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoMapColumns', () => {
    it('should map Chinese column names correctly', () => {
      const columns = ['客户名称', '产品名称', '互动类型', '互动时间'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('客户名称')).toBe('customerName');
      expect(mapping.get('产品名称')).toBe('productName');
      expect(mapping.get('互动类型')).toBe('interactionType');
      expect(mapping.get('互动时间')).toBe('interactionDate');
    });

    it('should map English column names correctly', () => {
      const columns = ['Customer Name', 'Product Name', 'Interaction Type', 'Interaction Date'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('Customer Name')).toBe('customerName');
      expect(mapping.get('Product Name')).toBe('productName');
      expect(mapping.get('Interaction Type')).toBe('interactionType');
      expect(mapping.get('Interaction Date')).toBe('interactionDate');
    });

    it('should handle case-insensitive matching', () => {
      const columns = ['customer name', 'PRODUCT NAME', 'Interaction Type'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('customer name')).toBe('customerName');
      expect(mapping.get('PRODUCT NAME')).toBe('productName');
      expect(mapping.get('Interaction Type')).toBe('interactionType');
    });

    it('should return empty mapping for unknown columns', () => {
      const columns = ['Unknown Column 1', 'Unknown Column 2'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.size).toBe(0);
    });

    it('should handle mixed known and unknown columns', () => {
      const columns = ['客户名称', 'Unknown Column', '互动类型'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('客户名称')).toBe('customerName');
      expect(mapping.get('互动类型')).toBe('interactionType');
      expect(mapping.has('Unknown Column')).toBe(false);
    });
  });
});


