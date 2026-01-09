/**
 * Interaction Validation Service Tests
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InteractionValidationService } from './validation.service';
import { FrontendInteractionType, BackendInteractionType, InteractionStatus } from '../../../interactions/dto/create-interaction.dto';

describe('InteractionValidationService', () => {
  let service: InteractionValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InteractionValidationService],
    }).compile();

    service = module.get<InteractionValidationService>(InteractionValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRecord', () => {
    it('should validate a complete valid record', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08T10:00:00Z',
        description: 'Test interaction',
        status: InteractionStatus.IN_PROGRESS,
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.cleanedData).toBeDefined();
    });

    it('should reject record without customerId/customerName/customerCode', () => {
      const data = {
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'customerId')).toBe(true);
    });

    it('should reject record without productIds/productName/productHsCode', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'productIds')).toBe(true);
    });

    it('should reject record without interactionType', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'interactionType')).toBe(true);
    });

    it('should reject record without interactionDate', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'interactionDate')).toBe(true);
    });

    it('should map Chinese interaction type names to enum values', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: '初步接触',
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.interactionType).toBe(FrontendInteractionType.INITIAL_CONTACT);
    });

    it('should map English interaction type names to enum values', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: 'Initial Contact',
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.interactionType).toBe(FrontendInteractionType.INITIAL_CONTACT);
    });

    it('should map Chinese status names to enum values', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08T10:00:00Z',
        status: '进行中',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.status).toBe(InteractionStatus.IN_PROGRESS);
    });

    it('should validate date format and convert to ISO string', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08 10:00:00',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.interactionDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should reject invalid date format', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: 'invalid-date',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'interactionDate')).toBe(true);
    });

    it('should handle comma-separated productIds string', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: '123e4567-e89b-12d3-a456-426614174001,123e4567-e89b-12d3-a456-426614174002',
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.cleanedData?.productIds)).toBe(true);
      expect(result.cleanedData?.productIds?.length).toBe(2);
    });
  });

  describe('generateCleaningSuggestions', () => {
    it('should suggest trimming string fields', () => {
      const data = {
        customerName: '  Test Customer  ',
        productName: 'Test Product',
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const suggestions = service.generateCleaningSuggestions(data, 1);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.field === 'customerName' && s.reason === '移除前后空格')).toBe(true);
    });

    it('should suggest interaction type name conversion', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: '初步接触',
        interactionDate: '2025-01-08T10:00:00Z',
      };

      const suggestions = service.generateCleaningSuggestions(data, 1);

      expect(suggestions.some(s => s.field === 'interactionType' && s.reason === '转换为标准枚举值')).toBe(true);
    });

    it('should suggest date format conversion', () => {
      const data = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        productIds: ['123e4567-e89b-12d3-a456-426614174001'],
        interactionType: FrontendInteractionType.INITIAL_CONTACT,
        interactionDate: '2025-01-08 10:00:00',
      };

      const suggestions = service.generateCleaningSuggestions(data, 1);

      expect(suggestions.some(s => s.field === 'interactionDate' && s.reason === '转换为ISO 8601格式')).toBe(true);
    });
  });
});


