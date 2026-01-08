/**
 * Interactions Module
 * 
 * Module for interaction record management
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { CompaniesModule } from '../companies/companies.module';
import { PermissionModule } from '../permission/permission.module';
import { AuditModule } from '../audit/audit.module';
// Note: ProductCustomerAssociationManagementService is now exported from ProductsModule
// Import ProductsModule instead of ProductCustomerAssociationManagementModule

@Module({
  imports: [
    ConfigModule,
    AuthModule, // For AuthService to validate tokens
    ProductsModule, // For ProductsService and ProductCustomerAssociationManagementService (exported)
    CompaniesModule, // For CompaniesService to validate customers
    PermissionModule, // For PermissionService to check permissions
    AuditModule, // For AuditService to log operations
  ],
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}

