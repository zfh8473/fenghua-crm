/**
 * Restore Module
 * 
 * Module for restore functionality
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RestoreService } from './restore.service';
import { RestoreController } from './restore.controller';
import { BackupModule } from '../backup/backup.module';
import { AuditModule } from '../audit/audit.module';
// import { LogsModule } from '../logs/logs.module'; // TODO: LogsModule not implemented yet
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    BackupModule,
    AuditModule,
    // LogsModule, // TODO: LogsModule not implemented yet
    SettingsModule,
    AuthModule,
  ],
  controllers: [RestoreController],
  providers: [RestoreService],
  exports: [RestoreService],
})
export class RestoreModule {}

