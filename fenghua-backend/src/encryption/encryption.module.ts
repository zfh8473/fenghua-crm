/**
 * Encryption Module
 * 
 * Module for data encryption and key management
 * All custom code is proprietary and not open source.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EncryptionService } from './encryption.service';
import { KeyManagementService } from './key-management.service';
import { KeyRotationService } from './key-rotation.service';
import { KeyRotationScheduler } from './key-rotation.scheduler';
import { EncryptionInterceptor } from './interceptors/encryption.interceptor';
import { DecryptionInterceptor } from './interceptors/decryption.interceptor';
import { EncryptionController } from './encryption.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule, // For scheduled key rotation (forRoot() is called in AppModule)
    forwardRef(() => AuditModule), // For audit logging in DecryptionInterceptor and KeyRotationService
    AuthModule, // For AuthService in DecryptionInterceptor
    forwardRef(() => UsersModule), // For AdminGuard in EncryptionController (use forwardRef to avoid circular dependency)
  ],
  controllers: [EncryptionController],
  providers: [
    EncryptionService,
    KeyManagementService,
    KeyRotationService,
    KeyRotationScheduler,
    EncryptionInterceptor,
    DecryptionInterceptor,
  ],
  exports: [
    EncryptionService,
    KeyManagementService,
    KeyRotationService,
    EncryptionInterceptor,
    DecryptionInterceptor,
  ],
})
export class EncryptionModule {}
