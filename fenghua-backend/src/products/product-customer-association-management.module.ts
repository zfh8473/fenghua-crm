/**
 * Product Customer Association Management Module
 * 
 * Module for managing explicit product-customer associations
 * All custom code is proprietary and not open source.
 */

/**
 * Product Customer Association Management Module
 * 
 * NOTE: This module is now deprecated. 
 * - ProductCustomerAssociationManagementController and Service are registered in ProductsModule
 * - CustomerProductAssociationManagementController is registered in CompaniesModule
 * 
 * This module is kept for backward compatibility but is empty.
 * It may be removed in the future after verifying no other modules depend on it.
 */
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class ProductCustomerAssociationManagementModule {}

