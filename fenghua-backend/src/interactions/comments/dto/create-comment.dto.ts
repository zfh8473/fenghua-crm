/**
 * DTOs for comment creation
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * DTO for creating a new comment on an interaction record
 */
export class CreateCommentDto {
  @IsString({ message: '评论内容必须是字符串' })
  @IsNotEmpty({ message: '评论内容不能为空' })
  @MaxLength(5000, { message: '评论内容不能超过5000个字符' })
  content: string;
}
