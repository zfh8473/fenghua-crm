/**
 * Products Controller
 * 
 * Provides REST endpoints for product management
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { Token } from '../common/decorators/token.decorator';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

@Controller('products')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a new product
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ProductResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID无效');
    }
    return this.productsService.create(createProductDto, userId);
  }

  /**
   * Get all products with pagination and filters
   */
  @Get()
  async findAll(
    @Query(ValidationPipe) query: ProductQueryDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ products: ProductResponseDto[]; total: number }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID无效');
    }
    return this.productsService.findAll(query, userId, token);
  }

  /**
   * Get one product by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ProductResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID无效');
    }
    return this.productsService.findOne(id, userId, token);
  }

  /**
   * Update a product
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<ProductResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID无效');
    }
    return this.productsService.update(id, updateProductDto, userId, token);
  }

  /**
   * Delete a product
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户ID无效');
    }
    return this.productsService.remove(id, userId, token);
  }
}

