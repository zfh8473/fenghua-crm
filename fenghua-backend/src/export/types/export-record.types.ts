/**
 * Type definitions for export records
 * All custom code is proprietary and not open source.
 */

import { ExportDataType } from '../dto/export-request.dto';
import { CustomerResponseDto } from '../../companies/dto/customer-response.dto';
import { ProductResponseDto } from '../../products/dto/product-response.dto';
import { InteractionResponseDto } from '../../interactions/dto/interaction-response.dto';

/**
 * Base export record type - a record with string keys and any value
 */
export type ExportRecord = Record<string, unknown>;

/**
 * Customer export record - extends CustomerResponseDto with all possible fields
 */
export type CustomerExportRecord = CustomerResponseDto & Record<string, unknown>;

/**
 * Product export record - extends ProductResponseDto with all possible fields
 */
export type ProductExportRecord = ProductResponseDto & Record<string, unknown>;

/**
 * Interaction export record - extends InteractionResponseDto with enriched fields
 */
export type InteractionExportRecord = InteractionResponseDto & {
  customerName?: string | null;
  productName?: string | null;
} & Record<string, unknown>;

/**
 * Union type for all export record types
 */
export type AnyExportRecord = ExportRecord;

/**
 * Type guard to check if a record is a customer export record
 */
export function isCustomerExportRecord(
  record: ExportRecord,
  exportType: ExportDataType,
): record is CustomerExportRecord {
  return exportType === ExportDataType.CUSTOMER;
}

/**
 * Type guard to check if a record is a product export record
 */
export function isProductExportRecord(
  record: ExportRecord,
  exportType: ExportDataType,
): record is ProductExportRecord {
  return exportType === ExportDataType.PRODUCT;
}

/**
 * Type guard to check if a record is an interaction export record
 */
export function isInteractionExportRecord(
  record: ExportRecord,
  exportType: ExportDataType,
): record is InteractionExportRecord {
  return exportType === ExportDataType.INTERACTION;
}

/**
 * Get the appropriate export record type based on export type
 */
export type ExportRecordByType<T extends ExportDataType> = T extends ExportDataType.CUSTOMER
  ? CustomerExportRecord
  : T extends ExportDataType.PRODUCT
    ? ProductExportRecord
    : T extends ExportDataType.INTERACTION
      ? InteractionExportRecord
      : ExportRecord;

