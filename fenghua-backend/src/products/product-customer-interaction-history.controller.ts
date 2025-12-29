/**
 * Product Customer Interaction History Controller
 * 
 * Provides REST endpoints for product-customer interaction history queries
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
import { ProductCustomerInteractionHistoryService } from './product-customer-interaction-history.service';
import { ProductCustomerInteractionQueryDto } from './dto/product-customer-interaction-history.dto';
import { ProductCustomerInteractionDto } from './dto/product-customer-interaction-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductCustomerInteractionHistoryController {
  private readonly logger = new Logger(ProductCustomerInteractionHistoryController.name);

  constructor(
    private readonly service: ProductCustomerInteractionHistoryService,
  ) {}

  /**
   * Get product customer interactions with pagination and role-based filtering
   */
  @Get(':productId/interactions')
  async getProductCustomerInteractions(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('customerId', ParseUUIDPipe) customerId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: ProductCustomerInteractionQueryDto,
  ): Promise<{ interactions: ProductCustomerInteractionDto[]; total: number }> {
    try {
      return await this.service.getProductCustomerInteractions(
        productId,
        customerId,
        token,
        query.page || 1,
        query.limit || 20,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to get product customer interactions', error);
      throw new BadRequestException('获取产品客户互动历史失败');
    }
  }
}

