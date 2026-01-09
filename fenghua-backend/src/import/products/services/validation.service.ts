/**
 * Product Validation Service
 * 
 * Handles data validation for product import
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CreateProductDto } from '../../../products/dto/create-product.dto';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  cleanedData?: Partial<CreateProductDto>;
}

export interface CleaningSuggestion {
  field: string;
  originalValue: any;
  suggestedValue: any;
  reason: string;
}

@Injectable()
export class ProductValidationService {
  private readonly logger = new Logger(ProductValidationService.name);

  /**
   * Validate a single product record
   */
  validateRecord(data: Record<string, any>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];
    const cleanedData: Partial<CreateProductDto> = {};

    // Validate name (required)
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: '产品名称不能为空' });
    } else {
      const name = data.name.trim();
      if (name.length > 255) {
        errors.push({ field: 'name', message: '产品名称长度不能超过255个字符' });
      } else {
        cleanedData.name = name;
      }
    }

    // Validate hsCode (required)
    if (!data.hsCode) {
      errors.push({ field: 'hsCode', message: 'HS编码不能为空' });
    } else {
      const hsCode = String(data.hsCode).trim();
      if (!/^[0-9]{6,10}(-[0-9]{2,4})*$/.test(hsCode)) {
        errors.push({ field: 'hsCode', message: 'HS编码格式不正确，应为6-10位数字，可包含连字符' });
      } else {
        cleanedData.hsCode = hsCode;
      }
    }

    // Validate category (required)
    if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
      errors.push({ field: 'category', message: '产品类别不能为空' });
    } else {
      const category = data.category.trim();
      if (category.length > 255) {
        errors.push({ field: 'category', message: '产品类别长度不能超过255个字符' });
      } else {
        cleanedData.category = category;
      }
    }

    // Validate description (optional)
    if (data.description) {
      const description = String(data.description).trim();
      if (description.length > 5000) {
        errors.push({ field: 'description', message: '产品描述长度不能超过5000个字符' });
      } else {
        cleanedData.description = description;
      }
    }

    // Validate specifications (optional)
    if (data.specifications) {
      try {
        let specs = data.specifications;
        // If it's a string, try to parse as JSON
        if (typeof specs === 'string') {
          specs = JSON.parse(specs);
        }
        if (typeof specs === 'object' && specs !== null) {
          cleanedData.specifications = specs as Record<string, unknown>;
        } else {
          errors.push({ field: 'specifications', message: '产品规格必须是有效的JSON对象' });
        }
      } catch (error) {
        errors.push({ field: 'specifications', message: '产品规格JSON格式不正确' });
      }
    }

    // Validate imageUrl (optional)
    if (data.imageUrl) {
      const imageUrl = String(data.imageUrl).trim();
      if (imageUrl.length > 255) {
        errors.push({ field: 'imageUrl', message: '产品图片URL长度不能超过255个字符' });
      } else if (!/^https?:\/\/.+/.test(imageUrl)) {
        errors.push({ field: 'imageUrl', message: '产品图片URL格式不正确，应以http://或https://开头' });
      } else {
        cleanedData.imageUrl = imageUrl;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      cleanedData: errors.length === 0 ? cleanedData : undefined,
    };
  }

  /**
   * Generate data cleaning suggestions for a single product record
   */
  generateCleaningSuggestions(data: Record<string, any>, rowNumber: number): CleaningSuggestion[] {
    const suggestions: CleaningSuggestion[] = [];

    // Suggest trimming for string fields
    for (const key of ['name', 'hsCode', 'category', 'description', 'imageUrl']) {
      if (typeof data[key] === 'string' && data[key] !== data[key].trim()) {
        suggestions.push({
          field: key,
          originalValue: data[key],
          suggestedValue: data[key].trim(),
          reason: '移除前后空格',
        });
      }
    }

    // Suggest cleaning HS code (remove spaces)
    if (typeof data.hsCode === 'string') {
      const cleanedHsCode = data.hsCode.replace(/\s/g, '');
      if (cleanedHsCode !== data.hsCode) {
        suggestions.push({
          field: 'hsCode',
          originalValue: data.hsCode,
          suggestedValue: cleanedHsCode,
          reason: '移除HS编码中的空格',
        });
      }
    }

    // Suggest parsing specifications JSON
    if (typeof data.specifications === 'string') {
      try {
        const parsed = JSON.parse(data.specifications);
        if (typeof parsed === 'object' && parsed !== null) {
          suggestions.push({
            field: 'specifications',
            originalValue: data.specifications,
            suggestedValue: parsed,
            reason: '解析JSON字符串为对象',
          });
        }
      } catch (error) {
        // Invalid JSON, don't suggest
      }
    }

    return suggestions;
  }
}


