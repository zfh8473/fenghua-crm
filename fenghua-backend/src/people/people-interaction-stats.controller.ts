/**
 * People Interaction Stats Controller
 * 
 * Provides REST endpoints for person interaction statistics
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PeopleInteractionStatsService } from './people-interaction-stats.service';
import { Token } from '../common/decorators/token.decorator';
import {
  PersonInteractionStatsDto,
  BatchPersonInteractionStatsDto,
  BatchPersonInteractionStatsResponseDto,
} from './dto/person-interaction-stats.dto';

@Controller('people')
@UseGuards(JwtAuthGuard)
export class PeopleInteractionStatsController {
  private readonly logger = new Logger(PeopleInteractionStatsController.name);

  constructor(
    private readonly peopleInteractionStatsService: PeopleInteractionStatsService,
  ) {}

  /**
   * Get interaction statistics for a single person
   * 
   * 获取指定联系人的最后联系时间和本月联系次数
   */
  @Get(':personId/interaction-stats')
  @HttpCode(HttpStatus.OK)
  async getPersonInteractionStats(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Token() token: string,
  ): Promise<PersonInteractionStatsDto> {
    this.logger.log(`Getting interaction stats for person ${personId}`);
    return this.peopleInteractionStatsService.getPersonInteractionStats(personId, token);
  }

  /**
   * Get interaction statistics for multiple persons (batch query)
   * 
   * 批量获取多个联系人的最后联系时间和本月联系次数
   */
  @Post('interaction-stats/batch')
  @HttpCode(HttpStatus.OK)
  async getMultiplePersonInteractionStats(
    @Body(ValidationPipe) batchDto: BatchPersonInteractionStatsDto,
    @Token() token: string,
  ): Promise<BatchPersonInteractionStatsResponseDto> {
    // Early return for empty array
    if (batchDto.personIds.length === 0) {
      return { stats: {} };
    }

    this.logger.log(`Getting batch interaction stats for ${batchDto.personIds.length} persons`);
    const statsMap = await this.peopleInteractionStatsService.getMultiplePersonInteractionStats(
      batchDto.personIds,
      token,
    );

    // Convert Map to object
    const stats: { [personId: string]: PersonInteractionStatsDto } = {};
    statsMap.forEach((value, key) => {
      stats[key] = value;
    });

    return { stats };
  }
}
