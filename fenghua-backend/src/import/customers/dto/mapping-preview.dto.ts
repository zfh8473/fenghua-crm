/**
 * DTOs for mapping preview
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray } from 'class-validator';

/**
 * Column mapping definition
 */
export class ColumnMappingDto {
  @IsString()
  @IsNotEmpty()
  excelColumn: string;

  @IsString()
  @IsOptional()
  crmField?: string;

  @IsString()
  @IsOptional()
  suggestedField?: string;
}

/**
 * DTO for mapping preview request
 */
export class MappingPreviewRequestDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsArray()
  @IsOptional()
  customMappings?: ColumnMappingDto[];
}

/**
 * DTO for mapping preview response
 */
export class MappingPreviewResponseDto {
  @IsArray()
  columns: ColumnMappingDto[];

  @IsArray()
  sampleData: Record<string, any>[];

  @IsObject()
  @IsOptional()
  statistics?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

