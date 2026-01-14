/**
 * GDPR Module
 * 
 * Module for GDPR data export and deletion functionality
 * All custom code is proprietary and not open source.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { GdprExportController } from './gdpr-export.controller';
import { GdprExportService } from './gdpr-export.service';
import { GdprExportProcessor } from './gdpr-export.processor';
import { GdprExportScheduler } from './gdpr-export.scheduler';
import { GdprDeletionController } from './gdpr-deletion.controller';
import { GdprDeletionService } from './gdpr-deletion.service';
import { GdprDeletionProcessor } from './gdpr-deletion.processor';
import { GdprDeletionScheduler } from './gdpr-deletion.scheduler';
import { JsonExporterService } from '../export/services/json-exporter.service';
import { CsvExporterService } from '../export/services/csv-exporter.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionModule } from '../permission/permission.module';
import { CompaniesModule } from '../companies/companies.module';
import { ProductsModule } from '../products/products.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { AuditModule } from '../audit/audit.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule,
    AuthModule,
    PermissionModule,
    CompaniesModule,
    ProductsModule,
    InteractionsModule,
    forwardRef(() => AuditModule),
    ExportModule, // For JsonExporterService and CsvExporterService
    // BullModule configuration for GDPR queues
    // Note: BullModule.forRootAsync is already configured in ExportModule, but we need to register our queues
    BullModule.registerQueue({
      name: 'gdpr-export-queue',
    }),
    BullModule.registerQueue({
      name: 'gdpr-deletion-queue',
    }),
  ],
  controllers: [
    GdprExportController,
    GdprDeletionController,
  ],
  providers: [
    GdprExportService,
    GdprExportProcessor,
    GdprExportScheduler,
    GdprDeletionService,
    GdprDeletionProcessor,
    GdprDeletionScheduler,
  ],
  exports: [
    GdprExportService,
    GdprDeletionService,
  ],
})
export class GdprModule {}
