/**
 * Encryption Key DTOs
 * 
 * Data Transfer Objects for encryption key management
 * All custom code is proprietary and not open source.
 */

/**
 * Encryption key storage method
 */
export enum KeyStorageMethod {
  DATABASE = 'database', // Direct storage in database (development only)
  DATABASE_ENCRYPTED = 'database-encrypted', // Encrypted storage in database (production option 1)
  KMS = 'kms', // Key Management Service (production option 2, recommended)
}

/**
 * Encryption key entity (database representation)
 */
export interface EncryptionKeyEntity {
  id: string;
  version: number;
  key_data: string; // Base64 encoded key (encrypted if using database-encrypted method)
  is_active: boolean;
  created_at: Date;
  rotated_at: Date | null;
}

/**
 * Encryption key DTO for service operations
 */
export interface EncryptionKeyDto {
  id: string;
  version: number;
  key: Buffer; // Decrypted key buffer
  isActive: boolean;
  createdAt: Date;
  rotatedAt: Date | null;
}
