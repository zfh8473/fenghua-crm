/**
 * Companies Module
 * 
 * Module for company (customer) management with role-based data filtering
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompaniesController } from './companies.controller';
import { CompaniesCompatController } from './companies-compat.controller';
import { CustomerProductAssociationController } from './customer-product-association.controller';
import { CustomerProductInteractionHistoryController } from './customer-product-interaction-history.controller';
import { CustomerTimelineController } from './customer-timeline.controller';
import { CustomerProductAssociationManagementController } from './customer-product-association-management.controller';
import { CompaniesService } from './companies.service';
import { CustomerProductAssociationService } from './customer-product-association.service';
import { CustomerProductInteractionHistoryService } from './customer-product-interaction-history.service';
import { CustomerTimelineService } from './customer-timeline.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionModule } from '../permission/permission.module';
import { AuditModule } from '../audit/audit.module';
import { ProductsModule } from '../products/products.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    PermissionModule, // Import to use PermissionService for role-based filtering
    forwardRef(() => AuditModule), // Import to use AuditService for audit logging - use forwardRef to avoid circular dependency
    forwardRef(() => ProductsModule), // Use forwardRef to avoid circular dependency
    EncryptionModule, // Import to use encryption interceptors and services
  ],
  controllers: [
    CompaniesController, // Handles /customers routes
    CompaniesCompatController, // Handles /companies/:id for backward compatibility
    CustomerProductAssociationManagementController, // /customers/:id/associations - MUST be before CompaniesController
    CustomerProductAssociationController, // Handles /customers/:id/products routes
    CustomerProductInteractionHistoryController, // Handles /customers/:customerId/interactions routes
    CustomerTimelineController, // Handles /customers/:customerId/timeline routes
  ],
  providers: [
    CompaniesService,
    CustomerProductAssociationService,
    CustomerProductInteractionHistoryService,
    CustomerTimelineService,
  ],
  exports: [
    CompaniesService,
    CustomerProductAssociationService,
    CustomerProductInteractionHistoryService,
    CustomerTimelineService,
  ],
})
export class CompaniesModule {}

