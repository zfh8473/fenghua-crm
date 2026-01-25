/**
 * People Module
 * 
 * Module for people (contact) management with role-based data filtering
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { PeopleInteractionStatsController } from './people-interaction-stats.controller';
import { PeopleInteractionStatsService } from './people-interaction-stats.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionModule } from '../permission/permission.module';
import { AuditModule } from '../audit/audit.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    PermissionModule, // Import to use PermissionService for role-based filtering
    forwardRef(() => AuditModule), // Import to use AuditService for audit logging - use forwardRef to avoid circular dependency
    EncryptionModule, // Import to use encryption interceptors and services
  ],
  controllers: [PeopleController, PeopleInteractionStatsController],
  providers: [PeopleService, PeopleInteractionStatsService],
  exports: [PeopleService],
})
export class PeopleModule {}
