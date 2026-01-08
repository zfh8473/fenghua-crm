/**
 * Audit Module
 * 
 * Module for audit logging functionality
 * All custom code is proprietary and not open source.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditService } from './audit.service';
import { AuditLogsController } from './audit-logs.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, forwardRef(() => UsersModule), AuthModule],
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

