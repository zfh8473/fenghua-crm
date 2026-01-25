/**
 * Person Interaction Stats DTOs
 * 
 * DTOs for person interaction statistics API
 * All custom code is proprietary and not open source.
 */

import { IsArray, ArrayMinSize, ArrayMaxSize, IsUUID } from 'class-validator';

/**
 * Person interaction statistics response DTO
 */
export class PersonInteractionStatsDto {
  /** 最后联系时间（ISO 8601 格式） */
  lastContactDate: string | null;

  /** 本月联系次数 */
  thisMonthCount: number;
}

/**
 * Batch person interaction statistics request DTO
 */
export class BatchPersonInteractionStatsDto {
  /** 联系人 ID 数组 */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100) // 限制批量查询数量
  @IsUUID('4', { each: true, message: '每个联系人ID必须是有效的UUID' })
  personIds: string[];
}

/**
 * Batch person interaction statistics response DTO
 */
export class BatchPersonInteractionStatsResponseDto {
  /** 统计信息映射表 */
  stats: {
    [personId: string]: PersonInteractionStatsDto;
  };
}
