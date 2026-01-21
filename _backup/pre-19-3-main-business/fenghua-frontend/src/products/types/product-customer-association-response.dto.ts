/**
 * Product Customer Association Response DTO
 * 
 * Type definition for product-customer association response
 * Matches backend ProductCustomerAssociationResponseDto
 * All custom code is proprietary and not open source.
 */

import { AssociationType } from './association-types';

/**
 * Product Customer Association Response DTO
 * 
 * All associations are manually created through the product management or customer management interfaces.
 */
export interface ProductCustomerAssociationResponseDto {
  id: string;
  name: string;
  customerType: 'SUPPLIER' | 'BUYER';
  interactionCount: number;
  associationType?: AssociationType;
  createdBy?: string; // ID of the user who created the association
}

