/**
 * Data Retention Controller
 * 
 * Handles HTTP requests for data retention policy management
 * All custom code is proprietary and not open source.
 */

import { Controller, Get, UseGuards, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { DataRetentionService } from './data-retention.service';
import {
  DataRetentionPolicyDto,
  DataRetentionStatisticsDto,
  DataRetentionCleanupHistoryDto,
} from './dto/data-retention.dto';

@Controller('data-retention')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DataRetentionController {
  private readonly logger = new Logger(DataRetentionController.name);

  constructor(private readonly dataRetentionService: DataRetentionService) {}

  /**
   * Get current retention policy
   */
  @Get('policy')
  async getPolicy(): Promise<DataRetentionPolicyDto> {
    const policy = await this.dataRetentionService.getRetentionPolicy();
    return {
      customerDataRetentionDays: policy.customerDataRetentionDays,
      productDataRetentionDays: policy.productDataRetentionDays,
      interactionDataRetentionDays: policy.interactionDataRetentionDays,
      auditLogRetentionDays: policy.auditLogRetentionDays,
    };
  }

  /**
   * Get expiring data statistics
   */
  @Get('statistics')
  async getStatistics(): Promise<DataRetentionStatisticsDto> {
    return {
      customers: {
        expiringIn30Days: await this.dataRetentionService.getExpiringDataCount('customers', 30),
        expiringIn60Days: await this.dataRetentionService.getExpiringDataCount('customers', 60),
        expiringIn90Days: await this.dataRetentionService.getExpiringDataCount('customers', 90),
      },
      products: {
        expiringIn30Days: await this.dataRetentionService.getExpiringDataCount('products', 30),
        expiringIn60Days: await this.dataRetentionService.getExpiringDataCount('products', 60),
        expiringIn90Days: await this.dataRetentionService.getExpiringDataCount('products', 90),
      },
      interactions: {
        expiringIn30Days: await this.dataRetentionService.getExpiringDataCount('interactions', 30),
        expiringIn60Days: await this.dataRetentionService.getExpiringDataCount('interactions', 60),
        expiringIn90Days: await this.dataRetentionService.getExpiringDataCount('interactions', 90),
      },
      auditLogs: {
        expiringIn30Days: await this.dataRetentionService.getExpiringDataCount('auditLogs', 30),
        expiringIn60Days: await this.dataRetentionService.getExpiringDataCount('auditLogs', 60),
        expiringIn90Days: await this.dataRetentionService.getExpiringDataCount('auditLogs', 90),
      },
    };
  }

  /**
   * Get cleanup history from audit logs
   */
  @Get('cleanup-history')
  async getCleanupHistory(): Promise<DataRetentionCleanupHistoryDto[]> {
    try {
      return await this.dataRetentionService.getCleanupHistory();
    } catch (error) {
      this.logger.error('Failed to fetch cleanup history', error);
      throw new InternalServerErrorException('Failed to fetch cleanup history');
    }
  }
}
