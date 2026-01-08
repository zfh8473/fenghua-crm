/**
 * Customer Product Association Response DTO
 * 
 * Type definition for customer-product association response
 * Matches backend CustomerProductAssociationResponseDto
 * All custom code is proprietary and not open source.
 */

import { AssociationType } from '../../products/types/association-types';

/**
 * Customer Product Association Response DTO
 * 
 * All associations are manually created through the product management or customer management interfaces.
 */
export interface CustomerProductAssociationResponseDto {
  id: string;
  name: string;
  hsCode: string;
  category?: string;
  interactionCount: number;
  associationType?: AssociationType;
  createdBy?: string; // ID of the user who created the association
}

