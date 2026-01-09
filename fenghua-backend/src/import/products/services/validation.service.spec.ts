/**
 * Product Validation Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductValidationService } from './validation.service';

describe('ProductValidationService', () => {
  let service: ProductValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductValidationService],
    }).compile();

    service = module.get<ProductValidationService>(ProductValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRecord', () => {
    it('should validate a valid product record', () => {
      const data = {
        name: '测试产品',
        hsCode: '1234567890',
        category: '电子产品',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.cleanedData).toBeDefined();
      expect(result.cleanedData?.name).toBe('测试产品');
      expect(result.cleanedData?.hsCode).toBe('1234567890');
      expect(result.cleanedData?.category).toBe('电子产品');
    });

    it('should reject missing required fields', () => {
      const data = {
        name: '',
        hsCode: '1234567890',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
      expect(result.errors.some(e => e.field === 'category')).toBe(true);
    });

    it('should reject invalid HS code format', () => {
      const data = {
        name: '测试产品',
        hsCode: '12345', // Too short
        category: '电子产品',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'hsCode')).toBe(true);
    });

    it('should accept valid HS code with hyphens', () => {
      const data = {
        name: '测试产品',
        hsCode: '123456-78',
        category: '电子产品',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.hsCode).toBe('123456-78');
    });

    it('should validate optional fields', () => {
      const data = {
        name: '测试产品',
        hsCode: '1234567890',
        category: '电子产品',
        description: '这是一个测试产品',
        imageUrl: 'https://example.com/image.jpg',
        specifications: { color: 'red', size: 'large' },
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.description).toBe('这是一个测试产品');
      expect(result.cleanedData?.imageUrl).toBe('https://example.com/image.jpg');
      expect(result.cleanedData?.specifications).toEqual({ color: 'red', size: 'large' });
    });

    it('should reject invalid image URL format', () => {
      const data = {
        name: '测试产品',
        hsCode: '1234567890',
        category: '电子产品',
        imageUrl: 'invalid-url',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'imageUrl')).toBe(true);
    });
  });

  describe('generateCleaningSuggestions', () => {
    it('should suggest trimming whitespace', () => {
      const data = {
        name: ' 测试产品 ',
        hsCode: '1234567890',
        category: '电子产品',
      };

      const suggestions = service.generateCleaningSuggestions(data, 1);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.field === 'name')).toBe(true);
    });

    it('should suggest cleaning HS code spaces', () => {
      const data = {
        name: '测试产品',
        hsCode: '123 456 7890',
        category: '电子产品',
      };

      const suggestions = service.generateCleaningSuggestions(data, 1);

      expect(suggestions.some(s => s.field === 'hsCode' && s.reason.includes('空格'))).toBe(true);
    });

    it('should suggest parsing JSON specifications', () => {
      const data = {
        name: '测试产品',
        hsCode: '1234567890',
        category: '电子产品',
        specifications: '{"color":"red"}',
      };

      const suggestions = service.generateCleaningSuggestions(data, 1);

      expect(suggestions.some(s => s.field === 'specifications' && s.reason.includes('JSON'))).toBe(true);
    });
  });
});


