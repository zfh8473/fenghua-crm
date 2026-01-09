/**
 * DTOs for validation result
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsObject, IsBoolean } from 'class-validator';

/**
 * Error detail for a failed record
 */
export class ValidationErrorDetailDto {
  @IsNumber()
  row: number;

  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * Data cleaning suggestion
 */
export class DataCleaningSuggestionDto {
  @IsNumber()
  row: number;

  @IsString()
  field: string;

  @IsString()
  originalValue: string;

  @IsString()
  suggestedValue: string;

  @IsString()
  reason: string;
}

/**
 * Duplicate detection result
 */
export class DuplicateDetectionDto {
  @IsNumber()
  row: number;

  @IsString()
  field: string;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  existingCustomerId?: string;

  @IsString()
  @IsOptional()
  existingCustomerName?: string;
}

/**
 * DTO for validation result
 */
export class ValidationResultDto {
  @IsNumber()
  totalRecords: number;

  @IsNumber()
  validRecords: number;

  @IsNumber()
  invalidRecords: number;

  @IsArray()
  @IsOptional()
  errors?: ValidationErrorDetailDto[];

  @IsArray()
  @IsOptional()
  cleaningSuggestions?: DataCleaningSuggestionDto[];

  @IsArray()
  @IsOptional()
  duplicates?: DuplicateDetectionDto[];

  @IsBoolean()
  hasErrors: boolean;

  @IsBoolean()
  hasDuplicates: boolean;

  @IsBoolean()
  hasCleaningSuggestions: boolean;
}

