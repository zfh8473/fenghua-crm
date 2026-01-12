/**
 * Dashboard Controller
 * 
 * Provides REST endpoints for dashboard data
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorOrAdminGuard } from '../users/guards/director-or-admin.guard';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, DirectorOrAdminGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard overview
   * Returns key business metrics for directors and administrators
   */
  @Get('overview')
  async getOverview(@Request() req): Promise<DashboardOverviewDto> {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    return this.dashboardService.getOverview(token);
  }
}

