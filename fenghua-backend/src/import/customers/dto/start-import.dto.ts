/**
 * DTOs for starting import
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ColumnMappingDto } from './mapping-preview.dto';

/**
 * DTO for starting import request
 */
export class StartImportDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  @IsOptional()
  columnMappings?: ColumnMappingDto[];
}

