/**
 * DTOs for comment response
 * All custom code is proprietary and not open source.
 */

/**
 * Comment response DTO
 */
export class CommentResponseDto {
  id: string;
  interactionId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}

/**
 * Comment list response DTO with pagination
 */
export class CommentListResponseDto {
  data: CommentResponseDto[];
  total: number;
  page: number;
  limit: number;
}
