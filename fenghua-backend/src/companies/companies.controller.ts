/**
 * Companies Controller
 * 
 * Provides REST endpoints for company (customer) CRUD operations with role-based filtering
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Logger,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { Token } from '../common/decorators/token.decorator';
import { DataAccessAuditInterceptor } from '../audit/interceptors/data-access-audit.interceptor';

@Controller('customers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(DataAccessAuditInterceptor)
export class CompaniesController {
  // Note: This controller handles /customers routes
  // For backward compatibility, /companies/:id is handled by CompaniesCompatController
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Create a new customer
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createCustomerDto: CreateCustomerDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<CustomerResponseDto> {
    const userId = req.user?.id;
    return this.companiesService.create(createCustomerDto, token, userId);
  }

  /**
   * Get all customers with pagination and role-based filtering
   */
  @Get()
  async findAll(
    @Query(ValidationPipe) query: CustomerQueryDto,
    @Token() token: string,
  ): Promise<{ customers: CustomerResponseDto[]; total: number }> {
    try {
      this.logger.log(`[Controller] Received GET /customers request with query: ${JSON.stringify(query)}`);
      const result = await this.companiesService.findAll(query, token);
      this.logger.log(`[Controller] Returning ${result.customers.length} customers`);
      return result;
    } catch (error) {
      this.logger.error('[Controller] Error in findAll', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: query,
      });
      throw error;
    }
  }

  /**
   * Get one customer by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
  ): Promise<CustomerResponseDto> {
    return this.companiesService.findOne(id, token);
  }

  /**
   * Update a customer
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateCustomerDto: UpdateCustomerDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<CustomerResponseDto> {
    const userId = req.user?.id;
    return this.companiesService.update(id, updateCustomerDto, token, userId);
  }

  /**
   * Delete a customer
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<void> {
    const userId = req.user?.id;
    return this.companiesService.remove(id, token, userId);
  }
}

