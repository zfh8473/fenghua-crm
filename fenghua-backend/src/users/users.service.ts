/**
 * Users Service
 * 
 * Handles user management operations using native database queries
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuditService } from '../audit/audit.service';

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  roles: Array<{
    role_id: string;
    role_name: string;
  }>;
}

@Injectable()
export class UsersService implements OnModuleDestroy {
  private readonly logger = new Logger(UsersService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
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
      this.logger.warn('DATABASE_URL not configured, user management will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Connection pool size for users service
      });
      this.logger.log('PostgreSQL connection pool initialized for UsersService');
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
        this.logger.log('PostgreSQL connection pool closed for UsersService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }

  /**
   * Get all users with optional filtering and search
   * 
   * @param roleFilter - Optional role name to filter by
   * @param search - Optional search term (searches email, first_name, last_name)
   */
  async findAll(roleFilter?: string, search?: string): Promise<UserResponseDto[]> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('User management service unavailable');
    }

    // Input validation
    if (roleFilter && roleFilter.length > 50) {
      throw new BadRequestException('Role filter must be 50 characters or less');
    }
    if (search && search.length > 100) {
      throw new BadRequestException('Search term must be 100 characters or less');
    }

    try {
      let query = `
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          COALESCE(
            json_agg(
              json_build_object(
                'role_id', r.id,
                'role_name', r.name
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::json
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE u.deleted_at IS NULL
      `;

      const queryParams: any[] = [];
      let paramIndex = 1;

      // Add role filter
      if (roleFilter) {
        query += ` AND r.name = $${paramIndex}`;
        queryParams.push(roleFilter);
        paramIndex++;
      }

      // Add search filter
      if (search) {
        query += ` AND (
          LOWER(u.email) LIKE LOWER($${paramIndex}) OR
          LOWER(u.first_name) LIKE LOWER($${paramIndex}) OR
          LOWER(u.last_name) LIKE LOWER($${paramIndex})
        )`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      query += `
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.created_at, u.updated_at, u.deleted_at
        ORDER BY u.created_at DESC
      `;

      const result = await this.pgPool.query<UserWithRoles>(query, queryParams);

      return result.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        role: (user.roles || []).length > 0 ? (user.roles[0] as any).role_name : null,
        createdAt: (user.created_at instanceof Date ? user.created_at : new Date(user.created_at)).toISOString(),
        updatedAt: (user.updated_at instanceof Date ? user.updated_at : new Date(user.updated_at)).toISOString(),
        deletedAt: user.deleted_at ? (user.deleted_at instanceof Date ? user.deleted_at : new Date(user.deleted_at)).toISOString() : undefined,
      }));
    } catch (error) {
      this.logger.error('Error fetching users', error);
      throw new BadRequestException('Failed to fetch users');
    }
  }

  /**
   * Get a user by ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('User management service unavailable');
    }

    try {
      const query = `
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          COALESCE(
            json_agg(
              json_build_object(
                'role_id', r.id,
                'role_name', r.name
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::json
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        WHERE u.id = $1
          AND u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.created_at, u.updated_at, u.deleted_at
        LIMIT 1
      `;

      const result = await this.pgPool.query<UserWithRoles>(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const user = result.rows[0];

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        role: (user.roles || []).length > 0 ? (user.roles[0] as any).role_name : null,
        createdAt: (user.created_at instanceof Date ? user.created_at : new Date(user.created_at)).toISOString(),
        updatedAt: (user.updated_at instanceof Date ? user.updated_at : new Date(user.updated_at)).toISOString(),
        deletedAt: user.deleted_at ? (user.deleted_at instanceof Date ? user.deleted_at : new Date(user.deleted_at)).toISOString() : undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching user ${id}`, error);
      throw new BadRequestException('Failed to fetch user');
    }
  }

  /**
   * Create a new user
   * Uses transaction to ensure user and role assignment are atomic
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('User management service unavailable');
    }

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Check if user with email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
        [createUserDto.email]
      );

      if (existingUser.rows.length > 0) {
        throw new ConflictException(`User with email ${createUserDto.email} already exists`);
      }

      // Get role ID
      const roleResult = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [createUserDto.role]
      );

      if (roleResult.rows.length === 0) {
        throw new NotFoundException(`Role ${createUserDto.role} not found`);
      }

      const roleId = roleResult.rows[0].id;

      // Hash password
      const passwordHash = await bcrypt.hash(createUserDto.password, 10);

      // Create user
      const insertResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, email, first_name, last_name, created_at, updated_at`,
        [
          createUserDto.email.toLowerCase(),
          passwordHash,
          createUserDto.firstName || null,
          createUserDto.lastName || null,
          false, // Email not verified by default
        ]
      );

      const newUser = insertResult.rows[0];

      // Assign role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [newUser.id, roleId]
      );

      await client.query('COMMIT');

      this.logger.log(`User ${newUser.id} created successfully`);

      return {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name || undefined,
        lastName: newUser.last_name || undefined,
        role: createUserDto.role,
        createdAt: (newUser.created_at instanceof Date ? newUser.created_at : new Date(newUser.created_at)).toISOString(),
        updatedAt: (newUser.updated_at instanceof Date ? newUser.updated_at : new Date(newUser.updated_at)).toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error creating user', error);
      throw new BadRequestException('Failed to create user');
    } finally {
      client.release();
    }
  }

  /**
   * Update a user
   * Uses transaction to ensure user and role updates are atomic
   * 
   * @param id - User ID to update
   * @param updateUserDto - User update data
   * @param operatorId - ID of the user performing the update (for audit logging)
   * @returns Updated user data
   */
  async update(id: string, updateUserDto: UpdateUserDto, operatorId: string): Promise<UserResponseDto> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('User management service unavailable');
    }

    // Check if user exists (this will throw NotFoundException if user not found)
    try {
      await this.findOne(id);
    } catch (error) {
      // Re-throw NotFoundException from findOne
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Update user information
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateUserDto.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex}`);
        updateValues.push(updateUserDto.firstName || null);
        paramIndex++;
      }

      if (updateUserDto.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex}`);
        updateValues.push(updateUserDto.lastName || null);
        paramIndex++;
      }

      if (updateUserDto.password !== undefined && updateUserDto.password.trim() !== '') {
        const passwordHash = await bcrypt.hash(updateUserDto.password, 10);
        updateFields.push(`password_hash = $${paramIndex}`);
        updateValues.push(passwordHash);
        paramIndex++;
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const updateQuery = `
          UPDATE users
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id, email, first_name, last_name, created_at, updated_at
        `;

        await client.query(updateQuery, updateValues);
      }

      // Update role if provided
      let oldRole: string | null = null;
      if (updateUserDto.role) {
        // Get old role before updating (for audit logging)
        const oldRoleQuery = `
          SELECT r.name as role_name
          FROM user_roles ur
          INNER JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = $1
          ORDER BY ur.assigned_at DESC
          LIMIT 1
        `;
        const oldRoleResult = await client.query<{ role_name: string }>(oldRoleQuery, [id]);
        oldRole = oldRoleResult.rows.length > 0 ? oldRoleResult.rows[0].role_name : 'NONE';

        // Get role ID
        const roleResult = await client.query(
          'SELECT id FROM roles WHERE name = $1',
          [updateUserDto.role]
        );

        if (roleResult.rows.length === 0) {
          throw new NotFoundException(`Role ${updateUserDto.role} not found`);
        }

        const roleId = roleResult.rows[0].id;

        // Delete existing role assignments
        await client.query(
          'DELETE FROM user_roles WHERE user_id = $1',
          [id]
        );

        // Assign new role
        await client.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)`,
          [id, roleId]
        );
      }

      await client.query('COMMIT');

      // Log role change to audit service (after transaction commit)
      if (updateUserDto.role && oldRole !== null) {
        try {
          await this.auditService.logRoleChange({
            oldRole: oldRole,
            newRole: updateUserDto.role,
            userId: id,
            operatorId: operatorId,
            timestamp: new Date(),
            reason: 'Role updated via user update',
          });
        } catch (auditError) {
          // Audit logging failure should not affect the main request
          this.logger.warn(`Failed to log role change in user update for user ${id}: ${auditError instanceof Error ? auditError.message : String(auditError)}`, auditError);
        }
      }

      // Fetch updated user
      return await this.findOne(id);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error updating user ${id}: ${error instanceof Error ? error.message : String(error)}`, error);
      throw new BadRequestException(`Failed to update user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete a user
   */
  async remove(id: string, currentUserId: string): Promise<void> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new BadRequestException('User management service unavailable');
    }

    // Prevent self-deletion
    if (id === currentUserId) {
      throw new BadRequestException('不能删除自己的账户');
    }

    // Check if user exists
    await this.findOne(id);

    try {
      await this.pgPool.query(
        'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      this.logger.log(`User ${id} soft deleted`);
    } catch (error) {
      this.logger.error(`Error deleting user ${id}`, error);
      throw new BadRequestException('Failed to delete user');
    }
  }
}
