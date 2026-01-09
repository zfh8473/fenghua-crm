/**
 * Export Module
 * 
 * Module for data export functionality
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
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
    UsersModule, // For AdminGuard
    CompaniesModule, // For CompaniesService
    ProductsModule, // For ProductsService
    InteractionsModule, // For InteractionsService
    AuditModule, // For AuditService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL is required for BullMQ');
        }
        return {
          connection: {
            host: new URL(redisUrl).hostname,
            port: parseInt(new URL(redisUrl).port || '6379', 10),
            password: new URL(redisUrl).password || undefined,
          },
        };
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
  exports: [ExportService],
})
export class ExportModule {}

