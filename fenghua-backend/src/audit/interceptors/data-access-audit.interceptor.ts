/**
 * Data Access Audit Interceptor
 * 
 * Automatically logs data access operations to audit log
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from '../audit.service';
import { AuthService } from '../../auth/auth.service';

/**
 * Resource type mapping from route paths
 */
const RESOURCE_TYPE_MAP: Record<string, string> = {
  '/api/companies': 'CUSTOMER',
  '/api/customers': 'CUSTOMER',
  '/api/products': 'PRODUCT',
  '/api/interactions': 'INTERACTION',
  '/api/dashboard': 'DASHBOARD',
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
export class DataAccessAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataAccessAuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, path } = request;

    // Only intercept GET requests to detail pages (with ID in path)
    if (method !== 'GET') {
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

    // Intercept the response to log successful access
    return next.handle().pipe(
      tap({
        next: async () => {
          // Log successful data access
          try {
            const user = await this.authService.validateToken(token);
            if (user && user.id) {
              await this.auditService.logDataAccess({
                resourceType,
                resourceId,
                operationResult: 'SUCCESS',
                userId: user.id,
                ipAddress,
                userAgent,
                timestamp: new Date(),
              });
            }
          } catch (error) {
            // Don't throw - audit logging failure should not affect main request
            this.logger.debug(`Failed to log data access: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
        error: async (error) => {
          // Log failed data access (e.g., permission denied, not found)
          try {
            const user = await this.authService.validateToken(token);
            if (user && user.id) {
              let failureReason = 'Unknown error';
              if (error.status === 403) {
                failureReason = 'Permission denied';
              } else if (error.status === 404) {
                failureReason = 'Resource not found';
              } else if (error.message) {
                failureReason = error.message;
              }

              await this.auditService.logDataAccess({
                resourceType,
                resourceId,
                operationResult: 'FAILED',
                failureReason,
                userId: user.id,
                ipAddress,
                userAgent,
                timestamp: new Date(),
              });
            }
          } catch (auditError) {
            // Don't throw - audit logging failure should not affect main request
            this.logger.debug(`Failed to log failed data access: ${auditError instanceof Error ? auditError.message : String(auditError)}`);
          }
        },
      }),
    );
  }
}

