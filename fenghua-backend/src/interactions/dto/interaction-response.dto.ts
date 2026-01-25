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
 * Product summary for interaction response
 */
export class ProductSummaryDto {
  id: string;
  name: string;
  status?: string;
}

/**
 * Interaction response DTO
 */
export class InteractionResponseDto {
  id: string;
  /** @deprecated Use products array instead */
  productId?: string;
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
  /** @deprecated Legacy field for multi-creation tracking */
  createdInteractionIds?: string[];
  /** 客户名称（仅搜索接口返回，用于列表展示） */
  customerName?: string;
  /** @deprecated Use products array instead */
  productName?: string;
  /** 联系人ID（可选） */
  personId?: string;
  /** 联系人姓名（可选，用于列表展示） */
  personName?: string;
  
  /** 关联产品列表 */
  products?: ProductSummaryDto[];
}
