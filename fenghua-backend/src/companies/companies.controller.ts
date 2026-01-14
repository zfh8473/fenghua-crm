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
import { DataModificationAuditInterceptor } from '../audit/interceptors/data-modification-audit.interceptor';
import { EncryptionInterceptor } from '../encryption/interceptors/encryption.interceptor';
import { DecryptionInterceptor } from '../encryption/interceptors/decryption.interceptor';

@Controller('customers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  EncryptionInterceptor,           // 写入时：先加密（POST/PUT/PATCH）
  DataModificationAuditInterceptor, // 写入时：记录修改（数据已加密）
  DecryptionInterceptor,            // 读取时：先解密（GET）
  DataAccessAuditInterceptor        // 读取时：记录访问（数据已解密）
)
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

