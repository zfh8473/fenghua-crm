import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Req() req: Request & { user?: { id: string } }) {
    return this.tasksService.findAll(req.user!.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.tasksService.findOne(id, req.user!.id);
  }

  @Post()
  create(
    @Body() dto: CreateTaskDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.tasksService.create(dto, req.user!.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.tasksService.update(id, dto, req.user!.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.tasksService.remove(id, req.user!.id);
  }
}
