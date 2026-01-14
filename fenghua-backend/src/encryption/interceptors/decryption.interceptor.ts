/**
 * Decryption Interceptor
 * 
 * Automatically decrypts fields marked with @Encrypted() decorator when reading from database
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
import { switchMap } from 'rxjs/operators';
import { Request } from 'express';
import { EncryptionService } from '../encryption.service';
import { KeyManagementService } from '../key-management.service';
import { AuditService } from '../../audit/audit.service';
import { AuthService } from '../../auth/auth.service';

/**
 * Extract IP address from request
 */
function getIpAddress(request: Request): string | undefined {
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
function getUserAgent(request: Request): string | undefined {
  return request.headers['user-agent'];
}

@Injectable()
export class DecryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DecryptionInterceptor.name);

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly keyManagementService: KeyManagementService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method } = request;

    // Only intercept read operations (GET)
    if (method !== 'GET') {
      return next.handle();
    }

    // Decrypt sensitive fields in response
    return next.handle().pipe(
      switchMap(async (response) => {
        try {
          // Extract user information for audit logging
          const authHeader = request.headers.authorization;
          let userId: string | null = null;
          let user: any = null;

          if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type === 'Bearer' && token) {
              try {
                user = await this.authService.validateToken(token);
                if (user && user.id) {
                  userId = user.id;
                }
              } catch (error) {
                this.logger.debug(`Failed to validate token for audit logging: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          }

          // Handle different response formats
          let data: any = null;
          if (response && typeof response === 'object') {
            // Single object response
            if (response.data) {
              data = response.data;
            } else if (Array.isArray(response)) {
              // Array response
              data = response;
            } else {
              // Direct object response
              data = response;
            }
          }

          if (!data) {
            return response;
          }

          // Process single object or array of objects
          const processObject = async (obj: any): Promise<any> => {
            if (!obj || typeof obj !== 'object') {
              return obj;
            }

            const decryptedObj = { ...obj };
            const decryptedFields: string[] = [];

            // Check encryption flags
            const bankAccountEncrypted = obj.bank_account_encrypted || obj.bankAccountEncrypted;
            const idNumberEncrypted = obj.id_number_encrypted || obj.idNumberEncrypted;
            const keyVersion = obj.encryption_key_version || obj.encryptionKeyVersion;

            // Decrypt bank_account if encrypted
            if (bankAccountEncrypted && (obj.bank_account || obj.bankAccount)) {
              const fieldName = obj.bank_account !== undefined ? 'bank_account' : 'bankAccount';
              const ciphertext = obj[fieldName];

              if (ciphertext && typeof ciphertext === 'string') {
                try {
                  const key = keyVersion 
                    ? await this.keyManagementService.getKey(keyVersion)
                    : await this.keyManagementService.getActiveKey();

                  if (key) {
                    const plaintext = this.encryptionService.decrypt(ciphertext, key);
                    decryptedObj[fieldName] = plaintext;
                    decryptedFields.push(fieldName);
                  } else {
                    this.logger.warn(`Cannot decrypt ${fieldName}: key not found (version: ${keyVersion})`);
                    decryptedObj[fieldName] = '[ENCRYPTED]';
                  }
                } catch (error) {
                  this.logger.error(`Failed to decrypt ${fieldName}: ${error instanceof Error ? error.message : String(error)}`);
                  decryptedObj[fieldName] = '[ENCRYPTED]';
                }
              }
            }

            // Decrypt id_number if encrypted
            if (idNumberEncrypted && (obj.id_number || obj.idNumber)) {
              const fieldName = obj.id_number !== undefined ? 'id_number' : 'idNumber';
              const ciphertext = obj[fieldName];

              if (ciphertext && typeof ciphertext === 'string') {
                try {
                  const key = keyVersion 
                    ? await this.keyManagementService.getKey(keyVersion)
                    : await this.keyManagementService.getActiveKey();

                  if (key) {
                    const plaintext = this.encryptionService.decrypt(ciphertext, key);
                    decryptedObj[fieldName] = plaintext;
                    decryptedFields.push(fieldName);
                  } else {
                    this.logger.warn(`Cannot decrypt ${fieldName}: key not found (version: ${keyVersion})`);
                    decryptedObj[fieldName] = '[ENCRYPTED]';
                  }
                } catch (error) {
                  this.logger.error(`Failed to decrypt ${fieldName}: ${error instanceof Error ? error.message : String(error)}`);
                  decryptedObj[fieldName] = '[ENCRYPTED]';
                }
              }
            }

            // Log sensitive data access to audit log
            if (decryptedFields.length > 0 && userId) {
              const resourceId = obj.id || obj.uuid || 'unknown';
              const ipAddress = getIpAddress(request);
              const userAgent = getUserAgent(request);

              try {
                await this.auditService.logDataAccess({
                  resourceType: 'SENSITIVE_DATA',
                  resourceId: String(resourceId),
                  operationResult: 'SUCCESS',
                  userId,
                  ipAddress,
                  userAgent,
                  timestamp: new Date(),
                  metadata: {
                    sensitiveFields: decryptedFields,
                  },
                });
              } catch (error) {
                this.logger.debug(`Failed to log sensitive data access: ${error instanceof Error ? error.message : String(error)}`);
                // Don't fail the request if audit logging fails
              }
            }

            return decryptedObj;
          };

          // Process response data
          if (Array.isArray(data)) {
            // Array of objects
            const processedArray = await Promise.all(data.map(item => processObject(item)));
            
            if (response.data) {
              return { ...response, data: processedArray };
            } else {
              return processedArray;
            }
          } else {
            // Single object
            const processedData = await processObject(data);
            
            if (response.data) {
              return { ...response, data: processedData };
            } else {
              return processedData;
            }
          }
        } catch (error) {
          this.logger.error(`Decryption interceptor error: ${error instanceof Error ? error.message : String(error)}`);
          // Don't fail the request if decryption fails
          return response;
        }
      }),
    );
  }
}
