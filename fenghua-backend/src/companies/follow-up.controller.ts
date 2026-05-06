import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsInt, IsUUID, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FollowUpService } from './follow-up.service';

class AssignConfigDto {
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.ownerId !== null)
  ownerId?: string | null;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  followUpIntervalDays?: number;
}

type AuthReq = Request & { user?: { id: string; roles?: string[] } };

@Controller('workspace/follow-up')
@UseGuards(JwtAuthGuard)
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Get('assignees')
  getAssignees(@Req() req: AuthReq) {
    const roles = req.user?.roles || [];
    if (!roles.some((r) => ['ADMIN', 'DIRECTOR'].includes(r))) {
      throw new ForbiddenException('无权访问成员列表');
    }
    return this.followUpService.getAssignees();
  }

  @Get()
  getFollowUpList(
    @Req() req: AuthReq,
    @Query('owner') ownerFilter?: string,
    @Query('type') customerType?: string,
  ) {
    return this.followUpService.getFollowUpList(
      req.user!.id,
      req.user?.roles || [],
      ownerFilter,
      customerType,
    );
  }

  @Patch(':customerId/config')
  @HttpCode(HttpStatus.NO_CONTENT)
  assignConfig(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: AssignConfigDto,
    @Req() req: AuthReq,
  ) {
    return this.followUpService.assignConfig(
      customerId,
      dto.ownerId,
      dto.followUpIntervalDays,
      req.user?.roles || [],
    );
  }
}
