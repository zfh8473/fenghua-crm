/**
 * DTOs for integrity validation
 * All custom code is proprietary and not open source.
 */

import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray, IsEnum, IsInt, Min, Max, IsDate, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Integrity issue type enum
 */
export enum IntegrityIssueType {
  INVALID_PRODUCT = 'invalid_product',
  INVALID_CUSTOMER = 'invalid_customer',
  DELETED_PRODUCT = 'deleted_product',
  DELETED_CUSTOMER = 'deleted_customer',
  INACTIVE_PRODUCT = 'inactive_product',
}

/**
 * Integrity issue severity enum
 */
export enum IntegrityIssueSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
}

/**
 * Integrity issue DTO
 */
export class IntegrityIssueDto {
  @IsString()
  @IsNotEmpty()
  interactionId: string;

  @IsEnum(IntegrityIssueType)
  issueType: IntegrityIssueType;

  @IsEnum(IntegrityIssueSeverity)
  severity: IntegrityIssueSeverity;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  suggestedFix: string;
}

/**
 * Integrity validation result DTO
 */
export class IntegrityValidationResultDto {
  @IsString()
  @IsNotEmpty()
  reportId?: string;

  @IsDate()
  @Type(() => Date)
  validationTime: Date;

  @IsInt()
  @Min(0)
  totalRecords: number;

  @IsInt()
  @Min(0)
  validRecords: number;

  @IsInt()
  @Min(0)
  invalidRecords: number;

  @IsArray()
  @Type(() => IntegrityIssueDto)
  issues: IntegrityIssueDto[];

  @IsString()
  @IsOptional()
  taskId?: string; // For async validation

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  progress?: number; // For async validation (0-100)
}

/**
 * Integrity validation query DTO
 */
export class IntegrityValidationQueryDto {
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @IsOptional()
  @IsUUID('4')
  customerId?: string;
}

/**
 * Fix integrity issue action enum
 */
export enum FixIntegrityIssueAction {
  DELETE = 'delete',
  MARK_FIXED = 'mark_fixed',
}

/**
 * Fix integrity issues DTO
 */
export class FixIntegrityIssuesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  issueIds: string[];

  @IsIn(Object.values(FixIntegrityIssueAction))
  fixAction: FixIntegrityIssueAction;
}

/**
 * Fix integrity issues result DTO
 */
export class FixIntegrityIssuesResultDto {
  @IsInt()
  @Min(0)
  successCount: number;

  @IsInt()
  @Min(0)
  failureCount: number;

  @IsArray()
  @IsString({ each: true })
  failedIssueIds: string[];
}

