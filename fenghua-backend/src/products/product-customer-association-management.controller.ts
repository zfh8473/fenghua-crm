/**
 * Product Customer Association Management Controller
 * 
 * Provides REST endpoints for managing product-customer explicit associations
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ProductCustomerAssociationManagementService } from './product-customer-association-management.service';
import {
  CreateProductCustomerAssociationDto,
  CreateCustomerProductAssociationDto,
  ProductCustomerAssociationResponseDto,
  CustomerProductAssociationResponseDto,
} from './dto/product-customer-association-management.dto';
import { ProductAssociationQueryDto } from './dto/product-association-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductCustomerAssociationManagementController {
  private readonly logger = new Logger(ProductCustomerAssociationManagementController.name);

  constructor(
    private readonly service: ProductCustomerAssociationManagementService,
  ) {}

  /**
   * Create a product-customer association
   * POST /api/products/:id/associations
   */
  @Post(':id/associations')
  @HttpCode(HttpStatus.CREATED)
  async createAssociation(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body(ValidationPipe) createDto: CreateProductCustomerAssociationDto,
    @Token() token: string,
  ): Promise<{ id: string; productId: string; customerId: string; associationType: string }> {
    try {
      return await this.service.createAssociation(productId, createDto, token);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Failed to create association', error);
      throw new BadRequestException('创建关联关系失败');
    }
  }

  /**
   * Delete a product-customer association
   * DELETE /api/products/:id/associations/:customerId
   */
  @Delete(':id/associations/:customerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAssociation(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Token() token: string,
  ): Promise<void> {
    try {
      await this.service.deleteAssociation(productId, customerId, token);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Failed to delete association', error);
      throw new BadRequestException('删除关联关系失败');
    }
  }

  /**
   * Get product associations (merging explicit associations and interaction records)
   * GET /api/products/:id/associations
   */
  @Get(':id/associations')
  async getProductAssociations(
    @Param('id', ParseUUIDPipe) productId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: ProductAssociationQueryDto,
  ): Promise<{ customers: ProductCustomerAssociationResponseDto[]; total: number }> {
    try {
      return await this.service.getProductAssociations(
        productId,
        token,
        query.page || 1,
        query.limit || 10,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Failed to get product associations', error);
      throw new BadRequestException('获取产品关联客户失败');
    }
  }
}

