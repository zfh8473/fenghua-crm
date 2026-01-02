/**
 * Permission Module
 * 
 * Module for permission checking and data access filtering
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PermissionService } from './permission.service';
import { PermissionAuditService } from './permission-audit.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ConfigModule, AuthModule, AuditModule],
  providers: [PermissionService, PermissionAuditService],
  exports: [PermissionService, PermissionAuditService],
})
export class PermissionModule {}

