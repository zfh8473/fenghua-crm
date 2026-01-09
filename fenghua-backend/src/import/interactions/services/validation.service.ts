/**
 * Interaction Validation Service
 * 
 * Handles data validation for interaction import
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CreateInteractionDto } from '../../../interactions/dto/create-interaction.dto';
import {
  FrontendInteractionType,
  BackendInteractionType,
  InteractionType,
  InteractionStatus,
} from '../../../interactions/dto/create-interaction.dto';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  cleanedData?: Partial<CreateInteractionDto>;
}

export interface CleaningSuggestion {
  field: string;
  originalValue: any;
  suggestedValue: any;
  reason: string;
}

/**
 * Interaction type name mappings (Chinese and English to enum values)
 */
const INTERACTION_TYPE_MAPPINGS: Record<string, InteractionType> = {
  // Frontend interaction types (Chinese)
  '初步接触': FrontendInteractionType.INITIAL_CONTACT,
  '产品询价': FrontendInteractionType.PRODUCT_INQUIRY,
  '报价': FrontendInteractionType.QUOTATION,
  '接受报价': FrontendInteractionType.QUOTATION_ACCEPTED,
  '拒绝报价': FrontendInteractionType.QUOTATION_REJECTED,
  '签署订单': FrontendInteractionType.ORDER_SIGNED,
  '完成订单': FrontendInteractionType.ORDER_COMPLETED,
  
  // Frontend interaction types (English)
  'initial_contact': FrontendInteractionType.INITIAL_CONTACT,
  'Initial Contact': FrontendInteractionType.INITIAL_CONTACT,
  'product_inquiry': FrontendInteractionType.PRODUCT_INQUIRY,
  'Product Inquiry': FrontendInteractionType.PRODUCT_INQUIRY,
  'quotation': FrontendInteractionType.QUOTATION,
  'Quotation': FrontendInteractionType.QUOTATION,
  'quotation_accepted': FrontendInteractionType.QUOTATION_ACCEPTED,
  'Quotation Accepted': FrontendInteractionType.QUOTATION_ACCEPTED,
  'quotation_rejected': FrontendInteractionType.QUOTATION_REJECTED,
  'Quotation Rejected': FrontendInteractionType.QUOTATION_REJECTED,
  'order_signed': FrontendInteractionType.ORDER_SIGNED,
  'Order Signed': FrontendInteractionType.ORDER_SIGNED,
  'order_completed': FrontendInteractionType.ORDER_COMPLETED,
  'Order Completed': FrontendInteractionType.ORDER_COMPLETED,
  
  // Backend interaction types (Chinese)
  '询价产品': BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
  '接收报价': BackendInteractionType.QUOTATION_RECEIVED,
  '产品规格确认': BackendInteractionType.SPECIFICATION_CONFIRMED,
  '生产进度跟进': BackendInteractionType.PRODUCTION_PROGRESS,
  '发货前验收': BackendInteractionType.PRE_SHIPMENT_INSPECTION,
  '已发货': BackendInteractionType.SHIPPED,
  
  // Backend interaction types (English)
  'product_inquiry_supplier': BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
  'Product Inquiry Supplier': BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER,
  'quotation_received': BackendInteractionType.QUOTATION_RECEIVED,
  'Quotation Received': BackendInteractionType.QUOTATION_RECEIVED,
  'specification_confirmed': BackendInteractionType.SPECIFICATION_CONFIRMED,
  'Specification Confirmed': BackendInteractionType.SPECIFICATION_CONFIRMED,
  'production_progress': BackendInteractionType.PRODUCTION_PROGRESS,
  'Production Progress': BackendInteractionType.PRODUCTION_PROGRESS,
  'pre_shipment_inspection': BackendInteractionType.PRE_SHIPMENT_INSPECTION,
  'Pre Shipment Inspection': BackendInteractionType.PRE_SHIPMENT_INSPECTION,
  'shipped': BackendInteractionType.SHIPPED,
  'Shipped': BackendInteractionType.SHIPPED,
};

/**
 * Status name mappings
 */
const STATUS_MAPPINGS: Record<string, InteractionStatus> = {
  '进行中': InteractionStatus.IN_PROGRESS,
  '已完成': InteractionStatus.COMPLETED,
  '已取消': InteractionStatus.CANCELLED,
  '需要跟进': InteractionStatus.NEEDS_FOLLOW_UP,
  'in_progress': InteractionStatus.IN_PROGRESS,
  'In Progress': InteractionStatus.IN_PROGRESS,
  'completed': InteractionStatus.COMPLETED,
  'Completed': InteractionStatus.COMPLETED,
  'cancelled': InteractionStatus.CANCELLED,
  'Cancelled': InteractionStatus.CANCELLED,
  'needs_follow_up': InteractionStatus.NEEDS_FOLLOW_UP,
  'Needs Follow Up': InteractionStatus.NEEDS_FOLLOW_UP,
};

@Injectable()
export class InteractionValidationService {
  private readonly logger = new Logger(InteractionValidationService.name);

  /**
   * Validate a single interaction record
   * Note: This method validates format and basic rules only.
   * Existence checks (customer, product, association) should be done in batch.
   */
  validateRecord(data: Record<string, any>, rowNumber: number): ValidationResult {
    const errors: ValidationError[] = [];
    const cleanedData: Partial<CreateInteractionDto> = {};

    // Validate customerId or customerName (required)
    if (!data.customerId && !data.customerName && !data.customerCode) {
      errors.push({ field: 'customerId', message: '客户ID、客户名称或客户代码不能为空' });
    } else {
      if (data.customerId) {
        const customerId = String(data.customerId).trim();
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
          errors.push({ field: 'customerId', message: '客户ID格式不正确，应为有效的UUID' });
        } else {
          cleanedData.customerId = customerId;
        }
      }
      // customerName and customerCode will be resolved to customerId during batch validation
    }

    // Validate productIds or productName (required)
    if (!data.productIds && !data.productName && !data.productHsCode) {
      errors.push({ field: 'productIds', message: '产品ID、产品名称或HS编码不能为空' });
    } else {
      if (data.productIds) {
        // Handle array or comma/semicolon-separated string
        let productIds: string[] = [];
        if (Array.isArray(data.productIds)) {
          productIds = data.productIds.map(id => String(id).trim());
        } else if (typeof data.productIds === 'string') {
          // Support comma or semicolon separated values
          productIds = data.productIds.split(/[,;]/).map(id => id.trim()).filter(id => id.length > 0);
        }
        
        if (productIds.length === 0) {
          errors.push({ field: 'productIds', message: '至少需要选择一个产品' });
        } else {
          // Validate UUID format for each productId
          const invalidIds = productIds.filter(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
          if (invalidIds.length > 0) {
            errors.push({ field: 'productIds', message: `产品ID格式不正确: ${invalidIds.join(', ')}` });
          } else {
            cleanedData.productIds = productIds;
          }
        }
      }
      // productName and productHsCode will be resolved to productIds during batch validation
    }

    // Validate interactionType (required)
    if (!data.interactionType) {
      errors.push({ field: 'interactionType', message: '互动类型不能为空' });
    } else {
      const interactionTypeStr = String(data.interactionType).trim();
      // Try to map from name to enum value
      const mappedType = INTERACTION_TYPE_MAPPINGS[interactionTypeStr] || 
                         INTERACTION_TYPE_MAPPINGS[interactionTypeStr.toLowerCase()];
      
      if (mappedType) {
        cleanedData.interactionType = mappedType;
      } else {
        // Check if it's already a valid enum value
        const allTypes = [
          ...Object.values(FrontendInteractionType),
          ...Object.values(BackendInteractionType),
        ];
        if (allTypes.includes(interactionTypeStr as InteractionType)) {
          cleanedData.interactionType = interactionTypeStr as InteractionType;
        } else {
          errors.push({ field: 'interactionType', message: `互动类型无效: ${interactionTypeStr}` });
        }
      }
    }

    // Validate interactionDate (required)
    if (!data.interactionDate) {
      errors.push({ field: 'interactionDate', message: '互动时间不能为空' });
    } else {
      const dateStr = String(data.interactionDate).trim();
      // Try to parse as ISO 8601 date string
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'interactionDate', message: '互动时间格式不正确，应为ISO 8601格式（如：2025-01-08T10:00:00Z）' });
      } else {
        cleanedData.interactionDate = date.toISOString();
      }
    }

    // Validate description (optional)
    if (data.description) {
      const description = String(data.description).trim();
      if (description.length > 5000) {
        errors.push({ field: 'description', message: '互动描述长度不能超过5000个字符' });
      } else {
        cleanedData.description = description;
      }
    }

    // Validate status (optional)
    if (data.status) {
      const statusStr = String(data.status).trim();
      const mappedStatus = STATUS_MAPPINGS[statusStr] || STATUS_MAPPINGS[statusStr.toLowerCase()];
      
      if (mappedStatus) {
        cleanedData.status = mappedStatus;
      } else {
        // Check if it's already a valid enum value
        const allStatuses = Object.values(InteractionStatus);
        if (allStatuses.includes(statusStr as InteractionStatus)) {
          cleanedData.status = statusStr as InteractionStatus;
        } else {
          errors.push({ field: 'status', message: `状态无效: ${statusStr}` });
        }
      }
    }

    // Validate additionalInfo (optional)
    if (data.additionalInfo) {
      try {
        let additionalInfo = data.additionalInfo;
        // If it's a string, try to parse as JSON
        if (typeof additionalInfo === 'string') {
          additionalInfo = JSON.parse(additionalInfo);
        }
        if (typeof additionalInfo === 'object' && additionalInfo !== null) {
          cleanedData.additionalInfo = additionalInfo as Record<string, unknown>;
        } else {
          errors.push({ field: 'additionalInfo', message: '额外信息必须是有效的JSON对象' });
        }
      } catch (error) {
        errors.push({ field: 'additionalInfo', message: '额外信息JSON格式不正确' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      cleanedData: errors.length === 0 ? cleanedData : undefined,
    };
  }

  /**
   * Generate data cleaning suggestions for a single interaction record
   */
  generateCleaningSuggestions(data: Record<string, any>, rowNumber: number): CleaningSuggestion[] {
    const suggestions: CleaningSuggestion[] = [];

    // Suggest trimming for string fields
    for (const key of ['customerName', 'customerCode', 'productName', 'productHsCode', 'description']) {
      if (typeof data[key] === 'string' && data[key] !== data[key].trim()) {
        suggestions.push({
          field: key,
          originalValue: data[key],
          suggestedValue: data[key].trim(),
          reason: '移除前后空格',
        });
      }
    }

    // Suggest interaction type name conversion
    if (data.interactionType && INTERACTION_TYPE_MAPPINGS[String(data.interactionType).trim()]) {
      const mappedType = INTERACTION_TYPE_MAPPINGS[String(data.interactionType).trim()];
      if (mappedType !== data.interactionType) {
        suggestions.push({
          field: 'interactionType',
          originalValue: data.interactionType,
          suggestedValue: mappedType,
          reason: '转换为标准枚举值',
        });
      }
    }

    // Suggest status name conversion
    if (data.status && STATUS_MAPPINGS[String(data.status).trim()]) {
      const mappedStatus = STATUS_MAPPINGS[String(data.status).trim()];
      if (mappedStatus !== data.status) {
        suggestions.push({
          field: 'status',
          originalValue: data.status,
          suggestedValue: mappedStatus,
          reason: '转换为标准枚举值',
        });
      }
    }

    // Suggest date format conversion
    if (data.interactionDate) {
      try {
        const date = new Date(data.interactionDate);
        if (!isNaN(date.getTime())) {
          const isoString = date.toISOString();
          if (isoString !== data.interactionDate) {
            suggestions.push({
              field: 'interactionDate',
              originalValue: data.interactionDate,
              suggestedValue: isoString,
              reason: '转换为ISO 8601格式',
            });
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    return suggestions;
  }
}


