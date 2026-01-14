/**
 * Key Rotation Service
 * 
 * Handles encryption key rotation operations
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { KeyManagementService } from './key-management.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);

  constructor(
    private readonly keyManagementService: KeyManagementService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Rotate encryption key
   * 
   * @param userId - User ID performing the rotation (for audit logging)
   * @param ipAddress - IP address (for audit logging)
   * @param userAgent - User agent (for audit logging)
   * @returns Rotation result with new and old version numbers
   */
  async rotateKey(
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ newVersion: number; oldVersion: number | null }> {
    try {
      this.logger.log('Starting encryption key rotation...');

      // Rotate the key
      const result = await this.keyManagementService.rotateKey();

      // Log rotation to audit log
      if (userId) {
        try {
          await this.auditService.log({
            action: 'KEY_ROTATION',
            entityType: 'ENCRYPTION_KEY',
            entityId: `version-${result.newVersion}`,
            userId,
            operatorId: userId,
            timestamp: new Date(),
            reason: `Key rotated: old version ${result.oldVersion}, new version ${result.newVersion}`,
            ipAddress,
            userAgent,
            metadata: {
              oldVersion: result.oldVersion,
              newVersion: result.newVersion,
            },
          });
        } catch (error) {
          this.logger.warn(`Failed to log key rotation to audit: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      this.logger.log(`Encryption key rotation completed: new version ${result.newVersion}, old version ${result.oldVersion}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to rotate encryption key: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }

  /**
   * Check if key rotation is needed based on rotation period
   * 
   * @returns true if rotation is needed, false otherwise
   */
  async shouldRotateKey(): Promise<boolean> {
    try {
      const rotationDays = parseInt(
        process.env.ENCRYPTION_KEY_ROTATION_DAYS || '90',
        10,
      );

      // Get the most recent active key
      const keys = await this.keyManagementService.listKeys();
      const activeKeys = keys.filter(k => k.isActive);

      if (activeKeys.length === 0) {
        // No active key, rotation needed
        return true;
      }

      // Get the most recent active key
      const mostRecentKey = activeKeys.sort((a, b) => b.version - a.version)[0];
      const keyAge = Date.now() - mostRecentKey.createdAt.getTime();
      const rotationPeriod = rotationDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      return keyAge >= rotationPeriod;
    } catch (error) {
      this.logger.error(`Failed to check if key rotation is needed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
