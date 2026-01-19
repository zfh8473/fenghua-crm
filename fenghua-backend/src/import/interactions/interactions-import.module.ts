/**
 * Interactions Import Module
 * 
 * Module for interaction data bulk import functionality
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { parseRedisUrlForBull } from '../../common/redis/bullmq-connection.util';
import { InteractionsImportController } from './interactions-import.controller';
import { InteractionsImportService } from './interactions-import.service';
import { PermissionModule } from '../../permission/permission.module';
import { InteractionsImportProcessor } from './interactions-import.processor';
import { ExcelParserService } from '../customers/services/excel-parser.service';
import { CsvParserService } from '../customers/services/csv-parser.service';
import { InteractionMappingService } from './services/mapping.service';
import { InteractionValidationService } from './services/validation.service';
import { ErrorReportGeneratorService } from '../customers/services/error-report-generator.service';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { CompaniesModule } from '../../companies/companies.module';
import { ProductsModule } from '../../products/products.module';
import { InteractionsModule } from '../../interactions/interactions.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    UsersModule, // For AdminGuard
    CompaniesModule, // For CompaniesService.findAll()
    ProductsModule, // For ProductsService.findAll()
    InteractionsModule, // For InteractionsService (will add bulkCreate)
    PermissionModule, // For PermissionService
    AuditModule, // For AuditService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        parseRedisUrlForBull(configService.get<string>('REDIS_URL'), {
          fallback: 'redis://localhost:6379',
          required: false,
        }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'interaction-import-queue',
    }),
  ],
  controllers: [InteractionsImportController],
  providers: [
    InteractionsImportService,
    InteractionsImportProcessor,
    ExcelParserService,
    CsvParserService,
    InteractionMappingService,
    InteractionValidationService,
    ErrorReportGeneratorService,
  ],
  exports: [InteractionsImportService],
})
export class InteractionsImportModule {}

