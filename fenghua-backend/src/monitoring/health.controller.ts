/**
 * Health Controller
 * 
 * Provides health check endpoints
 * All custom code is proprietary and not open source.
 * 
 * NOTE: Health check endpoint is intentionally public (no authentication)
 * to allow monitoring systems and load balancers to check service health.
 * This is a standard practice for health check endpoints.
 */

import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthStatus } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Get system health status
   * 
   * Public endpoint for health checks (no authentication required)
   * Used by monitoring systems, load balancers, and orchestration tools
   */
  @Get()
  async getHealth(): Promise<HealthStatus> {
    return this.healthService.getHealthStatus();
  }
}

