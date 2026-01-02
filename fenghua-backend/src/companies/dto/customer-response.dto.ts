/**
 * DTOs for customer response
 * All custom code is proprietary and not open source.
 */

/**
 * Customer response DTO
 */
export class CustomerResponseDto {
  id: string;
  name: string;
  customerCode: string;
  customerType: 'BUYER' | 'SUPPLIER';
  domainName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  employees?: number;
  website?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

