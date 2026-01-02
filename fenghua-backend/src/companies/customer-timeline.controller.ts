/**
 * Customer Timeline Controller
 * 
 * Controller for customer timeline endpoints
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CustomerTimelineService } from './customer-timeline.service';
import {
  CustomerTimelineQueryDto,
  CustomerTimelineInteractionDto,
} from './dto/customer-timeline.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerTimelineController {
  private readonly logger = new Logger(CustomerTimelineController.name);

  constructor(private readonly service: CustomerTimelineService) {}

  /**
   * GET /api/customers/:customerId/timeline
   * 
   * Get customer timeline (all interactions for a customer)
   * 
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 50, max: 100)
   * - sortOrder: Sort order 'asc' or 'desc' (default: 'desc')
   * - dateRange: Time range filter 'week' | 'month' | 'year' | 'all' (default: 'all')
   */
  @Get(':customerId/timeline')
  async getCustomerTimeline(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: CustomerTimelineQueryDto,
  ): Promise<{ interactions: CustomerTimelineInteractionDto[]; total: number }> {
    try {
      return await this.service.getCustomerTimeline(
        customerId,
        token,
        query.page || 1,
        query.limit || 50,
        query.sortOrder || 'desc',
        query.dateRange || 'all',
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        `Failed to get customer timeline for customer ${customerId}`,
        error,
      );
      throw new BadRequestException('获取客户时间线失败');
    }
  }
}

