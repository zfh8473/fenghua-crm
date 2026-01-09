/**
 * Interaction Mapping Service
 * 
 * Handles column name to CRM field mapping for interactions
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Column name mapping rules for interactions
 */
const INTERACTION_COLUMN_MAPPING_RULES: Record<string, string> = {
  // Customer mappings
  '客户名称': 'customerName',
  '客户': 'customerName',
  '客户代码': 'customerCode',
  'Customer': 'customerName',
  'Customer Name': 'customerName',
  'Customer Code': 'customerCode',
  
  // Product mappings
  '产品名称': 'productName',
  '产品': 'productName',
  '产品名': 'productName',
  'HS编码': 'productHsCode',
  'HS 编码': 'productHsCode',
  'HS Code': 'productHsCode',
  'Product': 'productName',
  'Product Name': 'productName',
  'Product HS Code': 'productHsCode',
  
  // Interaction type mappings
  '互动类型': 'interactionType',
  '类型': 'interactionType',
  'Interaction Type': 'interactionType',
  'Type': 'interactionType',
  
  // Interaction date mappings
  '互动时间': 'interactionDate',
  '时间': 'interactionDate',
  '日期': 'interactionDate',
  'Interaction Date': 'interactionDate',
  'Date': 'interactionDate',
  
  // Description mappings
  '互动描述': 'description',
  '描述': 'description',
  'Description': 'description',
  
  // Status mappings
  '状态': 'status',
  'Status': 'status',
  
  // Additional info mappings
  '额外信息': 'additionalInfo',
  'Additional Info': 'additionalInfo',
  'Additional Information': 'additionalInfo',
};

@Injectable()
export class InteractionMappingService {
  private readonly logger = new Logger(InteractionMappingService.name);

  /**
   * Auto-map Excel column names to interaction CRM fields
   */
  autoMapColumns(excelColumns: string[]): Map<string, string> {
    const mapping = new Map<string, string>();
    
    for (const column of excelColumns) {
      const trimmedColumn = column.trim();
      
      // Direct match
      if (INTERACTION_COLUMN_MAPPING_RULES[trimmedColumn]) {
        mapping.set(column, INTERACTION_COLUMN_MAPPING_RULES[trimmedColumn]); // Use original column as key
        continue;
      }
      
      // Case-insensitive match
      const lowerColumn = trimmedColumn.toLowerCase();
      for (const [key, value] of Object.entries(INTERACTION_COLUMN_MAPPING_RULES)) {
        if (key.toLowerCase() === lowerColumn) {
          mapping.set(column, value); // Use original column as key
          break;
        }
      }
    }
    
    return mapping;
  }
}


