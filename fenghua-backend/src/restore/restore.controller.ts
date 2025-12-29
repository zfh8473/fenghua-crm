/**
 * Restore Controller
 * 
 * Provides REST endpoints for restore operations
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { RestoreService } from './restore.service';
import { AdminGuard } from '../users/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';
import { RestoreRequestDto, RestoreStatusResponseDto } from './dto/restore-request.dto';

@Controller('restore')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RestoreController {
  constructor(private readonly restoreService: RestoreService) {}

  /**
   * Execute database restore
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async restore(
    @Body(ValidationPipe) restoreRequest: RestoreRequestDto,
    @Token() token: string,
    @Request() req,
  ): Promise<{ restoreId: string }> {
    const operatorId = req.user.id;
    const restoreId = await this.restoreService.executeRestore(
      restoreRequest.backupId,
      token,
      operatorId,
    );
    return { restoreId };
  }

  /**
   * Get restore status
   */
  @Get(':restoreId/status')
  async getStatus(@Param('restoreId') restoreId: string): Promise<RestoreStatusResponseDto> {
    const status = this.restoreService.getRestoreStatus(restoreId);
    
    if (!status) {
      return {
        restoreId,
        status: 'failed',
        progress: 0,
        message: 'Restore status not found',
        startedAt: new Date(),
        errorMessage: 'Restore ID not found or expired',
      };
    }

    return {
      restoreId: status.restoreId,
      status: status.status,
      progress: status.progress,
      message: status.message,
      startedAt: status.startedAt,
      completedAt: status.completedAt,
      errorMessage: status.errorMessage,
    };
  }
}

