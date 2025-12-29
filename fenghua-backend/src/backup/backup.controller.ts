/**
 * Backup Controller
 * 
 * Provides REST endpoints for backup operations
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupStatusService } from './backup-status.service';
import { AdminGuard } from '../users/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';
import { BackupStatusResponseDto, BackupHistoryQueryDto, BackupHistoryResponseDto, BackupMetadata } from './dto/backup-status.dto';

@Controller('backup')
@UseGuards(JwtAuthGuard, AdminGuard)
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly backupStatusService: BackupStatusService,
  ) {}

  /**
   * Get backup status
   */
  @Get('status')
  async getStatus(): Promise<BackupStatusResponseDto> {
    return this.backupStatusService.getBackupStatus();
  }

  /**
   * Get backup history
   */
  @Get('history')
  async getHistory(@Query(ValidationPipe) query: BackupHistoryQueryDto): Promise<BackupHistoryResponseDto> {
    return this.backupStatusService.getBackupHistory(query);
  }

  /**
   * Get backup details by ID
   */
  @Get(':id')
  async getDetails(@Param('id') id: string): Promise<BackupMetadata> {
    return this.backupStatusService.getBackupDetails(id);
  }

  /**
   * Trigger manual backup
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBackup(@Token() token: string): Promise<BackupMetadata> {
    return this.backupService.executeBackup(token);
  }
}

