/**
 * Customer Product Interaction History DTOs
 * 
 * DTOs for customer-product interaction history queries and responses
 * All custom code is proprietary and not open source.
 */

import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDate,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * File Attachment DTO
 */
export class FileAttachmentDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsInt()
  @Min(0)
  fileSize: number;

  @IsString()
  @IsOptional()
  mimeType?: string;
}

/**
 * Customer Product Interaction Response DTO
 */
export class CustomerProductInteractionDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  interactionType: string;

  @IsDate()
  interactionDate: Date;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  additionalInfo?: Record<string, unknown>;

  @IsDate()
  createdAt: Date;

  @IsUUID()
  @IsOptional()
  createdBy?: string;

  @IsObject()
  @IsOptional()
  creator?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  attachments: FileAttachmentDto[];
}

/**
 * Customer Product Interaction Query DTO
 */
export class CustomerProductInteractionQueryDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

