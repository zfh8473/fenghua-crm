/**
 * @Encrypted Decorator
 * 
 * Decorator to mark fields that should be encrypted/decrypted automatically
 * All custom code is proprietary and not open source.
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for encrypted fields
 */
export const ENCRYPTED_FIELD_KEY = 'encrypted_fields';

/**
 * Decorator to mark a field as encrypted
 * 
 * Usage:
 * ```typescript
 * class CreateCustomerDto {
 *   @Encrypted()
 *   bankAccount?: string;
 * }
 * ```
 */
export function Encrypted(): PropertyDecorator {
  return SetMetadata(ENCRYPTED_FIELD_KEY, true);
}
