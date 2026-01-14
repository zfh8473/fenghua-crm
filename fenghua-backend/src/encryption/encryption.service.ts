/**
 * Encryption Service
 * 
 * Provides AES-256-GCM encryption and decryption functionality
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Encryption algorithm and configuration
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const TAG_LENGTH = 16; // 16 bytes for authentication tag
const KEY_LENGTH = 32; // 32 bytes for AES-256
// Note: SALT is not used with AES-256-GCM as we use the key directly (salt is for key derivation)

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  /**
   * Encrypt plaintext using AES-256-GCM
   * 
   * @param plaintext - The plaintext string to encrypt
   * @param key - The encryption key (32 bytes Buffer)
   * @returns Base64 encoded ciphertext with IV and auth tag
   * @throws Error if encryption fails
   */
  encrypt(plaintext: string, key: Buffer): string {
    if (!plaintext) {
      return '';
    }

    if (!key || key.length !== KEY_LENGTH) {
      throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (256 bits)`);
    }

    try {
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV + encrypted data + auth tag
      const combined = Buffer.concat([iv, encrypted, authTag]);

      // Return as Base64 string
      return combined.toString('base64');
    } catch (error) {
      this.logger.error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   * 
   * @param ciphertext - Base64 encoded ciphertext with IV and auth tag
   * @param key - The decryption key (32 bytes Buffer)
   * @returns Decrypted plaintext string
   * @throws Error if decryption fails
   */
  decrypt(ciphertext: string, key: Buffer): string {
    if (!ciphertext) {
      return '';
    }

    if (!key || key.length !== KEY_LENGTH) {
      throw new Error(`Decryption key must be ${KEY_LENGTH} bytes (256 bits)`);
    }

    try {
      // Decode from Base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract IV, encrypted data, and auth tag
      if (combined.length < IV_LENGTH + TAG_LENGTH) {
        throw new Error('Invalid ciphertext format: too short');
      }

      const iv = combined.slice(0, IV_LENGTH);
      const authTag = combined.slice(combined.length - TAG_LENGTH);
      const encrypted = combined.slice(IV_LENGTH, combined.length - TAG_LENGTH);

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Return as UTF-8 string
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a random encryption key
   * 
   * @returns 32-byte Buffer containing the encryption key
   */
  generateKey(): Buffer {
    return crypto.randomBytes(KEY_LENGTH);
  }

  /**
   * Convert key Buffer to Base64 string for storage
   * 
   * @param key - The encryption key Buffer
   * @returns Base64 encoded key string
   */
  keyToBase64(key: Buffer): string {
    return key.toString('base64');
  }

  /**
   * Convert Base64 string to key Buffer
   * 
   * @param keyBase64 - Base64 encoded key string
   * @returns Encryption key Buffer
   */
  keyFromBase64(keyBase64: string): Buffer {
    return Buffer.from(keyBase64, 'base64');
  }
}
