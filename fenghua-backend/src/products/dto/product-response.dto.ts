/**
 * DTOs for product response
 * All custom code is proprietary and not open source.
 */

// ProductCategory removed - category is now a string validated against database

/**
 * Product response DTO
 */
export class ProductResponseDto {
  id: string;
  name: string;
  hsCode: string;
  description?: string;
  category?: string; // Category is now a string validated against database
  status: 'active' | 'inactive' | 'archived';
  specifications?: Record<string, unknown>;
  imageUrl?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

