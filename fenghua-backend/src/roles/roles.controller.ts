/**
 * Roles Controller
 * 
 * Provides REST endpoints for role management
 * All custom code is proprietary and not open source.
 */

import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { AdminGuard } from '../users/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Get user's current role
   */
  @Get('users/:userId')
  async getUserRole(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<RoleResponseDto> {
    return this.rolesService.getUserRole(userId);
  }

  /**
   * Get all roles
   */
  @Get()
  async findAll(): Promise<Array<{ id: string; name: string; description: string | null }>> {
    return this.rolesService.findAll();
  }

  /**
   * Assign role to a user
   */
  @Put('users/:userId/assign')
  @HttpCode(HttpStatus.OK)
  async assignRole(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req,
  ): Promise<RoleResponseDto> {
    const operatorId = req.user.id;
    return this.rolesService.assignRole(userId, assignRoleDto, operatorId);
  }

  /**
   * Remove role from a user
   */
  @Put('users/:userId/remove')
  @HttpCode(HttpStatus.OK)
  async removeRole(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    const operatorId = req.user.id;
    await this.rolesService.removeRole(userId, operatorId);
    return { message: 'Role removed successfully' };
  }
}

