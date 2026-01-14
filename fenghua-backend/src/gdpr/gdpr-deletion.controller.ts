/**
 * GDPR Deletion Controller
 * 
 * Handles HTTP requests for GDPR data deletion
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { GdprDeletionService } from './gdpr-deletion.service';
import { 
  CreateGdprDeletionRequestDto, 
  GdprDeletionRequestResponseDto, 
  GdprDeletionRequestListResponseDto,
  GdprDeletionRequestIdDto,
  GdprDeletionRequestListQueryDto,
} from './dto/gdpr-deletion-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('gdpr')
@UseGuards(JwtAuthGuard) // Note: NOT using AdminGuard - all authenticated users can request GDPR deletion
export class GdprDeletionController {
  private readonly logger = new Logger(GdprDeletionController.name);

  constructor(
    private readonly gdprDeletionService: GdprDeletionService,
  ) {}

  /**
   * Create GDPR deletion request
   */
  @Post('deletion-request')
  @HttpCode(HttpStatus.ACCEPTED)
  async createDeletionRequest(
    @Body() body: CreateGdprDeletionRequestDto,
    @Token() token: string,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<GdprDeletionRequestResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    return this.gdprDeletionService.createDeletionRequest(body, userId, token);
  }

  /**
   * Get user's deletion request list
   */
  @Get('deletion-requests')
  async getDeletionRequests(
    @Req() req: Request & { user?: { id: string } },
    @Query() query: GdprDeletionRequestListQueryDto,
  ): Promise<GdprDeletionRequestListResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    // Handle default values for limit and offset
    const limit = query.limit !== undefined ? query.limit : 50;
    const offset = query.offset !== undefined ? query.offset : 0;

    return this.gdprDeletionService.getDeletionRequestList(userId, limit, offset);
  }

  /**
   * Get deletion request by ID
   */
  @Get('deletion-requests/:id')
  async getDeletionRequest(
    @Param() params: GdprDeletionRequestIdDto,
    @Req() req: Request & { user?: { id: string } },
  ): Promise<GdprDeletionRequestResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('用户未登录');
    }

    return this.gdprDeletionService.getDeletionRequest(params.id, userId);
  }
}
