/**
 * Customer Product Interaction History Controller
 * 
 * Provides REST endpoints for customer-product interaction history queries
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
import { CustomerProductInteractionHistoryService } from './customer-product-interaction-history.service';
import { CustomerProductInteractionQueryDto } from './dto/customer-product-interaction-history.dto';
import { CustomerProductInteractionDto } from './dto/customer-product-interaction-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerProductInteractionHistoryController {
  private readonly logger = new Logger(CustomerProductInteractionHistoryController.name);

  constructor(
    private readonly service: CustomerProductInteractionHistoryService,
  ) {}

  /**
   * Get customer product interactions with pagination and role-based filtering
   */
  @Get(':customerId/interactions')
  async getCustomerProductInteractions(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: CustomerProductInteractionQueryDto,
  ): Promise<{ interactions: CustomerProductInteractionDto[]; total: number }> {
    try {
      if (!query.productId) {
        throw new BadRequestException('productId 参数是必需的');
      }
      return await this.service.getCustomerProductInteractions(
        customerId,
        query.productId,
        token,
        query.page || 1,
        query.limit || 20,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to get customer product interactions', error);
      throw new BadRequestException('获取客户产品互动历史失败');
    }
  }
}

