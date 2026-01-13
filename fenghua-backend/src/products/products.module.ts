/**
 * Products Module
 * 
 * Module for product management
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductCustomerAssociationController } from './product-customer-association.controller';
import { ProductCustomerAssociationService } from './product-customer-association.service';
import { ProductCustomerInteractionHistoryController } from './product-customer-interaction-history.controller';
import { ProductCustomerInteractionHistoryService } from './product-customer-interaction-history.service';
import { ProductBusinessProcessController } from './product-business-process.controller';
import { ProductBusinessProcessService } from './product-business-process.service';
import { ProductAssociationIntegrityController } from './product-association-integrity.controller';
import { ProductAssociationIntegrityService } from './product-association-integrity.service';
import { ProductCustomerAssociationManagementController } from './product-customer-association-management.controller';
import { ProductCustomerAssociationManagementService } from './product-customer-association-management.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ProductCategoriesModule } from '../product-categories/product-categories.module';
import { PermissionModule } from '../permission/permission.module';
import { CompaniesModule } from '../companies/companies.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(), // For scheduled integrity validation
    forwardRef(() => AuditModule), // Use forwardRef to avoid circular dependency
    AuthModule, // Import to use AuthService and PermissionAuditService in ProductsService
    ProductCategoriesModule, // Import to use ProductCategoriesService in ProductsService
    PermissionModule, // Import to use PermissionService in ProductCustomerAssociationService
    forwardRef(() => CompaniesModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [
    // Register more specific routes first to avoid route conflicts
    ProductAssociationIntegrityController, // /products/integrity/* routes
    ProductBusinessProcessController,
    ProductCustomerInteractionHistoryController,
    ProductCustomerAssociationManagementController, // /products/:id/associations - MUST be before ProductsController
    ProductCustomerAssociationController, // /products/:id/customers
    ProductsController, // /products/:id - MUST be last to avoid catching /:id/associations
  ],
  providers: [
    ProductsService,
    ProductCustomerAssociationService,
    ProductCustomerInteractionHistoryService,
    ProductBusinessProcessService,
    ProductAssociationIntegrityService,
    ProductCustomerAssociationManagementService, // Register here to avoid circular dependency
  ],
  exports: [
    ProductsService,
    ProductCustomerAssociationService,
    ProductCustomerInteractionHistoryService,
    ProductBusinessProcessService,
    ProductAssociationIntegrityService,
    ProductCustomerAssociationManagementService, // Export for use in other modules
  ],
})
export class ProductsModule {}

