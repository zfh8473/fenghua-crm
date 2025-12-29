/**
 * Monitoring Module
 * 
 * Provides system health monitoring functionality
 * All custom code is proprietary and not open source.
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class MonitoringModule {}

