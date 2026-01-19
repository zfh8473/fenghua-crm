/**
 * Customers Import Module
 * 
 * Module for customer data bulk import functionality
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { parseRedisUrlForBull } from '../../common/redis/bullmq-connection.util';
import { CustomersImportController } from './customers-import.controller';
import { CustomersImportService } from './customers-import.service';
import { CustomersImportProcessor } from './customers-import.processor';
import { ExcelParserService } from './services/excel-parser.service';
import { CsvParserService } from './services/csv-parser.service';
import { MappingService } from './services/mapping.service';
import { ValidationService } from './services/validation.service';
import { ErrorReportGeneratorService } from './services/error-report-generator.service';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { CompaniesModule } from '../../companies/companies.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    UsersModule, // For AdminGuard
    CompaniesModule, // For CompaniesService.bulkCreate()
    AuditModule, // For AuditService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        parseRedisUrlForBull(configService.get<string>('REDIS_URL'), { required: true }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'customer-import-queue',
    }),
  ],
  controllers: [CustomersImportController],
  providers: [
    CustomersImportService,
    CustomersImportProcessor,
    ExcelParserService,
    CsvParserService,
    MappingService,
    ValidationService,
    ErrorReportGeneratorService,
  ],
  exports: [CustomersImportService],
})
export class CustomersImportModule {}

