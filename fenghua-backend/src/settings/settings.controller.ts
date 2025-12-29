/**
 * Settings Controller
 * 
 * Handles HTTP requests for system settings management
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, SettingsResponseDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { Token } from '../common/decorators/token.decorator';
import { AuthService } from '../auth/auth.service';

/**
 * Settings Controller
 * Only administrators can access system settings
 */
@Controller('settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get all system settings
   * Note: Token is validated by JwtAuthGuard, no need to use it here
   */
  @Get()
  async getSettings(): Promise<SettingsResponseDto> {
    return this.settingsService.getAllSettings();
  }

  /**
   * Update system settings
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @Body() updateDto: UpdateSettingsDto,
    @Token() token: string,
  ): Promise<SettingsResponseDto> {
    // Get operator ID from token
    const user = await this.authService.validateToken(token);
    const operatorId = user.id;

    return this.settingsService.updateSettings(updateDto, operatorId);
  }
}

