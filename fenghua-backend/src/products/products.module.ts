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
import { TwentyClientModule } from '../services/twenty-client/twenty-client.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ProductCategoriesModule } from '../product-categories/product-categories.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(), // For scheduled integrity validation
    TwentyClientModule,
    AuditModule,
    AuthModule,
    ProductCategoriesModule, // Import to use ProductCategoriesService in ProductsService
    PermissionModule, // Import to use PermissionService in ProductCustomerAssociationService
  ],
  controllers: [
    // Register more specific routes first to avoid route conflicts
    ProductAssociationIntegrityController, // /products/integrity/* routes
    ProductBusinessProcessController,
    ProductCustomerInteractionHistoryController,
    ProductCustomerAssociationController,
    ProductsController,
  ],
  providers: [
    ProductsService,
    ProductCustomerAssociationService,
    ProductCustomerInteractionHistoryService,
    ProductBusinessProcessService,
    ProductAssociationIntegrityService,
  ],
  exports: [
    ProductsService,
    ProductCustomerAssociationService,
    ProductCustomerInteractionHistoryService,
    ProductBusinessProcessService,
    ProductAssociationIntegrityService,
  ],
})
export class ProductsModule {}

