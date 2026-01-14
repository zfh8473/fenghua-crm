/**
 * Data Modification Audit Interceptor
 * 
 * Automatically logs data modification operations to audit log
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from '../audit.service';
import { AuthService } from '../../auth/auth.service';
import { identifyChangedFields } from '../utils/value-comparison';
import { CompaniesService } from '../../companies/companies.service';
import { ProductsService } from '../../products/products.service';
import { InteractionsService } from '../../interactions/interactions.service';

/**
 * Resource type mapping from route paths
 */
const RESOURCE_TYPE_MAP: Record<string, string> = {
  '/api/companies': 'CUSTOMER',
  '/api/customers': 'CUSTOMER',
  '/api/products': 'PRODUCT',
  '/api/interactions': 'INTERACTION',
};

/**
 * Extract resource type from request path
 */
function getResourceTypeFromPath(path: string): string | null {
  for (const [route, resourceType] of Object.entries(RESOURCE_TYPE_MAP)) {
    if (path.startsWith(route)) {
      return resourceType;
    }
  }
  return null;
}

/**
 * Extract resource ID from request path
 * Supports patterns like /api/companies/:id, /api/products/:id, etc.
 */
function getResourceIdFromPath(path: string): string | null {
  // Match UUID pattern in path
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = path.match(uuidPattern);
  return match ? match[0] : null;
}

/**
 * Extract IP address from request
 */
function getIpAddress(request: Request): string | undefined {
  // Check for forwarded IP (when behind proxy)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ips.trim();
  }
  // Fallback to direct connection IP
  return request.ip || request.socket.remoteAddress;
}

/**
 * Extract user agent from request
 */
function getUserAgent(request: Request): string | undefined {
  return request.headers['user-agent'];
}

@Injectable()
export class DataModificationAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataModificationAuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Get the appropriate service based on resource type
   */
  private async getResourceService(resourceType: string): Promise<CompaniesService | ProductsService | InteractionsService | null> {
    try {
      switch (resourceType) {
        case 'CUSTOMER':
          return this.moduleRef.get(CompaniesService, { strict: false });
        case 'PRODUCT':
          return this.moduleRef.get(ProductsService, { strict: false });
        case 'INTERACTION':
          return this.moduleRef.get(InteractionsService, { strict: false });
        default:
          return null;
      }
    } catch (error) {
      this.logger.warn(`Failed to get resource service for ${resourceType}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get old value from database before modification
   */
  private async getOldValue(
    resourceType: string,
    resourceId: string,
    token: string,
  ): Promise<any> {
    try {
      const service = await this.getResourceService(resourceType);
      if (!service) {
        return null;
      }

      // Call findOne method based on service type
      if (resourceType === 'CUSTOMER') {
        return await (service as CompaniesService).findOne(resourceId, token);
      } else if (resourceType === 'PRODUCT') {
        // ProductsService.findOne requires userId, but we can get it from token
        const user = await this.authService.validateToken(token);
        if (!user || !user.id) {
          return null;
        }
        return await (service as ProductsService).findOne(resourceId, user.id, token);
      } else if (resourceType === 'INTERACTION') {
        // InteractionsService.findOne requires token
        return await (service as InteractionsService).findOne(resourceId, token);
      }

      return null;
    } catch (error) {
      this.logger.debug(`Failed to get old value for ${resourceType} ${resourceId}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, path, body } = request;

    // Only intercept PUT, PATCH, and DELETE requests
    if (!['PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Check if this is a detail page request (contains UUID)
    const resourceId = getResourceIdFromPath(path);
    if (!resourceId) {
      return next.handle();
    }

    // Get resource type from path
    const resourceType = getResourceTypeFromPath(path);
    if (!resourceType) {
      return next.handle();
    }

    // Extract user information from token
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return next.handle();
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return next.handle();
    }

    // Extract IP and user agent
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    // Determine if this is a delete operation
    const isDeleteOperation = method === 'DELETE' || body?.deletedAt !== undefined;

    // Get old value before the request is processed
    let oldValue: any = null;
    const getOldValuePromise = this.getOldValue(resourceType, resourceId, token)
      .then((value) => {
        oldValue = value;
      })
      .catch((error) => {
        this.logger.debug(`Failed to get old value: ${error instanceof Error ? error.message : String(error)}`);
      });

    // Intercept the response to log modification
    return next.handle().pipe(
      tap({
        next: async (response) => {
          // Wait for old value to be retrieved
          await getOldValuePromise;

          try {
            const user = await this.authService.validateToken(token);
            if (!user || !user.id) {
              return;
            }

            // Get new value from response or reconstruct it
            let newValue: any = null;

            if (isDeleteOperation) {
              // For delete operations, newValue should include deleted_at
              newValue = oldValue ? { ...oldValue, deletedAt: new Date() } : { deletedAt: new Date() };
            } else if (method === 'PUT') {
              // PUT request: newValue is the complete object from response
              newValue = response?.data || response || null;
              // If not in response, use oldValue as fallback (avoiding duplicate query)
              // Note: In PUT requests, if response doesn't contain data, we should still have it from the update operation
              // For now, we'll use oldValue as a fallback, but ideally the controller should return the updated entity
              if (!newValue && oldValue) {
                // Use oldValue merged with body as fallback (better than re-querying)
                newValue = oldValue && body && typeof body === 'object' ? { ...oldValue, ...body } : oldValue;
              }
            } else if (method === 'PATCH') {
              // PATCH request: merge oldValue with request body
              if (oldValue && typeof oldValue === 'object' && body && typeof body === 'object') {
                newValue = { ...oldValue, ...body };
              } else {
                // Fallback: try to get from response, or use oldValue if available
                newValue = response?.data || response || (oldValue ? { ...oldValue, ...(body || {}) } : null);
              }
            }

            // Skip audit log if oldValue is null and it's not a delete operation
            // (for delete operations, we still want to log even if oldValue is null)
            if (oldValue === null && !isDeleteOperation) {
              this.logger.warn(`Cannot get oldValue for ${resourceType} ${resourceId}, skipping audit log`);
              return;
            }

            // Identify changed fields
            let changedFields: string[] = [];
            if (method === 'PATCH' && body && typeof body === 'object') {
              // For PATCH, changed fields are the keys in the request body
              changedFields = Object.keys(body).filter(key => key !== 'id');
            } else if (oldValue && newValue) {
              // For PUT, compare old and new values
              changedFields = identifyChangedFields(oldValue, newValue);
            }

            // Skip audit log if no fields were actually changed (except for delete operations)
            if (changedFields.length === 0 && !isDeleteOperation) {
              this.logger.debug(`No fields changed for ${resourceType} ${resourceId}, skipping audit log`);
              return;
            }

            // Determine action type
            const actionType = isDeleteOperation ? 'DATA_DELETION' : 'DATA_MODIFICATION';

            // Log the modification
            await this.auditService.logDataModification({
              resourceType,
              resourceId,
              oldValue,
              newValue,
              changedFields,
              reason: body?.reason || body?.deleteReason,
              userId: user.id,
              ipAddress,
              userAgent,
              timestamp: new Date(),
              actionType,
            });
          } catch (error) {
            // Don't throw - audit logging failure should not affect main request
            this.logger.debug(`Failed to log data modification: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
        error: async (error) => {
          // For errors, we still want to log the attempt if we have oldValue
          await getOldValuePromise;

          try {
            const user = await this.authService.validateToken(token);
            if (!user || !user.id) {
              return;
            }

            // Log failed modification attempt
            await this.auditService.logDataModification({
              resourceType,
              resourceId,
              oldValue,
              newValue: null,
              changedFields: [],
              reason: `Operation failed: ${error.message || 'Unknown error'}`,
              userId: user.id,
              ipAddress,
              userAgent,
              timestamp: new Date(),
              actionType: 'DATA_MODIFICATION',
            });
          } catch (auditError) {
            // Don't throw - audit logging failure should not affect main request
            this.logger.debug(`Failed to log failed data modification: ${auditError instanceof Error ? auditError.message : String(auditError)}`);
          }
        },
      }),
    );
  }
}
