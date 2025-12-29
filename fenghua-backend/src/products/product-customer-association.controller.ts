/**
 * Product Customer Association Controller
 * 
 * Provides REST endpoints for product-customer association queries
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ProductCustomerAssociationService } from './product-customer-association.service';
import { ProductCustomerQueryDto } from './dto/product-customer-association.dto';
import { ProductCustomerAssociationDto } from './dto/product-customer-association.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductCustomerAssociationController {
  private readonly logger = new Logger(ProductCustomerAssociationController.name);

  constructor(
    private readonly service: ProductCustomerAssociationService,
  ) {}

  /**
   * Get product customers with pagination and role-based filtering
   */
  @Get(':id/customers')
  async getProductCustomers(
    @Param('id', ParseUUIDPipe) productId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: ProductCustomerQueryDto,
  ): Promise<{ customers: ProductCustomerAssociationDto[]; total: number }> {
    try {
      return await this.service.getProductCustomers(
        productId,
        token,
        query.page || 1,
        query.limit || 10,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to get product customers', error);
      throw new BadRequestException('获取产品关联客户失败');
    }
  }
}

