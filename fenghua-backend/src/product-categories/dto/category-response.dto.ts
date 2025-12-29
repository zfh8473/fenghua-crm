/**
 * DTOs for product category response
 * All custom code is proprietary and not open source.
 */

/**
 * DTO for product category response
 */
export class CategoryResponseDto {
  id: string;
  name: string;
  hsCode: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  productCount?: number; // Optional: usage statistics
}

/**
 * DTO for category with usage statistics
 */
export class CategoryWithStatsDto extends CategoryResponseDto {
  productCount: number; // Required: usage statistics
}

