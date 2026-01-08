/**
 * Product Customer Association Management DTOs
 * 
 * DTOs for creating and managing product-customer explicit associations
 * All custom code is proprietary and not open source.
 */

import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { AssociationType } from '../constants/association-types';
import { ProductCustomerAssociationDto } from './product-customer-association.dto';
import { CustomerProductAssociationDto } from '../../companies/dto/customer-product-association.dto';

/**
 * Create Product Customer Association DTO
 * Used for POST /api/products/:id/associations
 */
export class CreateProductCustomerAssociationDto {
  @IsUUID('4', { message: '客户ID必须是有效的UUID' })
  customerId: string;

  @IsEnum(AssociationType, {
    message: '关联类型必须是 POTENTIAL_SUPPLIER 或 POTENTIAL_BUYER',
  })
  associationType: AssociationType;
}

/**
 * Create Customer Product Association DTO
 * Used for POST /api/customers/:id/associations
 */
export class CreateCustomerProductAssociationDto {
  @IsUUID('4', { message: '产品ID必须是有效的UUID' })
  productId: string;

  @IsEnum(AssociationType, {
    message: '关联类型必须是 POTENTIAL_SUPPLIER 或 POTENTIAL_BUYER',
  })
  associationType: AssociationType;
}

/**
 * Product Customer Association Response DTO (Extended)
 * Extends ProductCustomerAssociationDto with association information
 * 
 * All associations are manually created through the product management or customer management interfaces.
 */
export class ProductCustomerAssociationResponseDto extends ProductCustomerAssociationDto {
  @IsOptional()
  @IsEnum(AssociationType)
  associationType?: AssociationType; // Association type from product_customer_associations table

  @IsOptional()
  @IsUUID('4')
  createdBy?: string; // ID of the user who created the association
}

/**
 * Customer Product Association Response DTO (Extended)
 * Extends CustomerProductAssociationDto with association information
 * 
 * All associations are manually created through the product management or customer management interfaces.
 */
export class CustomerProductAssociationResponseDto extends CustomerProductAssociationDto {
  @IsOptional()
  @IsEnum(AssociationType)
  associationType?: AssociationType; // Association type from product_customer_associations table

  @IsOptional()
  @IsUUID('4', { message: '创建者ID必须是有效的UUID' })
  createdBy?: string; // ID of the user who created the association
}

