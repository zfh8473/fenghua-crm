/**
 * Permission Module
 * 
 * Module for permission checking and data access filtering
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}

