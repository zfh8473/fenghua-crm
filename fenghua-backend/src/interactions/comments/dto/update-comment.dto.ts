/**
 * Update Comment DTO
 * 
 * DTO for updating an existing comment
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * DTO for updating a comment
 */
export class UpdateCommentDto {
  /**
   * Updated comment content
   * Must not be empty
   */
  @IsString({ message: '评论内容必须是字符串' })
  @IsNotEmpty({ message: '评论内容不能为空' })
  content: string;
}
