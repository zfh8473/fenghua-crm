/**
 * Storage Provider Interface
 * 
 * Defines the interface for cloud storage providers (Aliyun OSS, AWS S3, Cloudflare R2)
 * All custom code is proprietary and not open source.
 */

/**
 * Storage provider interface for file upload, delete, and signed URL generation
 */
export interface StorageProvider {
  /**
   * Upload file to cloud storage
   * @param buffer - File content (Buffer)
   * @param key - Storage key (path in object storage)
   * @param mimeType - MIME type
   * @returns File access URL
   */
  upload(buffer: Buffer, key: string, mimeType: string): Promise<string>;

  /**
   * Delete file from cloud storage
   * @param key - Storage key
   */
  delete(key: string): Promise<void>;

  /**
   * Generate signed URL for temporary access
   * @param key - Storage key
   * @param expiresIn - Expiration time in seconds, default 3600
   * @returns Signed URL
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

