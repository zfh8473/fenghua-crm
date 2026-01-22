/**
 * DTOs for interaction update
 * All custom code is proprietary and not open source.
 */

/**
 * DTOs for interaction update
 * All custom code is proprietary and not open source.
 */

import {
  IsString,
  IsOptional,
  IsDateString,
  IsObject,
  IsEnum,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { InteractionStatus, FrontendInteractionType, BackendInteractionType } from './create-interaction.dto';

// All valid interaction types
const ALL_INTERACTION_TYPES = [
  ...Object.values(FrontendInteractionType),
  ...Object.values(BackendInteractionType),
];

/**
 * DTO for updating an interaction record
 * Note: productId and customerId cannot be modified (business rule)
 * interactionType can now be modified
 */
export class UpdateInteractionDto {
  @IsString({ message: '互动类型必须是字符串' })
  @IsIn(ALL_INTERACTION_TYPES, { message: '互动类型必须是有效的类型值' })
  @IsOptional()
  interactionType?: string;

  @IsString({ message: '互动描述必须是字符串' })
  @IsOptional()
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return value + ':00';
    }
    return value;
  })
  @IsDateString({}, { message: '互动时间必须是有效的日期时间格式' })
  @IsOptional()
  interactionDate?: string;

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

