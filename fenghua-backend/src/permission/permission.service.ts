/**
 * Permission Service
 * 
 * Handles role-based permission checking and data access filtering
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../users/dto/create-user.dto';
import { PermissionAuditService } from './permission-audit.service';

/**
 * Permission types
 */
export enum Permission {
  // User management
  MANAGE_USERS = 'MANAGE_USERS',
  // System configuration
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  // Data export
  EXPORT_DATA = 'EXPORT_DATA',
  // Customer access
  ACCESS_BUYERS = 'ACCESS_BUYERS',
  ACCESS_SUPPLIERS = 'ACCESS_SUPPLIERS',
  ACCESS_ALL_CUSTOMERS = 'ACCESS_ALL_CUSTOMERS',
}

/**
 * Role to permissions mapping based on PRD RBAC matrix
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_SYSTEM,
    Permission.EXPORT_DATA,
    Permission.ACCESS_ALL_CUSTOMERS,
    Permission.ACCESS_BUYERS,
    Permission.ACCESS_SUPPLIERS,
  ],
  [UserRole.DIRECTOR]: [
    Permission.EXPORT_DATA,
    Permission.ACCESS_ALL_CUSTOMERS,
    Permission.ACCESS_BUYERS,
    Permission.ACCESS_SUPPLIERS,
  ],
  [UserRole.FRONTEND_SPECIALIST]: [Permission.ACCESS_BUYERS],
  [UserRole.BACKEND_SPECIALIST]: [Permission.ACCESS_SUPPLIERS],
};

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private permissionCache: Map<string, { permissions: Permission[]; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly permissionAuditService: PermissionAuditService,
  ) {}

  /**
   * Get user permissions from token
   * Integrates with AuthService to avoid duplicate token validation
   */
  async getUserPermissions(token: string): Promise<Permission[]> {
    try {
      // Validate token and get user info (including role) from AuthService
      const user = await this.authService.validateToken(token);

      if (!user || !user.role) {
        this.logger.warn('User or role not found in token validation result');
        return [];
      }

      // Map role string to UserRole enum
      const userRole = this.mapStringToUserRole(user.role);

      if (!userRole) {
        this.logger.warn(`Unknown role: ${user.role}`);
        return [];
      }

      // Check cache first
      const cacheKey = `${user.id}:${userRole}`;
      const cached = this.permissionCache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        return cached.permissions;
      }

      // Get permissions from role mapping
      const permissions = ROLE_PERMISSIONS[userRole] || [];

      // Cache permissions
      this.permissionCache.set(cacheKey, {
        permissions,
        expiresAt: Date.now() + this.CACHE_TTL,
      });

      return permissions;
    } catch (error) {
      this.logger.error('Error getting user permissions', error);
      return [];
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(token: string, permission: Permission): Promise<boolean> {
    const permissions = await this.getUserPermissions(token);
    return permissions.includes(permission);
  }

  /**
   * Check if user can access a specific resource type
   */
  async canAccess(token: string, resourceType: 'buyer' | 'supplier' | 'all'): Promise<boolean> {
    const permissions = await this.getUserPermissions(token);

    switch (resourceType) {
      case 'buyer':
        return (
          permissions.includes(Permission.ACCESS_BUYERS) ||
          permissions.includes(Permission.ACCESS_ALL_CUSTOMERS)
        );
      case 'supplier':
        return (
          permissions.includes(Permission.ACCESS_SUPPLIERS) ||
          permissions.includes(Permission.ACCESS_ALL_CUSTOMERS)
        );
      case 'all':
        return permissions.includes(Permission.ACCESS_ALL_CUSTOMERS);
      default:
        return false;
    }
  }

  /**
   * Get data access filter based on user role
   * Returns filter criteria for database queries
   * 
   * Optionally logs permission verification results for debugging (if enabled via configuration)
   */
  async getDataAccessFilter(token: string): Promise<{ customerType?: string } | null> {
    const permissions = await this.getUserPermissions(token);
    let filter: { customerType?: string } | null = null;
    let expectedType: string | null = null;
    let verificationResult: 'GRANTED' | 'DENIED' = 'GRANTED';

    // If user has access to all customers, no filter needed
    if (permissions.includes(Permission.ACCESS_ALL_CUSTOMERS)) {
      filter = null; // No filter - can access all
      expectedType = null; // No restriction
      verificationResult = 'GRANTED';
    }
    // If user can only access buyers
    else if (permissions.includes(Permission.ACCESS_BUYERS) && !permissions.includes(Permission.ACCESS_SUPPLIERS)) {
      filter = { customerType: 'buyer' };
      expectedType = 'BUYER';
      verificationResult = 'GRANTED';
    }
    // If user can only access suppliers
    else if (permissions.includes(Permission.ACCESS_SUPPLIERS) && !permissions.includes(Permission.ACCESS_BUYERS)) {
      filter = { customerType: 'supplier' };
      expectedType = 'SUPPLIER';
      verificationResult = 'GRANTED';
    }
    // Default: no access
    else {
      filter = { customerType: 'NONE' };
      expectedType = null;
      verificationResult = 'DENIED';
    }

    // Optionally log permission verification result (if enabled)
    // This is done asynchronously and does not block the main request
    const verificationLoggingEnabled = this.configService.get<boolean>(
      'AUDIT_LOG_PERMISSION_VERIFICATION_ENABLED',
      false,
    ) || this.configService.get<boolean>('auditLogPermissionVerificationEnabled', false);

    if (verificationLoggingEnabled) {
      // Log asynchronously - don't await to avoid blocking
      // The logPermissionVerification method handles token validation internally
      setImmediate(() => {
        this.permissionAuditService.logPermissionVerification(
          token,
          'CUSTOMER',
          null, // Resource ID not available at filter level
          verificationResult,
          expectedType,
          null, // Actual type not available at filter level
          true, // enabled
        ).catch((error) => {
          // Silently handle errors - logging should not affect main request
          this.logger.debug('Failed to log permission verification (non-blocking)', error);
        });
      });
    }

    return filter;
  }

  /**
   * Invalidate permission cache for a user
   * Called when user role changes
   */
  invalidateUserCache(userId: string): void {
    // Remove all cache entries for this user
    const keysToDelete: string[] = [];
    for (const [key, value] of this.permissionCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.permissionCache.delete(key));
    this.logger.log(`Permission cache invalidated for user ${userId}`);
  }

  /**
   * Map role string to UserRole enum
   */
  private mapStringToUserRole(role: string): UserRole | null {
    const upperRole = role.toUpperCase();
    if (upperRole === 'ADMIN' || upperRole === 'ADMINISTRATOR') {
      return UserRole.ADMIN;
    }
    if (upperRole === 'DIRECTOR') {
      return UserRole.DIRECTOR;
    }
    if (upperRole === 'FRONTEND_SPECIALIST' || upperRole === 'FRONTEND') {
      return UserRole.FRONTEND_SPECIALIST;
    }
    if (upperRole === 'BACKEND_SPECIALIST' || upperRole === 'BACKEND') {
      return UserRole.BACKEND_SPECIALIST;
    }
    return null;
  }
}

