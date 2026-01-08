/**
 * Attachments Module
 * 
 * Module for file attachment management
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { LocalStorageService } from './storage/local-storage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule, // For AuthService to validate tokens
  ],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    LocalStorageService,
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}

