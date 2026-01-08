/**
 * Link Attachment DTO
 * 
 * DTO for linking attachment to interaction
 * All custom code is proprietary and not open source.
 */

import { IsUUID, IsNotEmpty } from 'class-validator';

export class LinkAttachmentDto {
  @IsUUID('4', { message: '互动记录ID必须是有效的UUID' })
  @IsNotEmpty({ message: '互动记录ID不能为空' })
  interactionId: string;
}

