/**
 * DTOs for interaction creation
 * All custom code is proprietary and not open source.
 */

import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsObject,
  IsIn,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

/**
 * Frontend interaction type enum (for frontend specialists)
 */
export enum FrontendInteractionType {
  INITIAL_CONTACT = 'initial_contact', // 初步接触
  PRODUCT_INQUIRY = 'product_inquiry', // 产品询价
  QUOTATION = 'quotation', // 报价
  QUOTATION_ACCEPTED = 'quotation_accepted', // 接受报价
  QUOTATION_REJECTED = 'quotation_rejected', // 拒绝报价
  ORDER_SIGNED = 'order_signed', // 签署订单
  ORDER_FOLLOW_UP = 'order_follow_up', // 进度跟进
  ORDER_COMPLETED = 'order_completed', // 完成订单
}

/**
 * Backend interaction type enum (for backend specialists)
 */
export enum BackendInteractionType {
  PRODUCT_INQUIRY_SUPPLIER = 'product_inquiry_supplier', // 询价产品
  QUOTATION_RECEIVED = 'quotation_received', // 接收报价
  SPECIFICATION_CONFIRMED = 'specification_confirmed', // 产品规格确认
  PRODUCTION_PROGRESS = 'production_progress', // 生产进度跟进
  PRE_SHIPMENT_INSPECTION = 'pre_shipment_inspection', // 发货前验收
  SHIPPED = 'shipped', // 已发货
}

/**
 * Union type for all interaction types
 */
export type InteractionType = FrontendInteractionType | BackendInteractionType;

/**
 * Interaction status enum
 * Note: All enum values must be ≤ 50 characters (database status field is VARCHAR(50))
 */
export enum InteractionStatus {
  IN_PROGRESS = 'in_progress',        // 进行中 (13 characters)
  COMPLETED = 'completed',            // 已完成 (9 characters)
  CANCELLED = 'cancelled',            // 已取消 (9 characters)
  NEEDS_FOLLOW_UP = 'needs_follow_up' // 需要跟进 (16 characters)
}

/**
 * All allowed interaction type values (for validation)
 */
const ALL_INTERACTION_TYPES = [
  ...Object.values(FrontendInteractionType),
  ...Object.values(BackendInteractionType),
];

/**
 * DTO for creating a new interaction record
 * 
 * Supports creating interactions for multiple products.
 * Each product will have a separate interaction record created,
 * but all records share the same customer, interaction type, date, description, etc.
 */
export class CreateInteractionDto {
  @IsArray({ message: '产品ID必须是数组' })
  @ArrayMinSize(1, { message: '至少选择一个产品' })
  @IsUUID('4', { each: true, message: '每个产品ID必须是有效的UUID' })
  productIds: string[];

  @IsUUID('4', { message: '客户ID必须是有效的UUID' })
  @IsNotEmpty({ message: '客户ID不能为空' })
  customerId: string;

  @IsIn(ALL_INTERACTION_TYPES, {
    message: '互动类型无效，必须是前端或后端专员的互动类型',
  })
  @IsNotEmpty({ message: '互动类型不能为空' })
  interactionType: InteractionType;

  @IsDateString({}, { message: '互动时间必须是有效的日期时间格式' })
  @IsNotEmpty({ message: '互动时间不能为空' })
  interactionDate: string;

  @IsString({ message: '互动描述必须是字符串' })
  @IsOptional()
  description?: string;

  @IsEnum(InteractionStatus, {
    message: '状态必须是有效的状态值',
  })
  @IsOptional()
  status?: InteractionStatus;

  @IsObject({ message: '额外信息必须是有效的JSON对象' })
  @IsOptional()
  additionalInfo?: Record<string, unknown>;

  @IsString({ message: '联系人ID必须是字符串' })
  @IsOptional()
  @IsUUID('4', { message: '联系人ID必须是有效的UUID' })
  personId?: string; // Optional reference to specific contact person
}

