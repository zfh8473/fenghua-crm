/**
 * Customer Product Association Management Controller
 * 
 * Provides REST endpoints for managing customer-product explicit associations
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
import { ProductCustomerAssociationManagementService } from '../products/product-customer-association-management.service';
import {
  CreateCustomerProductAssociationDto,
  CustomerProductAssociationResponseDto,
} from '../products/dto/product-customer-association-management.dto';
import { CustomerAssociationQueryDto } from '../products/dto/product-association-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerProductAssociationManagementController {
  private readonly logger = new Logger(CustomerProductAssociationManagementController.name);

  constructor(
    private readonly service: ProductCustomerAssociationManagementService,
  ) {}

  /**
   * Create a customer-product association
   * POST /api/customers/:id/associations
   */
  @Post(':id/associations')
  @HttpCode(HttpStatus.CREATED)
  async createAssociation(
    @Param('id', ParseUUIDPipe) customerId: string,
    @Body(ValidationPipe) createDto: CreateCustomerProductAssociationDto,
    @Token() token: string,
  ): Promise<{ id: string; productId: string; customerId: string; associationType: string }> {
    try {
      return await this.service.createCustomerProductAssociation(customerId, createDto, token);
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
   * Delete a customer-product association
   * DELETE /api/customers/:id/associations/:productId
   */
  @Delete(':id/associations/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAssociation(
    @Param('id', ParseUUIDPipe) customerId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Token() token: string,
  ): Promise<void> {
    try {
      await this.service.deleteCustomerProductAssociation(customerId, productId, token);
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
   * Get customer associations (merging explicit associations and interaction records)
   * GET /api/customers/:id/associations
   */
  @Get(':id/associations')
  async getCustomerAssociations(
    @Param('id', ParseUUIDPipe) customerId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: CustomerAssociationQueryDto,
  ): Promise<{ products: CustomerProductAssociationResponseDto[]; total: number }> {
    try {
      return await this.service.getCustomerAssociations(
        customerId,
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
      this.logger.error('Failed to get customer associations', error);
      throw new BadRequestException('获取客户关联产品失败');
    }
  }
}

