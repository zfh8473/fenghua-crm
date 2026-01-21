/**
 * Association Type Types
 * 
 * Defines association types for product-customer relationships
 * Matches backend AssociationType enum
 * All custom code is proprietary and not open source.
 */

/**
 * Association type
 * 
 * - POTENTIAL_SUPPLIER: Supplier can supply this product (backend specialist perspective)
 * - POTENTIAL_BUYER: Buyer potentially will purchase this product (frontend specialist perspective)
 */
export type AssociationType = 'POTENTIAL_SUPPLIER' | 'POTENTIAL_BUYER';




