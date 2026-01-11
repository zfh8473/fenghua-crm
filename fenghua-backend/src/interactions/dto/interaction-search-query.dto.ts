/**
 * Interaction Search Query DTO
 * 
 * DTO for searching interaction records with advanced filtering
 * All custom code is proprietary and not open source.
 */

import { IsOptional, IsArray, IsString, IsUUID, IsEnum, IsDateString, IsInt, Min, Max, IsIn, IsNotEmpty, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FrontendInteractionType, BackendInteractionType, InteractionStatus } from './create-interaction.dto';

export type InteractionType = FrontendInteractionType | BackendInteractionType;

/**
 * Interaction Search Query DTO
 * 
 * Supports filtering by:
 * - interactionTypes: Array of interaction types (multi-select)
 * - statuses: Array of interaction statuses (multi-select)
 * - startDate: Start date for date range filter
 * - endDate: End date for date range filter
 * - customerId: Filter by specific customer
 * - productId: Filter by specific product
 * - categories: Array of product categories (multi-select)
 * - createdBy: Filter by creator user ID
 * - sortBy: Field to sort by (interactionDate, customerName, productName, productHsCode, interactionType)
 * - sortOrder: Sort order (asc or desc)
 * - limit: Number of results per page
 * - offset: Offset for pagination
 */
export class InteractionSearchQueryDto {
  /**
   * Array of interaction types to filter by (multi-select)
   * Replaces the old single interactionType field
   */
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const filtered = value.filter(v => v && typeof v === 'string' && v.trim() !== '');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const arr = value.split(',').map(v => v.trim()).filter(v => v !== '');
      return arr.length > 0 ? arr : undefined;
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEnum([...Object.values(FrontendInteractionType), ...Object.values(BackendInteractionType)], { each: true })
  interactionTypes?: string[];

  /**
   * Array of interaction statuses to filter by (multi-select)
   * Replaces the old single status field
   */
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const filtered = value.filter(v => v && typeof v === 'string' && v.trim() !== '');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const arr = value.split(',').map(v => v.trim()).filter(v => v !== '');
      return arr.length > 0 ? arr : undefined;
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsEnum(InteractionStatus, { each: true })
  statuses?: InteractionStatus[];

  /**
   * Start date for date range filter (ISO 8601 format)
   */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * End date for date range filter (ISO 8601 format)
   */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Filter by specific customer ID
   */
  @Transform(({ value }) => {
    if (!value || value === '' || (typeof value === 'string' && value.trim() === '')) return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null && value !== '')
  @IsUUID(4, { message: 'customerId must be a valid UUID' })
  customerId?: string;

  /**
   * Filter by specific product ID
   */
  @Transform(({ value }) => {
    if (!value || value === '' || (typeof value === 'string' && value.trim() === '')) return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null && value !== '')
  @IsUUID(4, { message: 'productId must be a valid UUID' })
  productId?: string;

  /**
   * Array of product categories to filter by (multi-select)
   */
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const filtered = value.filter(v => v && typeof v === 'string' && v.trim() !== '');
      return filtered.length > 0 ? filtered : undefined;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const arr = value.split(',').map(v => v.trim()).filter(v => v !== '');
      return arr.length > 0 ? arr : undefined;
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  /**
   * Filter by creator user ID
   */
  @Transform(({ value }) => {
    if (!value || value === '' || (typeof value === 'string' && value.trim() === '')) return undefined;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null && value !== '')
  @IsUUID(4, { message: 'createdBy must be a valid UUID' })
  createdBy?: string;

  /**
   * Field to sort by
   */
  @Transform(({ value }) => {
    if (!value) return 'interactionDate'; // Default value
    // Map legacy snake_case values to camelCase
    if (value === 'interaction_date') return 'interactionDate';
    if (value === 'customer_name') return 'customerName';
    if (value === 'product_name') return 'productName';
    if (value === 'product_hs_code') return 'productHsCode';
    if (value === 'interaction_type') return 'interactionType';
    return value;
  })
  @IsOptional()
  @IsString()
  @IsIn(['interactionDate', 'customerName', 'productName', 'productHsCode', 'interactionType'])
  sortBy?: 'interactionDate' | 'customerName' | 'productName' | 'productHsCode' | 'interactionType' = 'interactionDate';

  /**
   * Sort order
   */
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  /**
   * Number of results per page
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Offset for pagination
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

