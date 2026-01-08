/**
 * Attachments Controller
 * 
 * Provides REST endpoints for file attachment operations
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { LinkAttachmentDto } from './dto/link-attachment.dto';
import { UpdateAttachmentMetadataDto } from './dto/update-attachment-metadata.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Token } from '../common/decorators/token.decorator';
import { AuthService } from '../auth/auth.service';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Upload file
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Token() token: string,
  ): Promise<AttachmentResponseDto> {
    // Validate file
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // Get user from token
    const user = await this.authService.validateToken(token);

    // Upload file
    return this.attachmentsService.uploadFile(file, user.id, token);
  }

  /**
   * Link attachment to interaction
   */
  @Post(':attachmentId/link')
  @HttpCode(HttpStatus.NO_CONTENT)
  async linkToInteraction(
    @Param('attachmentId') attachmentId: string,
    @Body(ValidationPipe) linkDto: LinkAttachmentDto,
    @Token() token: string,
  ): Promise<void> {
    await this.attachmentsService.linkToInteraction(attachmentId, linkDto.interactionId);
  }

  /**
   * Delete attachment
   */
  @Delete(':attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @Token() token: string,
  ): Promise<void> {
    const user = await this.authService.validateToken(token);
    await this.attachmentsService.deleteAttachment(attachmentId, user.id);
  }

  /**
   * Update attachment metadata (order and annotation)
   */
  @Patch(':attachmentId/metadata')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateMetadata(
    @Param('attachmentId') attachmentId: string,
    @Body(ValidationPipe) dto: UpdateAttachmentMetadataDto,
    @Token() token: string,
  ): Promise<void> {
    const user = await this.authService.validateToken(token);
    await this.attachmentsService.updateMetadata(attachmentId, dto, user.id);
  }
}

