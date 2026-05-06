import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type AuthReq = Request & { user?: { id: string; roles?: string[] } };

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('team-members')
  getTeamMembers(@Req() req: AuthReq) {
    const roles = req.user?.roles || [];
    if (!roles.some((r) => ['ADMIN', 'DIRECTOR'].includes(r))) {
      throw new ForbiddenException('无权访问成员列表');
    }
    return this.tasksService.getTeamMembers();
  }

  @Get()
  findAll(
    @Req() req: AuthReq,
    @Query('assignee_id') assigneeId?: string,
  ) {
    return this.tasksService.findAll(req.user!.id, req.user?.roles || [], assigneeId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthReq,
  ) {
    return this.tasksService.findOne(id, req.user!.id, req.user?.roles || []);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req: AuthReq) {
    return this.tasksService.create(dto, req.user!.id, req.user?.roles || []);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: AuthReq,
  ) {
    return this.tasksService.update(id, dto, req.user!.id, req.user?.roles || []);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthReq) {
    return this.tasksService.remove(id, req.user!.id, req.user?.roles || []);
  }
}
