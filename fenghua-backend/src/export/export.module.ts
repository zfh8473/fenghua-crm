/**
 * Export Module
 * 
 * Module for data export functionality
 * All custom code is proprietary and not open source.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportProcessor } from './export.processor';
import { JsonExporterService } from './services/json-exporter.service';
import { CsvExporterService } from './services/csv-exporter.service';
import { ExcelExporterService } from './services/excel-exporter.service';
import { FieldDefinitionService } from './services/field-definition.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CompaniesModule } from '../companies/companies.module';
import { ProductsModule } from '../products/products.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    forwardRef(() => UsersModule), // For AdminGuard - use forwardRef to avoid circular dependency
    CompaniesModule, // For CompaniesService
    ProductsModule, // For ProductsService
    InteractionsModule, // For InteractionsService
    forwardRef(() => AuditModule), // For AuditService - use forwardRef to avoid circular dependency
    // BullModule configuration - make it optional, use default Redis if REDIS_URL not set
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        try {
          const url = new URL(redisUrl);
          return {
            connection: {
              host: url.hostname,
              port: parseInt(url.port || '6379', 10),
              password: url.password || undefined,
            },
          };
        } catch (error) {
          // If URL parsing fails, use default localhost Redis
          return {
            connection: {
              host: 'localhost',
              port: 6379,
            },
          };
        }
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'export-queue',
    }),
  ],
  controllers: [ExportController],
  providers: [
    ExportService,
    ExportProcessor,
    JsonExporterService,
    CsvExporterService,
    ExcelExporterService,
    FieldDefinitionService,
  ],
  exports: [
    ExportService,
    ExcelExporterService,
    CsvExporterService,
    JsonExporterService, // Export for GDPR module
  ],
})
export class ExportModule {}

