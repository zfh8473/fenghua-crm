/**
 * Mapping Service
 * 
 * Handles column name to CRM field mapping
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Column name mapping rules
 */
const COLUMN_MAPPING_RULES: Record<string, string> = {
  // Name mappings
  '客户名称': 'name',
  '公司名称': 'name',
  '名称': 'name',
  
  // Customer code mappings
  '客户代码': 'customerCode',
  '代码': 'customerCode',
  
  // Customer type mappings
  '客户类型': 'customerType',
  '类型': 'customerType',
  
  // Domain mappings
  '域名': 'domainName',
  '公司域名': 'domainName',
  
  // Address mappings
  '地址': 'address',
  '城市': 'city',
  '州/省': 'state',
  '省份': 'state',
  '国家': 'country',
  '邮编': 'postalCode',
  '邮政编码': 'postalCode',
  
  // Other mappings
  '行业': 'industry',
  '员工数': 'employees',
  '员工数量': 'employees',
  '网站': 'website',
  '网址': 'website',
  '电话': 'phone',
  '联系电话': 'phone',
  '邮箱': 'email',
  '电子邮件': 'email',
  '备注': 'notes',
  '说明': 'notes',
};

@Injectable()
export class MappingService {
  private readonly logger = new Logger(MappingService.name);

  /**
   * Auto-map Excel column names to CRM fields
   */
  autoMapColumns(excelColumns: string[]): Map<string, string> {
    const mapping = new Map<string, string>();
    
    for (const column of excelColumns) {
      const trimmedColumn = column.trim();
      
      // Direct match
      if (COLUMN_MAPPING_RULES[trimmedColumn]) {
        mapping.set(trimmedColumn, COLUMN_MAPPING_RULES[trimmedColumn]);
        continue;
      }
      
      // Case-insensitive match
      const lowerColumn = trimmedColumn.toLowerCase();
      for (const [key, value] of Object.entries(COLUMN_MAPPING_RULES)) {
        if (key.toLowerCase() === lowerColumn) {
          mapping.set(trimmedColumn, value);
          break;
        }
      }
    }
    
    return mapping;
  }

  /**
   * Convert customer type from Chinese to English
   */
  convertCustomerType(chineseType: string): 'BUYER' | 'SUPPLIER' | null {
    const normalized = chineseType.trim().toLowerCase();
    
    if (normalized === '采购商' || normalized === 'buyer') {
      return 'BUYER';
    }
    
    if (normalized === '供应商' || normalized === 'supplier') {
      return 'SUPPLIER';
    }
    
    return null;
  }
}

