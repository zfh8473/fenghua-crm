/**
 * Association Type Constants
 * 
 * Defines association types for product-customer relationships
 * All custom code is proprietary and not open source.
 */

/**
 * Association type enum
 * 
 * - POTENTIAL_SUPPLIER: Supplier can supply this product (backend specialist perspective)
 * - POTENTIAL_BUYER: Buyer potentially will purchase this product (frontend specialist perspective)
 */
export enum AssociationType {
  POTENTIAL_SUPPLIER = 'POTENTIAL_SUPPLIER',
  POTENTIAL_BUYER = 'POTENTIAL_BUYER',
}




