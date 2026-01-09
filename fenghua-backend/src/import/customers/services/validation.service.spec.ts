/**
 * Validation Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';
import { CustomerType } from '../../../companies/dto/create-customer.dto';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRecord', () => {
    it('should validate a valid customer record', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        email: 'test@example.com',
        phone: '123-456-7890',
        employees: 100,
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.cleanedData).toBeDefined();
      expect(result.cleanedData?.name).toBe('Test Company');
      expect(result.cleanedData?.customerType).toBe(CustomerType.BUYER);
    });

    it('should reject record with missing name', () => {
      const data = {
        customerType: 'BUYER',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: '客户名称不能为空',
      });
    });

    it('should reject record with missing customerType', () => {
      const data = {
        name: 'Test Company',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'customerType',
        message: '客户类型不能为空',
      });
    });

    it('should reject record with invalid customerType', () => {
      const data = {
        name: 'Test Company',
        customerType: 'INVALID',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'customerType',
        message: '客户类型必须是 BUYER 或 SUPPLIER',
      });
    });

    it('should accept Chinese customer type "采购商"', () => {
      const data = {
        name: 'Test Company',
        customerType: '采购商',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.customerType).toBe(CustomerType.BUYER);
    });

    it('should accept Chinese customer type "供应商"', () => {
      const data = {
        name: 'Test Company',
        customerType: '供应商',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.customerType).toBe(CustomerType.SUPPLIER);
    });

    it('should validate email format', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        email: 'invalid-email',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should accept valid email', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        email: 'test@example.com',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.email).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        email: 'TEST@EXAMPLE.COM',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.email).toBe('test@example.com');
    });

    it('should validate customerCode format', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        customerCode: 'INVALID-CODE!',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'customerCode')).toBe(true);
    });

    it('should accept valid customerCode', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        customerCode: 'CUST001',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.customerCode).toBe('CUST001');
    });

    it('should parse employees from string', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        employees: '100',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.employees).toBe(100);
    });

    it('should parse employees from string with non-numeric characters', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        employees: '100 employees',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.employees).toBe(100);
    });

    it('should reject invalid employees value', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        employees: 'invalid',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'employees')).toBe(true);
    });

    it('should clean phone number', () => {
      const data = {
        name: 'Test Company',
        customerType: 'BUYER',
        phone: '(123) 456-7890',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.phone).toBe('1234567890');
    });

    it('should trim and limit string fields', () => {
      const data = {
        name: '  Test Company  ',
        customerType: 'BUYER',
        address: 'A'.repeat(2000),
        city: 'B'.repeat(200),
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(true);
      expect(result.cleanedData?.name).toBe('Test Company');
      expect(result.cleanedData?.address?.length).toBe(1000);
      expect(result.cleanedData?.city?.length).toBe(100);
    });

    it('should reject name exceeding max length', () => {
      const data = {
        name: 'A'.repeat(256),
        customerType: 'BUYER',
      };

      const result = service.validateRecord(data, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name' && e.message.includes('255'))).toBe(true);
    });
  });
});

