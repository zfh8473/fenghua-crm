/**
 * Encryption Interceptor
 * 
 * Automatically encrypts fields marked with @Encrypted() decorator before saving to database
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Request } from 'express';
import { EncryptionService } from '../encryption.service';
import { KeyManagementService } from '../key-management.service';
import { ENCRYPTED_FIELD_KEY } from '../decorators/encrypted.decorator';
import { Reflector } from '@nestjs/core';

/**
 * Get encrypted fields from metadata
 */
function getEncryptedFields(target: any): string[] {
  const encryptedFields: string[] = [];
  
  // Check class properties
  const prototype = Object.getPrototypeOf(target);
  if (prototype) {
    const propertyNames = Object.getOwnPropertyNames(prototype);
    for (const propName of propertyNames) {
      const metadata = Reflect.getMetadata(ENCRYPTED_FIELD_KEY, prototype, propName);
      if (metadata) {
        encryptedFields.push(propName);
      }
    }
  }

  // Check instance properties (for DTOs)
  const instanceProps = Object.keys(target);
  for (const propName of instanceProps) {
    const metadata = Reflect.getMetadata(ENCRYPTED_FIELD_KEY, target, propName);
    if (metadata) {
      encryptedFields.push(propName);
    }
  }

  return encryptedFields;
}

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EncryptionInterceptor.name);

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly keyManagementService: KeyManagementService,
    private readonly reflector: Reflector,
  ) {
    // Reflector is injected but we also use it directly
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, body } = request;

    // Only intercept write operations (POST, PUT, PATCH)
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return next.handle();
    }

    // Get request body
    if (!body || typeof body !== 'object') {
      return next.handle();
    }

    // Encrypt sensitive fields in request body BEFORE the request is processed
    // Use from() and switchMap to handle async operations properly
    return from(
      (async () => {
        try {
          // Get active encryption key
          const activeKey = await this.keyManagementService.getActiveKey();
          if (!activeKey) {
            this.logger.warn('No active encryption key found, skipping encryption');
            return;
          }

          const activeKeyVersion = await this.keyManagementService.getActiveKeyVersion();

          // Identify encrypted fields from DTO metadata or request body structure
          // Try to get DTO class from handler metadata
          const handler = context.getHandler();
          const paramTypes = this.reflector.get<Function[]>('design:paramtypes', handler);
          const dtoClass = paramTypes?.[0];
          
          let fieldsToEncrypt: string[] = [];
          
          // First, try to get encrypted fields from DTO metadata
          if (dtoClass && typeof dtoClass === 'function') {
            const encryptedFields = getEncryptedFields(dtoClass.prototype);
            if (encryptedFields.length > 0) {
              fieldsToEncrypt = encryptedFields;
            }
          }
          
          // Fallback: check common sensitive field names if metadata not available
          if (fieldsToEncrypt.length === 0) {
            const sensitiveFields = ['bankAccount', 'idNumber', 'bank_account', 'id_number'];
            for (const field of sensitiveFields) {
              if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
                fieldsToEncrypt.push(field);
              }
            }
          } else {
            // Filter to only fields that exist in the body
            fieldsToEncrypt = fieldsToEncrypt.filter(field => 
              body[field] !== undefined && body[field] !== null && body[field] !== ''
            );
          }

          if (fieldsToEncrypt.length === 0) {
            return;
          }

          // Encrypt fields
          const encryptedFields: string[] = [];

          for (const field of fieldsToEncrypt) {
            const plaintext = String(body[field]);
            try {
              const ciphertext = this.encryptionService.encrypt(plaintext, activeKey);
              body[field] = ciphertext;
              encryptedFields.push(field);

              // Set encryption metadata flags
              const encryptedFlagField = field === 'bankAccount' || field === 'bank_account' 
                ? 'bank_account_encrypted' 
                : 'id_number_encrypted';
              body[encryptedFlagField] = true;
            } catch (error) {
              this.logger.error(`Failed to encrypt field ${field}: ${error instanceof Error ? error.message : String(error)}`);
              // Don't fail the request, just log the error
            }
          }

          // Set encryption key version
          if (activeKeyVersion !== null && encryptedFields.length > 0) {
            body.encryption_key_version = activeKeyVersion;
          }

          this.logger.debug(`Encrypted ${encryptedFields.length} fields: ${encryptedFields.join(', ')}`);
        } catch (error) {
          this.logger.error(`Encryption interceptor error: ${error instanceof Error ? error.message : String(error)}`);
          // Don't fail the request if encryption fails
        }
      })(),
    ).pipe(
      switchMap(() => next.handle()),
    );
  }
}
