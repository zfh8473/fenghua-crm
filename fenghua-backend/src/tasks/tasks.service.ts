import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { CreateTaskDto, TaskPriority, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TasksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TasksService.name);
  private pgPool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl =
      this.configService.get<string>('DATABASE_URL') ||
      this.configService.get<string>('PG_DATABASE_URL');

    if (databaseUrl) {
      this.pgPool = new Pool({ connectionString: databaseUrl, max: 5 });
    } else {
      this.logger.warn('DATABASE_URL not configured');
    }
  }

  async onModuleInit() {
    if (!this.pgPool) return;
    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          description TEXT,
          priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
          status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          due_date DATE,
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE
        )
      `);
      this.logger.log('tasks table ready');
    } catch (error) {
      this.logger.error('Failed to initialize tasks table', error);
    }
  }

  async onModuleDestroy() {
    if (this.pgPool) await this.pgPool.end();
  }

  async findAll(userId: string): Promise<Task[]> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    const result = await this.pgPool.query(
      `SELECT id, title, description, priority, status,
              TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
              created_by, created_at, updated_at
       FROM tasks
       WHERE deleted_at IS NULL AND created_by = $1
       ORDER BY
         CASE status WHEN 'COMPLETED' THEN 1 ELSE 0 END ASC,
         CASE
           WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 0
           WHEN due_date IS NOT NULL THEN 1
           ELSE 2
         END ASC,
         due_date ASC NULLS LAST,
         CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END ASC,
         created_at DESC`,
      [userId],
    );

    return result.rows.map(this.mapRow);
  }

  async findOne(id: string, userId: string): Promise<Task> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    const result = await this.pgPool.query(
      `SELECT id, title, description, priority, status,
              TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
              created_by, created_at, updated_at
       FROM tasks WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    if (result.rows.length === 0) throw new NotFoundException('任务不存在');
    const task = this.mapRow(result.rows[0]);
    if (task.createdBy !== userId) throw new ForbiddenException('无权访问此任务');
    return task;
  }

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');
    if (!dto.title?.trim()) throw new BadRequestException('标题不能为空');

    const result = await this.pgPool.query(
      `INSERT INTO tasks (title, description, priority, status, due_date, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING id, title, description, priority, status,
                 TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
                 created_by, created_at, updated_at`,
      [
        dto.title.trim(),
        dto.description?.trim() || null,
        dto.priority || TaskPriority.MEDIUM,
        dto.status || TaskStatus.PENDING,
        dto.dueDate || null,
        userId,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    await this.findOne(id, userId); // ownership check

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.title !== undefined) { fields.push(`title = $${idx++}`); values.push(dto.title.trim()); }
    if (dto.description !== undefined) { fields.push(`description = $${idx++}`); values.push(dto.description?.trim() || null); }
    if (dto.priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(dto.priority); }
    if (dto.status !== undefined) { fields.push(`status = $${idx++}`); values.push(dto.status); }
    if ('dueDate' in dto) { fields.push(`due_date = $${idx++}`); values.push(dto.dueDate || null); }

    if (fields.length === 0) return this.findOne(id, userId);

    fields.push(`updated_at = NOW()`, `updated_by = $${idx++}`);
    values.push(userId, id);

    const result = await this.pgPool.query(
      `UPDATE tasks SET ${fields.join(', ')}
       WHERE id = $${idx} AND deleted_at IS NULL
       RETURNING id, title, description, priority, status,
                 TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
                 created_by, created_at, updated_at`,
      values,
    );

    return this.mapRow(result.rows[0]);
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    await this.findOne(id, userId); // ownership check

    await this.pgPool.query(
      `UPDATE tasks SET deleted_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  private mapRow(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority as TaskPriority,
      status: row.status as TaskStatus,
      dueDate: row.due_date,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
