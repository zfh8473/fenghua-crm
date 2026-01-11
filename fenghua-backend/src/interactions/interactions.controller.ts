/**
 * Interactions Controller
 * 
 * Provides REST endpoints for interaction record management
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
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
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { InteractionResponseDto } from './dto/interaction-response.dto';
import { InteractionSearchQueryDto } from './dto/interaction-search-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  private readonly logger = new Logger(InteractionsController.name);

  constructor(private readonly interactionsService: InteractionsService) {}

  /**
   * Search interaction records with advanced filtering
   * 
   * IMPORTANT: This route MUST be defined before @Get(':id') to ensure proper route matching.
   * NestJS matches routes in the order they are defined, so specific routes must come before parameterized routes.
   * 
   * Supports filtering by:
   * - interactionTypes: Array of interaction types (multi-select)
   * - statuses: Array of interaction statuses (multi-select)
   * - categories: Array of product categories (multi-select)
   * - createdBy: Creator user ID
   * - customerId: Specific customer
   * - productId: Specific product
   * - startDate/endDate: Date range
   * 
   * Also supports sorting and pagination.
   */
  @Get('search')
  async search(
    @Request() req,
    @Token() token: string,
  ): Promise<{ interactions: InteractionResponseDto[]; total: number }> {
    // Log that we've reached this method
    this.logger.log('=== Search method called ===', {
      url: req.url,
      query: req.query,
      method: req.method,
    });
    
    try {
      // Pre-process query parameters: remove empty strings and undefined values
      const cleanedQuery: any = {};
      
      // Helper to check if value is meaningful
      const hasValue = (val: any): boolean => {
        if (val === undefined || val === null) return false;
        if (typeof val === 'string' && val.trim() === '') return false;
        return true;
      };

      // Process each query parameter
      Object.keys(req.query).forEach((key) => {
        const value = req.query[key];
        
        // Skip empty strings and undefined
        if (!hasValue(value)) return;
        
        // Handle array-like parameters (comma-separated strings)
        if (['interactionTypes', 'statuses', 'categories'].includes(key)) {
          if (Array.isArray(value)) {
            const filtered = value.filter(v => hasValue(v));
            if (filtered.length > 0) {
              cleanedQuery[key] = filtered;
            }
          } else if (typeof value === 'string') {
            const arr = value.split(',').map(v => v.trim()).filter(v => hasValue(v));
            if (arr.length > 0) {
              cleanedQuery[key] = arr;
            }
          }
        } else {
          // Handle single values
          if (typeof value === 'string') {
            cleanedQuery[key] = value.trim();
          } else {
            cleanedQuery[key] = value;
          }
        }
      });

      // Transform sortBy from snake_case to camelCase
      if (cleanedQuery.sortBy) {
        const sortByMap: Record<string, string> = {
          'interaction_date': 'interactionDate',
          'customer_name': 'customerName',
          'product_name': 'productName',
          'product_hs_code': 'productHsCode',
          'interaction_type': 'interactionType',
        };
        if (sortByMap[cleanedQuery.sortBy]) {
          cleanedQuery.sortBy = sortByMap[cleanedQuery.sortBy];
        }
      }

      // Log cleaned query for debugging
      this.logger.log('Cleaned query parameters', cleanedQuery);

      // Transform to DTO instance using class-transformer
      const searchDto = plainToInstance(InteractionSearchQueryDto, cleanedQuery, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      });
      
      // Validate the DTO
      const errors = await validate(searchDto, {
        skipMissingProperties: true,
        skipNullProperties: true,
        skipUndefinedProperties: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      });
      
      if (errors.length > 0) {
        const messages = errors.map((error) => {
          if (error.constraints) {
            return Object.values(error.constraints).join(', ');
          }
          return `${error.property} 验证失败`;
        });
        this.logger.error('Validation errors', {
          errors: messages,
          cleanedQuery,
          searchDto: JSON.stringify(searchDto),
        });
        throw new BadRequestException({
          message: messages.length > 0 ? messages.join('; ') : '请求数据验证失败',
          errors: errors,
        });
      }
      
      // Log transformed DTO
      this.logger.log('Transformed search DTO', {
        sortBy: searchDto.sortBy,
        sortOrder: searchDto.sortOrder,
        limit: searchDto.limit,
        offset: searchDto.offset,
        customerId: searchDto.customerId,
        productId: searchDto.productId,
        createdBy: searchDto.createdBy,
        interactionTypes: searchDto.interactionTypes,
        statuses: searchDto.statuses,
        categories: searchDto.categories,
      });
      
      return await this.interactionsService.search(searchDto, token);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        this.logger.error('[InteractionsController] Validation or auth error in search', {
          error: error.message,
          response: error.getResponse(),
          query: req.query,
        });
        throw error;
      }
      this.logger.error('[InteractionsController] Failed to search interactions', {
        error: error.message,
        stack: error.stack,
        query: req.query,
      });
      throw new BadRequestException('搜索互动记录失败');
    }
  }

  /**
   * Create a new interaction record
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createInteractionDto: CreateInteractionDto,
    @Token() token: string,
  ): Promise<InteractionResponseDto> {
    return this.interactionsService.create(createInteractionDto, token);
  }

  /**
   * Get a single interaction record by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
  ): Promise<InteractionResponseDto> {
    try {
      return await this.interactionsService.findOne(id, token);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to get interaction', error);
      throw new BadRequestException('获取互动记录失败');
    }
  }

  /**
   * Update an interaction record
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateInteractionDto: UpdateInteractionDto,
    @Token() token: string,
  ): Promise<InteractionResponseDto> {
    try {
      return await this.interactionsService.update(id, updateInteractionDto, token);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Failed to update interaction', error);
      throw new BadRequestException('更新互动记录失败');
    }
  }

  /**
   * Delete an interaction record (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
  ): Promise<void> {
    try {
      await this.interactionsService.delete(id, token);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to delete interaction', error);
      throw new BadRequestException('删除互动记录失败');
    }
  }
}

