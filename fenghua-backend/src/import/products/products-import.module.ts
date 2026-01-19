/**
 * Products Import Module
 * 
 * Module for product data bulk import functionality
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { parseRedisUrlForBull } from '../../common/redis/bullmq-connection.util';
import { ProductsImportController } from './products-import.controller';
import { ProductsImportService } from './products-import.service';
import { ProductsImportProcessor } from './products-import.processor';
import { ExcelParserService } from '../customers/services/excel-parser.service';
import { CsvParserService } from '../customers/services/csv-parser.service';
import { ProductMappingService } from './services/mapping.service';
import { ProductValidationService } from './services/validation.service';
import { ErrorReportGeneratorService } from '../customers/services/error-report-generator.service';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { ProductsModule } from '../../products/products.module';
import { ProductCategoriesModule } from '../../product-categories/product-categories.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    UsersModule, // For AdminGuard
    ProductsModule, // For ProductsService.bulkCreate()
    ProductCategoriesModule, // For ProductCategoriesService.findAll()
    AuditModule, // For AuditService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        parseRedisUrlForBull(configService.get<string>('REDIS_URL'), { required: true }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'product-import-queue',
    }),
  ],
  controllers: [ProductsImportController],
  providers: [
    ProductsImportService,
    ProductsImportProcessor,
    ExcelParserService,
    CsvParserService,
    ProductMappingService,
    ProductValidationService,
    ErrorReportGeneratorService,
  ],
  exports: [ProductsImportService],
})
export class ProductsImportModule {}


