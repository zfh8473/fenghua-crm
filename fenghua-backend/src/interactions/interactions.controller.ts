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
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { InteractionResponseDto } from './dto/interaction-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';

@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  private readonly logger = new Logger(InteractionsController.name);

  constructor(private readonly interactionsService: InteractionsService) {}

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

