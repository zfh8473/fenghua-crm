/**
 * Product Categories Module
 * 
 * Module for product category management
 * All custom code is proprietary and not open source.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => AuditModule), // Use forwardRef to avoid circular dependency
    AuthModule, // Required for JwtAuthGuard used in ProductCategoriesController
  ],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService],
  exports: [ProductCategoriesService], // Export for use in ProductsModule
})
export class ProductCategoriesModule {}

