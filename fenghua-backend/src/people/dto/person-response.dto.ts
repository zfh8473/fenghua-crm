/**
 * DTOs for person response
 * All custom code is proprietary and not open source.
 */

/**
 * Customer information in person response (optional)
 */
export class PersonCompanyDto {
  id: string;
  name: string;
  customerCode?: string;
  customerType?: 'BUYER' | 'SUPPLIER';
}

/**
 * Person response DTO
 */
export class PersonResponseDto {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  wechat?: string;
  whatsapp?: string;
  facebook?: string;
  notes?: string;
  companyId: string;
  company?: PersonCompanyDto; // Optional: include company information
  isImportant: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
