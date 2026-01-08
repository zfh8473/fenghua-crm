/**
 * Customer Product Association Controller
 * 
 * Provides REST endpoints for customer-product association queries
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
import { CustomerProductAssociationService } from './customer-product-association.service';
import { CustomerProductQueryDto } from './dto/customer-product-association.dto';
import { CustomerProductAssociationDto } from './dto/customer-product-association.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerProductAssociationController {
  private readonly logger = new Logger(CustomerProductAssociationController.name);

  constructor(
    private readonly service: CustomerProductAssociationService,
  ) {}

  /**
   * Get customer products with pagination and role-based filtering
   */
  @Get(':id/products')
  async getCustomerProducts(
    @Param('id', ParseUUIDPipe) customerId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: CustomerProductQueryDto,
  ): Promise<{ products: CustomerProductAssociationDto[]; total: number }> {
    try {
      return await this.service.getCustomerProducts(
        customerId,
        token,
        query.page || 1,
        query.limit || 10,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to get customer products', error);
      throw new BadRequestException('获取客户关联产品失败');
    }
  }
}



