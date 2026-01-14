/**
 * Key Rotation Scheduler
 * 
 * Scheduled task for automatic encryption key rotation
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { KeyRotationService } from './key-rotation.service';

@Injectable()
export class KeyRotationScheduler {
  private readonly logger = new Logger(KeyRotationScheduler.name);

  constructor(
    private readonly keyRotationService: KeyRotationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check and rotate encryption key if needed
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleKeyRotation(): Promise<void> {
    this.logger.log('Running scheduled key rotation check...');

    try {
      // Check if rotation is needed
      const shouldRotate = await this.keyRotationService.shouldRotateKey();

      if (!shouldRotate) {
        this.logger.debug('Key rotation not needed at this time');
        return;
      }

      // Perform rotation
      this.logger.log('Key rotation needed, starting rotation...');
      const result = await this.keyRotationService.rotateKey();

      this.logger.log(
        `Scheduled key rotation completed: new version ${result.newVersion}, old version ${result.oldVersion}`,
      );
    } catch (error) {
      this.logger.error(
        `Scheduled key rotation failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
      // Don't throw - allow scheduler to continue
    }
  }
}
