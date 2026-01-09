/**
 * Customer Timeline DTOs
 * 
 * DTOs for customer timeline queries and responses
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
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * File Attachment DTO (reused from Story 3.5)
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
 * Customer Timeline Interaction Response DTO
 * Includes interaction info, product info, and attachments
 */
export class CustomerTimelineInteractionDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  interactionType: string;

  @IsDateString()
  interactionDate: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  additionalInfo?: Record<string, unknown>;

  @IsDateString()
  createdAt: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  creatorEmail?: string;

  @IsOptional()
  creatorFirstName?: string;

  @IsOptional()
  creatorLastName?: string;

  // Product information (not in Story 3.5)
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productHsCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  attachments: FileAttachmentDto[];
}

/**
 * Customer Timeline Query DTO
 */
export class CustomerTimelineQueryDto {
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
  limit?: number = 50;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(['week', 'month', 'year', 'all'])
  dateRange?: 'week' | 'month' | 'year' | 'all' = 'all';
}




