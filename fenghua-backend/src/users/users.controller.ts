import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Users Controller
 * Handles HTTP requests for user management
 */
@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users
   * Query params: role (optional), search (optional)
   */
  @Get()
  async findAll(@Request() req): Promise<UserResponseDto[]> {
    const roleFilter = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    return this.usersService.findAll(roleFilter, search);
  }

  /**
   * Get a user by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  /**
   * Create a new user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Update a user
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<UserResponseDto> {
    const operatorId = req.user.id; // Get operator ID from JWT token
    return this.usersService.update(id, updateUserDto, operatorId);
  }

  /**
   * Delete a user (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const currentUserId = req.user.id;
    return this.usersService.remove(id, currentUserId);
  }
}

