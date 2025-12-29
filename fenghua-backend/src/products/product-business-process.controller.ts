/**
 * Product Business Process Controller
 * 
 * REST API endpoints for product business process view
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
import { ProductBusinessProcessService } from './product-business-process.service';
import { ProductBusinessProcessQueryDto } from './dto/product-business-process.dto';
import { ProductBusinessProcessDto } from './dto/product-business-process.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductBusinessProcessController {
  private readonly logger = new Logger(ProductBusinessProcessController.name);

  constructor(
    private readonly service: ProductBusinessProcessService,
  ) {}

  @Get(':productId/business-process')
  async getProductBusinessProcess(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Token() token: string,
    @Query(ValidationPipe) query: ProductBusinessProcessQueryDto,
  ): Promise<ProductBusinessProcessDto> {
    try {
      return await this.service.getProductBusinessProcess(
        productId,
        query.customerId,
        token,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Failed to get product business process', error);
      throw new BadRequestException('获取产品业务流程失败');
    }
  }
}

