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
  assigneeId: string;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  displayName: string;
  email: string;
}

const MANAGER_ROLES = ['ADMIN', 'DIRECTOR'];

function isManager(roles: string[]): boolean {
  return roles.some((r) => MANAGER_ROLES.includes(r));
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
          assignee_id UUID REFERENCES users(id),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE
        )
      `);
      await this.pgPool.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id)
      `);
      await this.pgPool.query(`
        UPDATE tasks SET assignee_id = created_by WHERE assignee_id IS NULL AND deleted_at IS NULL
      `);
      this.logger.log('tasks table ready');
    } catch (error) {
      this.logger.error('Failed to initialize tasks table', error);
    }
  }

  async onModuleDestroy() {
    if (this.pgPool) await this.pgPool.end();
  }

  async findAll(userId: string, userRoles: string[], assigneeFilter?: string): Promise<Task[]> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    const manager = isManager(userRoles);
    const params: any[] = [];
    let whereExtra = '';

    if (manager) {
      if (assigneeFilter) {
        params.push(assigneeFilter);
        whereExtra = `AND t.assignee_id = $1`;
      }
    } else {
      params.push(userId);
      whereExtra = `AND t.assignee_id = $1`;
    }

    const result = await this.pgPool.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status,
              TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
              t.created_by, t.assignee_id,
              NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS assignee_name,
              t.created_at, t.updated_at
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id AND u.deleted_at IS NULL
       WHERE t.deleted_at IS NULL ${whereExtra}
       ORDER BY
         CASE t.status WHEN 'COMPLETED' THEN 1 ELSE 0 END ASC,
         CASE
           WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE THEN 0
           WHEN t.due_date IS NOT NULL THEN 1
           ELSE 2
         END ASC,
         t.due_date ASC NULLS LAST,
         CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END ASC,
         t.created_at DESC`,
      params,
    );

    return result.rows.map(this.mapRow);
  }

  async findOne(id: string, userId: string, userRoles: string[]): Promise<Task> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    const result = await this.pgPool.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status,
              TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
              t.created_by, t.assignee_id,
              NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS assignee_name,
              t.created_at, t.updated_at
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id AND u.deleted_at IS NULL
       WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id],
    );

    if (result.rows.length === 0) throw new NotFoundException('任务不存在');
    const task = this.mapRow(result.rows[0]);
    if (!isManager(userRoles) && task.assigneeId !== userId) {
      throw new ForbiddenException('无权访问此任务');
    }
    return task;
  }

  async create(dto: CreateTaskDto, userId: string, userRoles: string[]): Promise<Task> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');
    if (!dto.title?.trim()) throw new BadRequestException('标题不能为空');

    const assigneeId = isManager(userRoles) && dto.assigneeId ? dto.assigneeId : userId;

    const result = await this.pgPool.query(
      `INSERT INTO tasks (title, description, priority, status, due_date, assignee_id, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING id`,
      [
        dto.title.trim(),
        dto.description?.trim() || null,
        dto.priority || TaskPriority.MEDIUM,
        dto.status || TaskStatus.PENDING,
        dto.dueDate || null,
        assigneeId,
        userId,
      ],
    );

    return this.findOne(result.rows[0].id, userId, userRoles);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string, userRoles: string[]): Promise<Task> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    await this.findOne(id, userId, userRoles);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.title !== undefined) { fields.push(`title = $${idx++}`); values.push(dto.title.trim()); }
    if (dto.description !== undefined) { fields.push(`description = $${idx++}`); values.push(dto.description?.trim() || null); }
    if (dto.priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(dto.priority); }
    if (dto.status !== undefined) { fields.push(`status = $${idx++}`); values.push(dto.status); }
    if ('dueDate' in dto) { fields.push(`due_date = $${idx++}`); values.push(dto.dueDate || null); }
    if (dto.assigneeId !== undefined && isManager(userRoles)) {
      fields.push(`assignee_id = $${idx++}`);
      values.push(dto.assigneeId);
    }

    if (fields.length === 0) return this.findOne(id, userId, userRoles);

    fields.push(`updated_at = NOW()`, `updated_by = $${idx++}`);
    values.push(userId, id);

    await this.pgPool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`,
      values,
    );

    return this.findOne(id, userId, userRoles);
  }

  async remove(id: string, userId: string, userRoles: string[]): Promise<void> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    await this.findOne(id, userId, userRoles);

    await this.pgPool.query(`UPDATE tasks SET deleted_at = NOW() WHERE id = $1`, [id]);
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    if (!this.pgPool) throw new BadRequestException('数据库连接未初始化');

    const result = await this.pgPool.query(
      `SELECT id, email,
              NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), '') AS display_name
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), email) ASC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      displayName: row.display_name || row.email,
      email: row.email,
    }));
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
      assigneeId: row.assignee_id,
      assigneeName: row.assignee_name || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
