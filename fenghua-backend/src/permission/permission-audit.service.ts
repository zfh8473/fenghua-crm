/**
 * Permission Audit Service
 * 
 * Shared service for logging permission violations across all services
 * Eliminates code duplication and ensures consistent audit logging
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class PermissionAuditService {
  private readonly logger = new Logger(PermissionAuditService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Log permission violation to audit service
   * 
   * Helper method to record permission violations without blocking the main request.
   * This method handles all error cases gracefully to ensure audit logging failures
   * do not affect the main request flow.
   * 
   * @param {string} token - JWT token to extract user information from
   * @param {string} resourceType - Type of resource being accessed (e.g., 'CUSTOMER', 'INTERACTION', 'PRODUCT_ASSOCIATION')
   * @param {string | null} resourceId - ID of the resource being accessed, or null if not available
   * @param {string} attemptedAction - Action being attempted (e.g., 'ACCESS', 'CREATE', 'UPDATE', 'DELETE')
   * @param {string | null} expectedType - Expected customer type based on user role (e.g., 'BUYER', 'SUPPLIER'), or null if no restriction
   * @param {string | null} actualType - Actual customer type of the resource, or null if not applicable
   * @returns {Promise<void>} Resolves when audit log is recorded (or silently fails if logging fails)
   * 
   * @example
   * ```typescript
   * // Log permission violation when frontend specialist tries to access supplier customer
   * await this.permissionAuditService.logPermissionViolation(
   *   token,
   *   'CUSTOMER',
   *   customerId,
   *   'ACCESS',
   *   'BUYER',
   *   'SUPPLIER',
   * );
   * ```
   * 
   * @throws {never} This method never throws - all errors are caught and logged
   */
  async logPermissionViolation(
    token: string,
    resourceType: string,
    resourceId: string | null,
    attemptedAction: string,
    expectedType: string | null,
    actualType: string | null,
  ): Promise<void> {
    try {
      // Extract user information from token
      let user;
      try {
        user = await this.authService.validateToken(token);
      } catch (tokenError) {
        // Token validation failure should not block audit logging attempt
        this.logger.warn('Failed to validate token for audit log', tokenError);
        return; // Don't throw, just log warning and return
      }

      if (!user || !user.id || !user.role) {
        this.logger.warn('Failed to extract user info from token for audit log');
        return; // Don't throw, just log warning
      }

      // Record permission violation
      await this.auditService.log({
        action: 'PERMISSION_VIOLATION',
        entityType: resourceType,
        entityId: resourceId || 'unknown',
        userId: user.id,
        operatorId: user.id,
        timestamp: new Date(),
        metadata: {
          userRole: user.role,
          attemptedAction,
          resourceType,
          expectedType: expectedType || null,
          actualType: actualType || null,
          result: 'DENIED',
        },
      });
    } catch (auditError) {
      // Audit logging failure should not affect the main request
      this.logger.warn('Failed to log permission violation', auditError);
    }
  }

  /**
   * Log permission verification result to audit service (optional, for debugging)
   * 
   * This method records both successful and failed permission verifications.
   * It is designed for debugging and security analysis purposes.
   * 
   * **Performance Considerations:**
   * - This method is called asynchronously and does not block the main request
   * - Should only be enabled when needed (via configuration)
   * - May generate large volumes of logs in high-traffic scenarios
   * 
   * @param {string} token - JWT token to extract user information from
   * @param {string} resourceType - Type of resource being accessed (e.g., 'CUSTOMER', 'INTERACTION', 'PRODUCT_ASSOCIATION')
   * @param {string | null} resourceId - ID of the resource being accessed, or null if not available
   * @param {string} verificationResult - Result of verification: 'GRANTED' or 'DENIED'
   * @param {string | null} expectedType - Expected customer type based on user role (e.g., 'BUYER', 'SUPPLIER'), or null if no restriction
   * @param {string | null} actualType - Actual customer type of the resource, or null if not applicable
   * @param {boolean} enabled - Whether permission verification logging is enabled (from configuration)
   * @returns {Promise<void>} Resolves when audit log is recorded (or silently fails if logging fails or disabled)
   * 
   * @example
   * ```typescript
   * // Log successful permission verification
   * await this.permissionAuditService.logPermissionVerification(
   *   token,
   *   'CUSTOMER',
   *   customerId,
   *   'GRANTED',
   *   'BUYER',
   *   'BUYER',
   *   true, // enabled
   * );
   * ```
   * 
   * @throws {never} This method never throws - all errors are caught and logged
   */
  async logPermissionVerification(
    token: string,
    resourceType: string,
    resourceId: string | null,
    verificationResult: 'GRANTED' | 'DENIED',
    expectedType: string | null,
    actualType: string | null,
    enabled: boolean,
  ): Promise<void> {
    // Early return if logging is disabled
    if (!enabled) {
      return;
    }

    // Execute asynchronously to avoid blocking the main request
    setImmediate(async () => {
      try {
        // Extract user information from token
        let user;
        try {
          user = await this.authService.validateToken(token);
        } catch (tokenError) {
          // Token validation failure should not block audit logging attempt
          this.logger.warn('Failed to validate token for permission verification audit log', tokenError);
          return; // Don't throw, just log warning and return
        }

        if (!user || !user.id || !user.role) {
          this.logger.warn('Failed to extract user info from token for permission verification audit log');
          return; // Don't throw, just log warning
        }

        // Record permission verification result
        await this.auditService.log({
          action: 'PERMISSION_VERIFICATION',
          entityType: resourceType,
          entityId: resourceId || 'unknown',
          userId: user.id,
          operatorId: user.id,
          timestamp: new Date(),
          metadata: {
            userRole: user.role,
            resourceType,
            expectedType: expectedType || null,
            actualType: actualType || null,
            result: verificationResult,
          },
        });
      } catch (auditError) {
        // Audit logging failure should not affect the main request
        this.logger.warn('Failed to log permission verification', auditError);
      }
    });
  }
}

