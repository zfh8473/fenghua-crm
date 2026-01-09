/**
 * Validation Service
 * 
 * Handles data validation for customer import
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CreateCustomerDto, CustomerType } from '../../../companies/dto/create-customer.dto';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  cleanedData?: Partial<CreateCustomerDto>;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /**
   * Validate a single customer record
   */
  validateRecord(data: Record<string, any>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];
    const cleanedData: Partial<CreateCustomerDto> = {};

    // Validate name (required)
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: '客户名称不能为空' });
    } else {
      const name = data.name.trim();
      if (name.length > 255) {
        errors.push({ field: 'name', message: '客户名称长度不能超过255个字符' });
      } else {
        cleanedData.name = name;
      }
    }

    // Validate customerType (required)
    if (!data.customerType) {
      errors.push({ field: 'customerType', message: '客户类型不能为空' });
    } else {
      const customerType = this.normalizeCustomerType(data.customerType);
      if (!customerType) {
        errors.push({ field: 'customerType', message: '客户类型必须是 BUYER 或 SUPPLIER' });
      } else {
        cleanedData.customerType = customerType;
      }
    }

    // Validate customerCode (optional)
    if (data.customerCode) {
      const customerCode = String(data.customerCode).trim();
      if (customerCode.length > 50) {
        errors.push({ field: 'customerCode', message: '客户代码长度不能超过50个字符' });
      } else if (!/^[a-zA-Z0-9]{1,50}$/.test(customerCode)) {
        errors.push({ field: 'customerCode', message: '客户代码格式不正确，应为1-50个字母数字字符' });
      } else {
        cleanedData.customerCode = customerCode;
      }
    }

    // Validate email (optional)
    if (data.email) {
      const email = String(data.email).trim().toLowerCase();
      if (email.length > 255) {
        errors.push({ field: 'email', message: '邮箱长度不能超过255个字符' });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ field: 'email', message: '邮箱格式不正确' });
      } else {
        cleanedData.email = email;
      }
    }

    // Validate employees (optional)
    if (data.employees !== undefined && data.employees !== null && data.employees !== '') {
      const employees = this.parseEmployees(data.employees);
      if (employees === null) {
        errors.push({ field: 'employees', message: '员工数必须是1-1000000之间的整数' });
      } else {
        cleanedData.employees = employees;
      }
    }

    // Validate other optional fields
    if (data.domainName) cleanedData.domainName = String(data.domainName).trim().substring(0, 255);
    if (data.address) cleanedData.address = String(data.address).trim().substring(0, 1000);
    if (data.city) cleanedData.city = String(data.city).trim().substring(0, 100);
    if (data.state) cleanedData.state = String(data.state).trim().substring(0, 100);
    if (data.country) cleanedData.country = String(data.country).trim().substring(0, 100);
    if (data.postalCode) cleanedData.postalCode = String(data.postalCode).trim().substring(0, 20);
    if (data.industry) cleanedData.industry = String(data.industry).trim().substring(0, 100);
    if (data.website) cleanedData.website = String(data.website).trim().substring(0, 255);
    if (data.phone) cleanedData.phone = this.cleanPhone(String(data.phone).trim()).substring(0, 50);
    if (data.notes) cleanedData.notes = String(data.notes).trim().substring(0, 5000);

    return {
      isValid: errors.length === 0,
      errors,
      cleanedData: errors.length === 0 ? cleanedData : undefined,
    };
  }

  /**
   * Normalize customer type
   */
  private normalizeCustomerType(value: any): CustomerType | null {
    if (!value) return null;
    
    const str = String(value).trim().toUpperCase();
    if (str === 'BUYER' || str === '采购商') return CustomerType.BUYER;
    if (str === 'SUPPLIER' || str === '供应商') return CustomerType.SUPPLIER;
    
    return null;
  }

  /**
   * Parse employees number
   */
  private parseEmployees(value: any): number | null {
    if (typeof value === 'number') {
      return value >= 1 && value <= 1000000 ? value : null;
    }
    
    const str = String(value).replace(/[^\d]/g, '');
    const num = parseInt(str, 10);
    
    if (isNaN(num) || num < 1 || num > 1000000) {
      return null;
    }
    
    return num;
  }

  /**
   * Clean phone number
   */
  private cleanPhone(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '');
  }

  /**
   * Generate data cleaning suggestions
   */
  generateCleaningSuggestions(data: Record<string, any>, rowNumber: number): Array<{
    field: string;
    originalValue: any;
    suggestedValue: any;
    reason: string;
  }> {
    const suggestions: Array<{
      field: string;
      originalValue: any;
      suggestedValue: any;
      reason: string;
    }> = [];

    // Email cleaning
    if (data.email && typeof data.email === 'string') {
      const cleaned = data.email.trim().toLowerCase();
      if (cleaned !== data.email) {
        suggestions.push({
          field: 'email',
          originalValue: data.email,
          suggestedValue: cleaned,
          reason: '自动去除空格并转换为小写',
        });
      }
    }

    // Phone cleaning
    if (data.phone && typeof data.phone === 'string') {
      const cleaned = this.cleanPhone(data.phone.trim());
      if (cleaned !== data.phone) {
        suggestions.push({
          field: 'phone',
          originalValue: data.phone,
          suggestedValue: cleaned,
          reason: '自动去除空格、连字符和括号',
        });
      }
    }

    // Customer type conversion
    if (data.customerType) {
      const converted = this.normalizeCustomerType(data.customerType);
      if (converted && String(data.customerType).toUpperCase() !== converted) {
        suggestions.push({
          field: 'customerType',
          originalValue: data.customerType,
          suggestedValue: converted,
          reason: '自动转换中文到英文',
        });
      }
    }

    // Employees parsing
    if (data.employees !== undefined && data.employees !== null && data.employees !== '') {
      const parsed = this.parseEmployees(data.employees);
      if (parsed !== null && String(data.employees) !== String(parsed)) {
        suggestions.push({
          field: 'employees',
          originalValue: data.employees,
          suggestedValue: parsed,
          reason: '自动提取数字',
        });
      }
    }

    // Default customerType suggestion
    if (!data.customerType) {
      suggestions.push({
        field: 'customerType',
        originalValue: null,
        suggestedValue: CustomerType.BUYER,
        reason: '必填字段缺失，建议使用默认值 BUYER',
      });
    }

    return suggestions;
  }
}

