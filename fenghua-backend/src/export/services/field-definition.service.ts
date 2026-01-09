/**
 * Field Definition Service
 * 
 * Provides field definitions for export data types
 * All custom code is proprietary and not open source.
 */

import { Injectable } from '@nestjs/common';
import { ExportDataType } from '../dto/export-request.dto';

/**
 * Field definition interface
 */
export interface FieldDefinition {
  fieldName: string;        // Technical field name (camelCase, e.g., "name", "customerCode")
  displayName: string;      // Chinese display name (e.g., "客户名称", "客户代码")
  category: string;         // Field category (e.g., "基本信息", "联系信息", "业务信息")
  isRequired: boolean;      // Whether the field is required
  dataType: string;         // Data type (e.g., "string", "number", "date")
}

@Injectable()
export class FieldDefinitionService {
  /**
   * Get available fields for a given export data type
   * @param dataType Export data type
   * @returns Array of field definitions
   */
  getAvailableFields(dataType: ExportDataType): FieldDefinition[] {
    switch (dataType) {
      case ExportDataType.CUSTOMER:
        return this.getCustomerFields();
      case ExportDataType.PRODUCT:
        return this.getProductFields();
      case ExportDataType.INTERACTION:
        return this.getInteractionFields();
      default:
        return [];
    }
  }

  /**
   * Get customer fields
   */
  private getCustomerFields(): FieldDefinition[] {
    return [
      // 基本信息
      { fieldName: 'id', displayName: 'ID', category: '基本信息', isRequired: true, dataType: 'string' },
      { fieldName: 'name', displayName: '客户名称', category: '基本信息', isRequired: true, dataType: 'string' },
      { fieldName: 'customerCode', displayName: '客户代码', category: '基本信息', isRequired: true, dataType: 'string' },
      { fieldName: 'customerType', displayName: '客户类型', category: '基本信息', isRequired: true, dataType: 'string' },
      
      // 联系信息
      { fieldName: 'domainName', displayName: '域名', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'address', displayName: '地址', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'city', displayName: '城市', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'state', displayName: '省份', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'country', displayName: '国家', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'postalCode', displayName: '邮编', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'email', displayName: '邮箱', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'phone', displayName: '电话', category: '联系信息', isRequired: false, dataType: 'string' },
      { fieldName: 'website', displayName: '网站', category: '联系信息', isRequired: false, dataType: 'string' },
      
      // 业务信息
      { fieldName: 'industry', displayName: '行业', category: '业务信息', isRequired: false, dataType: 'string' },
      { fieldName: 'employees', displayName: '员工数', category: '业务信息', isRequired: false, dataType: 'number' },
      { fieldName: 'notes', displayName: '备注', category: '业务信息', isRequired: false, dataType: 'string' },
      
      // 系统信息
      { fieldName: 'createdAt', displayName: '创建时间', category: '系统信息', isRequired: false, dataType: 'date' },
      { fieldName: 'updatedAt', displayName: '更新时间', category: '系统信息', isRequired: false, dataType: 'date' },
      { fieldName: 'createdBy', displayName: '创建人', category: '系统信息', isRequired: false, dataType: 'string' },
      { fieldName: 'updatedBy', displayName: '更新人', category: '系统信息', isRequired: false, dataType: 'string' },
      { fieldName: 'deletedAt', displayName: '删除时间', category: '系统信息', isRequired: false, dataType: 'date' },
    ];
  }

  /**
   * Get product fields
   */
  private getProductFields(): FieldDefinition[] {
    return [
      // 基本信息
      { fieldName: 'id', displayName: 'ID', category: '基本信息', isRequired: true, dataType: 'string' },
      { fieldName: 'name', displayName: '产品名称', category: '基本信息', isRequired: true, dataType: 'string' },
      { fieldName: 'hsCode', displayName: 'HS编码', category: '基本信息', isRequired: true, dataType: 'string' },
      { fieldName: 'category', displayName: '产品类别', category: '基本信息', isRequired: false, dataType: 'string' },
      
      // 详细信息
      { fieldName: 'description', displayName: '产品描述', category: '详细信息', isRequired: false, dataType: 'string' },
      { fieldName: 'specifications', displayName: '产品规格', category: '详细信息', isRequired: false, dataType: 'object' },
      { fieldName: 'imageUrl', displayName: '产品图片', category: '详细信息', isRequired: false, dataType: 'string' },
      
      // 状态信息
      { fieldName: 'status', displayName: '状态', category: '状态信息', isRequired: true, dataType: 'string' },
      
      // 系统信息
      { fieldName: 'createdAt', displayName: '创建时间', category: '系统信息', isRequired: false, dataType: 'date' },
      { fieldName: 'updatedAt', displayName: '更新时间', category: '系统信息', isRequired: false, dataType: 'date' },
      { fieldName: 'createdBy', displayName: '创建人', category: '系统信息', isRequired: false, dataType: 'string' },
      { fieldName: 'updatedBy', displayName: '更新人', category: '系统信息', isRequired: false, dataType: 'string' },
      { fieldName: 'deletedAt', displayName: '删除时间', category: '系统信息', isRequired: false, dataType: 'date' },
    ];
  }

  /**
   * Get interaction fields
   */
  private getInteractionFields(): FieldDefinition[] {
    return [
      // 关联信息
      { fieldName: 'id', displayName: 'ID', category: '关联信息', isRequired: true, dataType: 'string' },
      { fieldName: 'productId', displayName: '产品ID', category: '关联信息', isRequired: true, dataType: 'string' },
      { fieldName: 'customerId', displayName: '客户ID', category: '关联信息', isRequired: true, dataType: 'string' },
      { fieldName: 'customerName', displayName: '客户名称', category: '关联信息', isRequired: false, dataType: 'string' },
      { fieldName: 'productName', displayName: '产品名称', category: '关联信息', isRequired: false, dataType: 'string' },
      
      // 互动信息
      { fieldName: 'interactionType', displayName: '互动类型', category: '互动信息', isRequired: true, dataType: 'string' },
      { fieldName: 'interactionDate', displayName: '互动时间', category: '互动信息', isRequired: true, dataType: 'date' },
      { fieldName: 'description', displayName: '描述', category: '互动信息', isRequired: false, dataType: 'string' },
      { fieldName: 'status', displayName: '状态', category: '互动信息', isRequired: false, dataType: 'string' },
      { fieldName: 'additionalInfo', displayName: '额外信息', category: '互动信息', isRequired: false, dataType: 'object' },
      
      // 系统信息
      { fieldName: 'createdAt', displayName: '创建时间', category: '系统信息', isRequired: false, dataType: 'date' },
      { fieldName: 'createdBy', displayName: '创建人', category: '系统信息', isRequired: true, dataType: 'string' },
      { fieldName: 'updatedAt', displayName: '更新时间', category: '系统信息', isRequired: false, dataType: 'date' },
      { fieldName: 'updatedBy', displayName: '更新人', category: '系统信息', isRequired: false, dataType: 'string' },
      
      // 附件信息
      { fieldName: 'attachments', displayName: '附件', category: '附件信息', isRequired: false, dataType: 'array' },
    ];
  }
}

