/**
 * Product Categories Controller
 * 
 * Provides REST endpoints for product category management
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
import { ProductCategoriesService } from './product-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto, CategoryWithStatsDto } from './dto/category-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';

@Controller('product-categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  /**
   * Create a new category
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createCategoryDto: CreateCategoryDto,
    @Req() req: any,
  ): Promise<CategoryResponseDto> {
    const userId = req.user?.id;
    return this.productCategoriesService.create(createCategoryDto, userId);
  }

  /**
   * Get all categories (with optional usage statistics)
   */
  @Get()
  async findAll(
    @Query('includeStats') includeStats?: boolean,
  ): Promise<CategoryResponseDto[] | CategoryWithStatsDto[]> {
    if (includeStats) {
      return this.productCategoriesService.findAllWithStats();
    }
    return this.productCategoriesService.findAll();
  }

  /**
   * Get one category by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto> {
    return this.productCategoriesService.findOne(id);
  }

  /**
   * Find category by HS code
   */
  @Get('by-hs-code/:hsCode')
  async findByHsCode(
    @Param('hsCode') hsCode: string,
  ): Promise<CategoryResponseDto | null> {
    return this.productCategoriesService.findByHsCode(hsCode);
  }

  /**
   * Update a category
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ): Promise<CategoryResponseDto> {
    const userId = req.user?.id;
    return this.productCategoriesService.update(id, updateCategoryDto, userId);
  }

  /**
   * Delete (soft delete) a category
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<void> {
    const userId = req.user?.id;
    return this.productCategoriesService.remove(id, userId);
  }

  /**
   * Get usage count for a category
   */
  @Get(':id/usage-count')
  async getUsageCount(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ count: number }> {
    const count = await this.productCategoriesService.getUsageCount(id);
    return { count };
  }
}

