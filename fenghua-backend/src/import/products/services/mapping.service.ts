/**
 * Product Mapping Service
 * 
 * Handles column name to CRM field mapping for products
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Column name mapping rules for products
 */
const PRODUCT_COLUMN_MAPPING_RULES: Record<string, string> = {
  // Name mappings
  '产品名称': 'name',
  '名称': 'name',
  '产品名': 'name',
  
  // HS code mappings
  'HS编码': 'hsCode',
  'HS 编码': 'hsCode',
  '海关编码': 'hsCode',
  'HS Code': 'hsCode',
  
  // Category mappings
  '产品类别': 'category',
  '类别': 'category',
  '分类': 'category',
  'Category': 'category',
  
  // Description mappings
  '产品描述': 'description',
  '描述': 'description',
  'Description': 'description',
  
  // Specifications mappings
  '产品规格': 'specifications',
  '规格': 'specifications',
  'Specifications': 'specifications',
  
  // Image URL mappings
  '产品图片': 'imageUrl',
  '图片': 'imageUrl',
  '图片URL': 'imageUrl',
  'Image URL': 'imageUrl',
};

@Injectable()
export class ProductMappingService {
  private readonly logger = new Logger(ProductMappingService.name);

  /**
   * Auto-map Excel column names to product CRM fields
   */
  autoMapColumns(excelColumns: string[]): Map<string, string> {
    const mapping = new Map<string, string>();
    
    for (const column of excelColumns) {
      const trimmedColumn = column.trim();
      
      // Direct match
      if (PRODUCT_COLUMN_MAPPING_RULES[trimmedColumn]) {
        mapping.set(column, PRODUCT_COLUMN_MAPPING_RULES[trimmedColumn]); // Use original column as key
        continue;
      }
      
      // Case-insensitive match
      const lowerColumn = trimmedColumn.toLowerCase();
      for (const [key, value] of Object.entries(PRODUCT_COLUMN_MAPPING_RULES)) {
        if (key.toLowerCase() === lowerColumn) {
          mapping.set(column, value); // Use original column as key
          break;
        }
      }
    }
    
    return mapping;
  }
}


