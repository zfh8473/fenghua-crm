/**
 * DTOs for interaction response
 * All custom code is proprietary and not open source.
 */

import { InteractionType, InteractionStatus } from './create-interaction.dto';

/**
 * File Attachment DTO for interaction response
 */
export class FileAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
}

/**
 * Interaction response DTO
 */
export class InteractionResponseDto {
  id: string;
  productId: string;
  customerId: string;
  interactionType: InteractionType;
  interactionDate: Date;
  description?: string;
  status?: InteractionStatus;
  additionalInfo?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  attachments?: FileAttachmentDto[];
  /** All created interaction IDs (when multiple products are selected) */
  createdInteractionIds?: string[];
}

