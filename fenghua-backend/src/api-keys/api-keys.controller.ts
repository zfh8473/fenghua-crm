/**
 * API Keys Controller
 *
 * 仅 ADMIN 可创建/列出/撤销 API Key。
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  private requireAdmin(req: any): void {
    const roles: string[] = req.user?.roles ?? [];
    if (!roles.includes('ADMIN')) {
      throw new ForbiddenException('仅 ADMIN 可管理 API Key');
    }
  }

  @Post()
  create(@Body() dto: CreateApiKeyDto, @Request() req: any) {
    this.requireAdmin(req);
    return this.apiKeysService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req: any) {
    const isAdmin = (req.user?.roles ?? []).includes('ADMIN');
    return this.apiKeysService.findAll(req.user.id, isAdmin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    const isAdmin = (req.user?.roles ?? []).includes('ADMIN');
    await this.apiKeysService.revoke(id, req.user.id, isAdmin);
  }
}
