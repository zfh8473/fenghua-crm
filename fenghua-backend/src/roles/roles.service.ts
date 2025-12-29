/**
 * Roles Service
 * 
 * Manages role assignment and role-related operations using native database queries
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { UserRole } from '../users/dto/create-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { AuditService } from '../audit/audit.service';
import { PermissionService } from '../permission/permission.service';

interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface UserRoleRecord {
  user_id: string;
  role_id: string;
  assigned_at: Date;
}

@Injectable()
export class RolesService implements OnModuleDestroy {
  private readonly logger = new Logger(RolesService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
  ) {
    this.initializeDatabaseConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   * Connects to fenghua-crm database
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    
    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, role management will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size for roles service
      });
      this.logger.log('PostgreSQL connection pool initialized for RolesService');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL connection pool', error);
    }
  }

  /**
   * Cleanup database connection pool
   */
  async onModuleDestroy() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        this.logger.log('PostgreSQL connection pool closed for RolesService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }

  /**
   * Get all roles
   * Returns all roles from the roles table
   */
  async findAll(): Promise<Array<{ id: string; name: string; description: string | null }>> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('Role management service unavailable');
    }

    try {
      const query = `
        SELECT id, name, description
        FROM roles
        ORDER BY name ASC
      `;

      const result = await this.pgPool.query<Role>(query);

      return result.rows.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }));
    } catch (error) {
      this.logger.error('Error fetching roles', error);
      throw new BadRequestException('Failed to fetch roles');
    }
  }

  /**
   * Get user's current role
   */
  async getUserRole(userId: string): Promise<RoleResponseDto> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('Role management service unavailable');
    }

    try {
      // Check if user exists
      const userCheck = await this.pgPool.query(
        'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get user's roles
      const query = `
        SELECT
          ur.user_id,
          ur.role_id,
          ur.assigned_at,
          r.name as role_name
        FROM user_roles ur
        INNER JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1
        ORDER BY ur.assigned_at DESC
        LIMIT 1
      `;

      const result = await this.pgPool.query<UserRoleRecord & { role_name: string }>(query, [userId]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`No role assigned to user ${userId}`);
      }

      const userRole = result.rows[0];
      const roleName = userRole.role_name as UserRole;

      return {
        userId: userId,
        role: roleName,
        roleId: userRole.role_id,
        assignedAt: (userRole.assigned_at instanceof Date ? userRole.assigned_at : new Date(userRole.assigned_at)).toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting role for user ${userId}`, error);
      throw new BadRequestException('Failed to get user role');
    }
  }

  /**
   * Assign role to a user
   */
  async assignRole(userId: string, assignRoleDto: AssignRoleDto, operatorId: string): Promise<RoleResponseDto> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('Role management service unavailable');
    }

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Check if user exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get role ID
      const roleResult = await client.query(
        'SELECT id, name FROM roles WHERE name = $1',
        [assignRoleDto.role]
      );

      if (roleResult.rows.length === 0) {
        throw new NotFoundException(`Role ${assignRoleDto.role} not found`);
      }

      const roleId = roleResult.rows[0].id;

      // Get old role for audit log
      const oldRoleQuery = `
        SELECT r.name as role_name
        FROM user_roles ur
        INNER JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1
        ORDER BY ur.assigned_at DESC
        LIMIT 1
      `;
      const oldRoleResult = await client.query<{ role_name: string }>(oldRoleQuery, [userId]);
      const oldRole = oldRoleResult.rows.length > 0 ? oldRoleResult.rows[0].role_name : null;

      // Delete existing role assignments (user can only have one role at a time)
      await client.query(
        'DELETE FROM user_roles WHERE user_id = $1',
        [userId]
      );

      // Assign new role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         RETURNING assigned_at`,
        [userId, roleId]
      );

      await client.query('COMMIT');

      // Log role change to audit service
      await this.auditService.logRoleChange({
        oldRole: oldRole || 'NONE',
        newRole: assignRoleDto.role,
        userId: userId,
        operatorId: operatorId,
        timestamp: new Date(),
        reason: assignRoleDto.reason,
      });

      // Invalidate caches
      this.invalidateCaches(userId);

      this.logger.log(`Role ${assignRoleDto.role} assigned to user ${userId} by operator ${operatorId}`);

      return {
        userId: userId,
        role: assignRoleDto.role,
        roleId: roleId,
        assignedAt: new Date().toISOString(),
        assignedBy: operatorId,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error assigning role to user ${userId}`, error);
      throw new BadRequestException('Failed to assign role');
    } finally {
      client.release();
    }
  }

  /**
   * Remove role from a user
   */
  async removeRole(userId: string, operatorId: string): Promise<void> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('Role management service unavailable');
    }

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Check if user exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get old role for audit log
      const oldRoleQuery = `
        SELECT r.name as role_name
        FROM user_roles ur
        INNER JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1
        ORDER BY ur.assigned_at DESC
        LIMIT 1
      `;
      const oldRoleResult = await client.query<{ role_name: string }>(oldRoleQuery, [userId]);
      const oldRole = oldRoleResult.rows.length > 0 ? oldRoleResult.rows[0].role_name : null;

      if (!oldRole) {
        throw new NotFoundException(`No role assigned to user ${userId}`);
      }

      // Delete role assignment
      await client.query(
        'DELETE FROM user_roles WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      // Log role change to audit service
      await this.auditService.logRoleChange({
        oldRole: oldRole,
        newRole: 'NONE',
        userId: userId,
        operatorId: operatorId,
        timestamp: new Date(),
        reason: 'Role removed by administrator',
      });

      // Invalidate caches
      this.invalidateCaches(userId);

      this.logger.log(`Role removed from user ${userId} by operator ${operatorId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error removing role from user ${userId}: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new BadRequestException(`Failed to remove role from user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Invalidate role-related caches
   * Called when role is changed
   */
  invalidateCaches(userId: string): void {
    // Invalidate permission cache
    this.permissionService.invalidateUserCache(userId);
    this.logger.log(`Cache invalidated for user ${userId} (permissions and data access)`);
  }
}
