/**
 * Data Retention Module
 * 
 * Module for data retention policy management and automatic cleanup
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DataRetentionService } from './data-retention.service';
import { DataRetentionScheduler } from './data-retention.scheduler';
import { DataRetentionController } from './data-retention.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    AuditModule,
    AuthModule, // For JwtAuthGuard
    UsersModule, // For AdminGuard
  ],
  providers: [DataRetentionService, DataRetentionScheduler],
  controllers: [DataRetentionController],
  exports: [DataRetentionService],
})
export class DataRetentionModule {}
