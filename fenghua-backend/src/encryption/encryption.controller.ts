/**
 * Encryption Controller
 * 
 * Provides API endpoints for encryption key management
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';
import { KeyRotationService } from './key-rotation.service';
import { KeyManagementService } from './key-management.service';

/**
 * Extract IP address from request
 */
function getIpAddressFromRequest(request: Request): string | undefined {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ips.trim();
  }
  return request.ip || request.socket.remoteAddress;
}

/**
 * Extract user agent from request
 */
function getUserAgentFromRequest(request: Request): string | undefined {
  return request.headers['user-agent'];
}

@Controller('encryption')
@UseGuards(JwtAuthGuard, AdminGuard) // Only admins can manage encryption keys
export class EncryptionController {
  private readonly logger = new Logger(EncryptionController.name);

  constructor(
    private readonly keyRotationService: KeyRotationService,
    private readonly keyManagementService: KeyManagementService,
  ) {}

  /**
   * Manually trigger key rotation
   * POST /encryption/rotate-key
   */
  @Post('rotate-key')
  async rotateKey(@Req() request: Request): Promise<{
    success: boolean;
    newVersion: number;
    oldVersion: number | null;
    message: string;
  }> {
    try {
      // Extract user information from token (already validated by JwtAuthGuard)
      const user = (request as any).user;
      const userId = user?.id || 'system';
      const ipAddress = getIpAddressFromRequest(request);
      const userAgent = getUserAgentFromRequest(request);

      const result = await this.keyRotationService.rotateKey(userId, ipAddress, userAgent);

      return {
        success: true,
        newVersion: result.newVersion,
        oldVersion: result.oldVersion,
        message: `Key rotated successfully: new version ${result.newVersion}`,
      };
    } catch (error) {
      this.logger.error(`Manual key rotation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get encryption key status
   * GET /encryption/status
   */
  @Get('status')
  async getStatus(): Promise<{
    activeKeyVersion: number | null;
    totalKeys: number;
    storageMethod: string;
  }> {
    try {
      const activeKeyVersion = await this.keyManagementService.getActiveKeyVersion();
      const keys = await this.keyManagementService.listKeys();
      const storageMethod = process.env.ENCRYPTION_KEY_STORAGE_METHOD || 'database';

      return {
        activeKeyVersion,
        totalKeys: keys.length,
        storageMethod,
      };
    } catch (error) {
      this.logger.error(`Failed to get encryption status: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
