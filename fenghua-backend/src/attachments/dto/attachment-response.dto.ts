/**
 * Attachment Response DTO
 * 
 * Response DTO for attachment operations
 * All custom code is proprietary and not open source.
 */

export class AttachmentResponseDto {
  id: string;
  interactionId?: string;
  productId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  mimeType?: string;
  storageProvider: string;
  storageKey: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

