/**
 * Local Storage Service
 * 
 * Temporary implementation for development/testing
 * In production, replace with actual cloud storage (Aliyun OSS, AWS S3, Cloudflare R2)
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from './storage.interface';

@Injectable()
export class LocalStorageService implements StorageProvider {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    // Use local uploads directory for development
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Upload file to local storage (development only)
   */
  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const fileDir = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, buffer);
    
    // Return local file URL (in production, this would be cloud storage URL)
    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3001');
    return `${baseUrl}/uploads/${key}`;
  }

  /**
   * Delete file from local storage
   */
  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.debug(`Deleted file: ${filePath}`);
    } else {
      this.logger.warn(`File not found for deletion: ${filePath}`);
    }
  }

  /**
   * Generate signed URL (for local storage, just return the URL)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3001');
    return `${baseUrl}/uploads/${key}`;
  }
}

