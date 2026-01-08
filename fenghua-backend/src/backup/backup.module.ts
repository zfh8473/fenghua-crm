/**
 * Backup Module
 * 
 * Module for backup functionality
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BackupService } from './backup.service';
import { BackupStatusService } from './backup-status.service';
import { BackupController } from './backup.controller';
import { TwentyClientModule } from '../services/twenty-client/twenty-client.module';
import { SettingsModule } from '../settings/settings.module';
// import { LogsModule } from '../logs/logs.module'; // TODO: LogsModule not implemented yet
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    TwentyClientModule,
    SettingsModule,
    // LogsModule, // TODO: LogsModule not implemented yet
    AuthModule,
  ],
  controllers: [BackupController],
  providers: [BackupService, BackupStatusService],
  exports: [BackupService, BackupStatusService],
})
export class BackupModule {}

