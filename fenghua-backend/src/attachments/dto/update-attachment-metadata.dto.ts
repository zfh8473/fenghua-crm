/**
 * Update Attachment Metadata DTO
 * 
 * DTO for updating attachment metadata (order and annotation)
 * All custom code is proprietary and not open source.
 */

import { IsOptional, IsNumber, IsString, MaxLength } from 'class-validator';

export class UpdateAttachmentMetadataDto {
  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '标注不能超过 50 个字符' })
  annotation?: string;
}

