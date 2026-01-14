/**
 * Comments Controller
 * 
 * Handles HTTP requests for interaction record comments
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Token } from '../../common/decorators/token.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto, CommentListResponseDto } from './dto/comment-response.dto';

@Controller('interactions/:interactionId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Create a new comment on an interaction record
   * 
   * POST /api/interactions/:interactionId/comments
   */
  @Post()
  async createComment(
    @Param('interactionId') interactionId: string,
    @Body(ValidationPipe) createDto: CreateCommentDto,
    @Token() token: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(interactionId, createDto, token);
  }

  /**
   * Get all comments for an interaction record
   * 
   * GET /api/interactions/:interactionId/comments
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20)
   * - since: ISO 8601 timestamp to fetch only comments created after this time (optional)
   */
  @Get()
  async getComments(
    @Param('interactionId') interactionId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('since') since?: string,
    @Token() token: string,
  ): Promise<CommentListResponseDto> {
    return this.commentsService.getCommentsByInteractionId(interactionId, token, page, limit, since);
  }

  /**
   * Get a single comment by ID
   * 
   * GET /api/interactions/:interactionId/comments/:commentId
   */
  @Get(':commentId')
  async getComment(
    @Param('interactionId') interactionId: string,
    @Param('commentId') commentId: string,
    @Token() token: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.getCommentById(commentId, token);
  }
}
