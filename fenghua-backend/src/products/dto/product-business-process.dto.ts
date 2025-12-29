/**
 * Product Business Process DTOs
 * 
 * Data transfer objects for product business process view
 * All custom code is proprietary and not open source.
 */

import { IsUUID, IsString, IsNotEmpty, IsIn, IsArray, IsOptional, IsDate, IsInt, Min } from 'class-validator';

/**
 * Business Process Stage Status
 */
export enum BusinessProcessStageStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress',
  NOT_STARTED = 'not-started',
}

/**
 * Business Process Stage DTO
 */
export class BusinessProcessStageDto {
  @IsString()
  @IsNotEmpty()
  stageName: string; // 阶段名称（中文）

  @IsString()
  @IsNotEmpty()
  stageKey: string; // 阶段键（英文，用于前端判断）

  @IsIn([BusinessProcessStageStatus.COMPLETED, BusinessProcessStageStatus.IN_PROGRESS, BusinessProcessStageStatus.NOT_STARTED])
  status: BusinessProcessStageStatus; // 阶段状态

  @IsOptional()
  @IsDate()
  completedAt?: Date; // 完成时间（该阶段最后一次互动的时间）

  @IsArray()
  @IsUUID('4', { each: true })
  interactionIds: string[]; // 该阶段的互动记录ID列表

  @IsInt()
  @Min(0)
  interactionCount: number; // 互动记录数量
}

/**
 * Product Business Process DTO
 */
export class ProductBusinessProcessDto {
  @IsIn(['BUYER', 'SUPPLIER'])
  customerType: 'BUYER' | 'SUPPLIER'; // 客户类型

  @IsIn(['buyer', 'supplier'])
  processType: 'buyer' | 'supplier'; // 流程类型

  @IsArray()
  stages: BusinessProcessStageDto[]; // 业务流程阶段列表

  @IsInt()
  @Min(0)
  totalInteractions: number; // 总互动记录数
}

/**
 * Product Business Process Query DTO
 */
export class ProductBusinessProcessQueryDto {
  @IsUUID('4')
  @IsNotEmpty()
  customerId: string; // 客户ID（必填）
}

