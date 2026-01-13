/**
 * Audit Module
 * 
 * Module for audit logging functionality
 * All custom code is proprietary and not open source.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditLogsController } from './audit-logs.controller';
import { DataAccessAuditInterceptor } from './interceptors/data-access-audit.interceptor';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule),
    AuthModule,
    forwardRef(() => ExportModule), // For CSV and Excel export services - use forwardRef to avoid circular dependency
  ],
  controllers: [AuditLogsController],
  providers: [
    AuditService,
    DataAccessAuditInterceptor,
    // Register interceptor globally (optional - can also be applied per controller)
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: DataAccessAuditInterceptor,
    // },
  ],
  exports: [AuditService, DataAccessAuditInterceptor],
})
export class AuditModule {}

