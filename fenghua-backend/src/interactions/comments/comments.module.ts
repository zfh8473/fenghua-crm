/**
 * Comments Module
 * 
 * Module for interaction record comments
 * All custom code is proprietary and not open source.
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AuthModule } from '../../auth/auth.module';
import { InteractionsModule } from '../interactions.module';
import { CompaniesModule } from '../../companies/companies.module';
import { PermissionModule } from '../../permission/permission.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule, // For AuthService to validate tokens
    InteractionsModule, // For InteractionsService to validate interaction access
    CompaniesModule, // For CompaniesService to verify customer type
    PermissionModule, // For PermissionService to check permissions
    forwardRef(() => AuditModule), // For AuditService to log operations - use forwardRef to avoid circular dependency
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
