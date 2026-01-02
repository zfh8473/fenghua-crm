/**
 * Companies Compatibility Controller
 * 
 * Provides backward compatibility for /companies/:id route
 * Used by existing product pages (ProductBusinessProcessPage, ProductCustomerInteractionHistoryPage, etc.)
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { Token } from '../common/decorators/token.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesCompatController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Get one company by ID (backward compatibility route)
   * This route is used by existing product pages
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Token() token: string,
  ): Promise<CustomerResponseDto> {
    return this.companiesService.findOne(id, token);
  }
}

