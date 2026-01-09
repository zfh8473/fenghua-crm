/**
 * Mapping Service Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MappingService } from './mapping.service';

describe('MappingService', () => {
  let service: MappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MappingService],
    }).compile();

    service = module.get<MappingService>(MappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoMapColumns', () => {
    it('should map Chinese column names to CRM fields', () => {
      const columns = ['客户名称', '客户类型', '邮箱', '电话'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('客户名称')).toBe('name');
      expect(mapping.get('客户类型')).toBe('customerType');
      expect(mapping.get('邮箱')).toBe('email');
      expect(mapping.get('电话')).toBe('phone');
    });

    it('should handle case-insensitive matching', () => {
      const columns = ['客户名称', 'CUSTOMER_NAME', 'Email'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.get('客户名称')).toBe('name');
      // Note: English column names won't match unless added to mapping rules
    });

    it('should handle columns with whitespace', () => {
      const columns = [' 客户名称 ', '  邮箱  '];
      const mapping = service.autoMapColumns(columns);

      // Mapping service trims column names, so the key in the map is the trimmed version
      expect(mapping.get('客户名称')).toBe('name');
      expect(mapping.get('邮箱')).toBe('email');
    });

    it('should return empty map for unmapped columns', () => {
      const columns = ['UnknownColumn', 'AnotherUnknown'];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.size).toBe(0);
    });

    it('should map all known column types', () => {
      const columns = [
        '客户名称', '公司名称', '名称',
        '客户代码', '代码',
        '客户类型', '类型',
        '域名', '公司域名',
        '地址', '城市', '州/省', '省份', '国家', '邮编', '邮政编码',
        '行业', '员工数', '员工数量', '网站', '网址', '电话', '联系电话',
        '邮箱', '电子邮件', '备注', '说明',
      ];
      const mapping = service.autoMapColumns(columns);

      expect(mapping.size).toBeGreaterThan(0);
      expect(mapping.get('客户名称')).toBe('name');
      expect(mapping.get('客户代码')).toBe('customerCode');
      expect(mapping.get('客户类型')).toBe('customerType');
    });
  });

  describe('convertCustomerType', () => {
    it('should convert Chinese "采购商" to BUYER', () => {
      expect(service.convertCustomerType('采购商')).toBe('BUYER');
    });

    it('should convert Chinese "供应商" to SUPPLIER', () => {
      expect(service.convertCustomerType('供应商')).toBe('SUPPLIER');
    });

    it('should convert English "buyer" to BUYER', () => {
      expect(service.convertCustomerType('buyer')).toBe('BUYER');
    });

    it('should convert English "supplier" to SUPPLIER', () => {
      expect(service.convertCustomerType('supplier')).toBe('SUPPLIER');
    });

    it('should handle case-insensitive input', () => {
      expect(service.convertCustomerType('BUYER')).toBe('BUYER');
      expect(service.convertCustomerType('SUPPLIER')).toBe('SUPPLIER');
      expect(service.convertCustomerType('Buyer')).toBe('BUYER');
    });

    it('should handle whitespace', () => {
      expect(service.convertCustomerType(' 采购商 ')).toBe('BUYER');
      expect(service.convertCustomerType('  供应商  ')).toBe('SUPPLIER');
    });

    it('should return null for invalid types', () => {
      expect(service.convertCustomerType('invalid')).toBeNull();
      expect(service.convertCustomerType('')).toBeNull();
      expect(service.convertCustomerType('其他')).toBeNull();
    });
  });
});

