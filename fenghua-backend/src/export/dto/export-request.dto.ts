/**
 * DTOs for export requests
 * All custom code is proprietary and not open source.
 */

import { IsEnum, IsOptional, IsObject, ValidateNested, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerQueryDto } from '../../companies/dto/customer-query.dto';
import { ProductQueryDto } from '../../products/dto/product-query.dto';
// Note: InteractionsService.findAll() uses inline query parameters, not a DTO

/**
 * Export data types
 */
export enum ExportDataType {
  CUSTOMER = 'CUSTOMER',
  PRODUCT = 'PRODUCT',
  INTERACTION = 'INTERACTION',
}

/**
 * Export formats
 */
export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

/**
 * Base export request DTO
 */
export class ExportRequestDto {
  @IsEnum(ExportDataType)
  dataType: ExportDataType;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerQueryDto)
  customerFilters?: CustomerQueryDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductQueryDto)
  productFilters?: ProductQueryDto;

  @IsOptional()
  @IsObject()
  interactionFilters?: {
    customerId?: string;
    productId?: string;
    interactionType?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedFields?: string[]; // Optional: if empty, export all fields
}

