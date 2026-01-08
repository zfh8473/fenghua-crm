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
} from 'class-validator';
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
}

