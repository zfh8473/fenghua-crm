/**
 * Key Management Service
 * 
 * Manages encryption keys: generation, storage, retrieval, and rotation
 * Supports multiple storage methods: database, encrypted database, or KMS
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { EncryptionService } from './encryption.service';
import { KeyStorageMethod, EncryptionKeyEntity, EncryptionKeyDto } from './dto/encryption-key.dto';

/**
 * In-memory cache for encryption keys (to reduce database/KMS calls)
 */
interface KeyCacheEntry {
  key: Buffer;
  expiresAt: number;
}

@Injectable()
export class KeyManagementService implements OnModuleDestroy {
  private readonly logger = new Logger(KeyManagementService.name);
  private pgPool: Pool | null = null;
  private keyCache: Map<number, KeyCacheEntry> = new Map();
  private cacheTtl: number = 300000; // 5 minutes in milliseconds

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.initializeDatabaseConnection();
    this.cacheTtl = (this.configService.get<number>('ENCRYPTION_KEY_CACHE_TTL') || 300) * 1000;
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, key management operations will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.logger.log('Database connection pool initialized for key management');
    } catch (error) {
      this.logger.error(`Failed to initialize database connection: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }

  /**
   * Get the storage method from environment variable
   */
  private getStorageMethod(): KeyStorageMethod {
    const method = this.configService.get<string>('ENCRYPTION_KEY_STORAGE_METHOD') || 'database';
    return method as KeyStorageMethod;
  }

  /**
   * Get master encryption key for encrypting keys in database (for database-encrypted method)
   */
  private getMasterKey(): Buffer | null {
    const masterKeyBase64 = this.configService.get<string>('MASTER_ENCRYPTION_KEY');
    if (!masterKeyBase64) {
      return null;
    }

    try {
      return this.encryptionService.keyFromBase64(masterKeyBase64);
    } catch (error) {
      this.logger.error(`Failed to parse master encryption key: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Generate a new encryption key
   */
  generateKey(): Buffer {
    return this.encryptionService.generateKey();
  }

  /**
   * Store encryption key in database
   */
  async storeKey(version: number, key: Buffer, isActive: boolean = true): Promise<string> {
    if (!this.pgPool) {
      throw new Error('Database pool not initialized');
    }

    const storageMethod = this.getStorageMethod();
    let keyData: string;

    try {
      switch (storageMethod) {
        case KeyStorageMethod.DATABASE:
          // Direct storage (development only)
          keyData = this.encryptionService.keyToBase64(key);
          break;

        case KeyStorageMethod.DATABASE_ENCRYPTED:
          // Encrypt key with master key before storage
          const masterKey = this.getMasterKey();
          if (!masterKey) {
            throw new Error('MASTER_ENCRYPTION_KEY not configured for database-encrypted storage method');
          }
          keyData = this.encryptionService.encrypt(this.encryptionService.keyToBase64(key), masterKey);
          break;

        case KeyStorageMethod.KMS:
          // For KMS, we would store the key ID, not the key itself
          // This is a placeholder - actual KMS integration would be implemented here
          this.logger.warn('KMS storage method not yet implemented, using database storage as fallback');
          keyData = this.encryptionService.keyToBase64(key);
          break;

        default:
          throw new Error(`Unsupported storage method: ${storageMethod}`);
      }

      // Insert into database
      const result = await this.pgPool.query<EncryptionKeyEntity>(
        `INSERT INTO encryption_keys (version, key_data, is_active, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         RETURNING id`,
        [version, keyData, isActive],
      );

      const keyId = result.rows[0].id;

      // Clear cache for this version
      this.keyCache.delete(version);

      this.logger.log(`Encryption key stored: version ${version}, method: ${storageMethod}`);
      return keyId;
    } catch (error) {
      this.logger.error(`Failed to store encryption key: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }

  /**
   * Retrieve encryption key by version
   */
  async getKey(version: number): Promise<Buffer | null> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, cannot retrieve key');
      return null;
    }

    // Check cache first and clean expired entries
    const cached = this.keyCache.get(version);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        return cached.key;
      } else {
        // Remove expired entry
        this.keyCache.delete(version);
      }
    }
    
    // Clean up other expired entries periodically (every 10th call)
    if (Math.random() < 0.1) {
      this.cleanExpiredCache();
    }

    try {
      // Query database
      const result = await this.pgPool.query<EncryptionKeyEntity>(
        `SELECT key_data, version FROM encryption_keys WHERE version = $1 LIMIT 1`,
        [version],
      );

      if (result.rows.length === 0) {
        this.logger.warn(`Encryption key not found for version ${version}`);
        return null;
      }

      const keyEntity = result.rows[0];
      const storageMethod = this.getStorageMethod();
      let key: Buffer;

      switch (storageMethod) {
        case KeyStorageMethod.DATABASE:
          // Direct retrieval
          key = this.encryptionService.keyFromBase64(keyEntity.key_data);
          break;

        case KeyStorageMethod.DATABASE_ENCRYPTED:
          // Decrypt key using master key
          const masterKey = this.getMasterKey();
          if (!masterKey) {
            throw new Error('MASTER_ENCRYPTION_KEY not configured');
          }
          const decryptedKeyBase64 = this.encryptionService.decrypt(keyEntity.key_data, masterKey);
          key = this.encryptionService.keyFromBase64(decryptedKeyBase64);
          break;

        case KeyStorageMethod.KMS:
          // For KMS, retrieve key from KMS service using key ID
          // This is a placeholder - actual KMS integration would be implemented here
          this.logger.warn('KMS storage method not yet implemented, using database storage as fallback');
          key = this.encryptionService.keyFromBase64(keyEntity.key_data);
          break;

        default:
          throw new Error(`Unsupported storage method: ${storageMethod}`);
      }

      // Cache the key
      this.keyCache.set(version, {
        key,
        expiresAt: Date.now() + this.cacheTtl,
      });

      return key;
    } catch (error) {
      this.logger.error(`Failed to retrieve encryption key version ${version}: ${error instanceof Error ? error.message : String(error)}`, error);
      return null;
    }
  }

  /**
   * Get the current active encryption key (highest version with is_active = true)
   */
  async getActiveKey(): Promise<Buffer | null> {
    if (!this.pgPool) {
      this.logger.warn('Database pool not initialized, cannot retrieve active key');
      return null;
    }

    try {
      const result = await this.pgPool.query<EncryptionKeyEntity>(
        `SELECT version FROM encryption_keys 
         WHERE is_active = true 
         ORDER BY version DESC 
         LIMIT 1`,
      );

      if (result.rows.length === 0) {
        this.logger.warn('No active encryption key found');
        return null;
      }

      const version = result.rows[0].version;
      return await this.getKey(version);
    } catch (error) {
      this.logger.error(`Failed to retrieve active encryption key: ${error instanceof Error ? error.message : String(error)}`, error);
      return null;
    }
  }

  /**
   * Get the version number of the current active key
   */
  async getActiveKeyVersion(): Promise<number | null> {
    if (!this.pgPool) {
      return null;
    }

    try {
      const result = await this.pgPool.query<{ version: number }>(
        `SELECT version FROM encryption_keys 
         WHERE is_active = true 
         ORDER BY version DESC 
         LIMIT 1`,
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].version;
    } catch (error) {
      this.logger.error(`Failed to retrieve active key version: ${error instanceof Error ? error.message : String(error)}`, error);
      return null;
    }
  }

  /**
   * Rotate encryption key (create new active key, deactivate old ones)
   */
  async rotateKey(): Promise<{ newVersion: number; oldVersion: number | null }> {
    if (!this.pgPool) {
      throw new Error('Database pool not initialized');
    }

    try {
      // Get current active key version
      const oldVersion = await this.getActiveKeyVersion();

      // Generate new key
      const newKey = this.generateKey();

      // Determine new version number
      let newVersion = 1;
      if (oldVersion !== null) {
        newVersion = oldVersion + 1;
      }

      // Store new key as active
      await this.storeKey(newVersion, newKey, true);

      // Deactivate old keys (but keep them for decryption)
      if (oldVersion !== null) {
        await this.pgPool.query(
          `UPDATE encryption_keys 
           SET is_active = false, rotated_at = CURRENT_TIMESTAMP 
           WHERE version = $1`,
          [oldVersion],
        );
        this.logger.log(`Deactivated encryption key version ${oldVersion}`);
      }

      // Clear cache
      this.keyCache.clear();

      this.logger.log(`Encryption key rotated: new version ${newVersion}, old version ${oldVersion}`);
      return { newVersion, oldVersion };
    } catch (error) {
      this.logger.error(`Failed to rotate encryption key: ${error instanceof Error ? error.message : String(error)}`, error);
      throw error;
    }
  }

  /**
   * List all encryption keys
   */
  async listKeys(): Promise<EncryptionKeyDto[]> {
    if (!this.pgPool) {
      return [];
    }

    try {
      const result = await this.pgPool.query<EncryptionKeyEntity>(
        `SELECT id, version, key_data, is_active, created_at, rotated_at 
         FROM encryption_keys 
         ORDER BY version DESC`,
      );

      const storageMethod = this.getStorageMethod();
      const keys: EncryptionKeyDto[] = [];

      for (const row of result.rows) {
        let key: Buffer;

        try {
          switch (storageMethod) {
            case KeyStorageMethod.DATABASE:
              key = this.encryptionService.keyFromBase64(row.key_data);
              break;

            case KeyStorageMethod.DATABASE_ENCRYPTED:
              const masterKey = this.getMasterKey();
              if (!masterKey) {
                this.logger.warn(`Skipping key version ${row.version}: master key not configured`);
                continue;
              }
              const decryptedKeyBase64 = this.encryptionService.decrypt(row.key_data, masterKey);
              key = this.encryptionService.keyFromBase64(decryptedKeyBase64);
              break;

            case KeyStorageMethod.KMS:
              // Placeholder for KMS
              key = this.encryptionService.keyFromBase64(row.key_data);
              break;

            default:
              continue;
          }

          keys.push({
            id: row.id,
            version: row.version,
            key,
            isActive: row.is_active,
            createdAt: row.created_at,
            rotatedAt: row.rotated_at,
          });
        } catch (error) {
          this.logger.warn(`Failed to decrypt key version ${row.version}: ${error instanceof Error ? error.message : String(error)}`);
          // Skip this key but continue with others
        }
      }

      return keys;
    } catch (error) {
      this.logger.error(`Failed to list encryption keys: ${error instanceof Error ? error.message : String(error)}`, error);
      return [];
    }
  }

  /**
   * Clean expired entries from key cache
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [version, entry] of this.keyCache.entries()) {
      if (entry.expiresAt <= now) {
        this.keyCache.delete(version);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired key cache entries`);
    }
  }

  /**
   * Clear key cache
   */
  clearCache(): void {
    this.keyCache.clear();
    this.logger.debug('Encryption key cache cleared');
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.logger.log('Database connection pool closed for key management');
    }
  }
}
