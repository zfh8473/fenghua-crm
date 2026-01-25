/**
 * Authentication Service
 * 
 * Handles user authentication using native database and JWT
 * All custom code is proprietary and not open source.
 */

import { Injectable, Logger, UnauthorizedException, ConflictException, ServiceUnavailableException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

interface RoleInfo {
  role_id: string;
  role_name: string;
}

interface UserWithRoles {
  id: string;
  email: string;
  password_hash: string | null;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  deleted_at: string | null;
  roles: RoleInfo[];
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private pgPool: Pool | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.initializeDatabaseConnection();
  }

  /**
   * Initialize PostgreSQL connection pool
   * Connects to fenghua-crm database (not Twenty CRM database)
   */
  private initializeDatabaseConnection(): void {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    
    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not configured, authentication will fail');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: databaseUrl,
        max: 5,
        connectionTimeoutMillis: 15000, // 跨区域（如 SG↔Virginia）时留足建连时间，避免过早超时
      });
      this.logger.log('PostgreSQL connection pool initialized for AuthService (fenghua-crm database)');
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
        this.logger.log('PostgreSQL connection pool closed for AuthService');
      } catch (error) {
        this.logger.error('Failed to close PostgreSQL connection pool', error);
      }
    }
  }

  /**
   * Authenticate user with email and password
   * Queries users table, verifies password, and generates JWT token
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new UnauthorizedException('Authentication service unavailable');
    }

    try {
      // Query user with roles
      const userQuery = `
        SELECT
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.email_verified,
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
        WHERE LOWER(u.email) = LOWER($1)
          AND u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.password_hash, u.first_name, u.last_name, u.email_verified, u.deleted_at
        LIMIT 1;
      `;

      const userResult = await this.pgPool.query<UserWithRoles>(userQuery, [email]);

      if (userResult.rows.length === 0) {
        // Don't reveal if user exists or not (security best practice)
        throw new UnauthorizedException('Invalid email or password');
      }

      const user = userResult.rows[0];

      // Check if user has a password hash
      if (!user.password_hash) {
        this.logger.warn(`User ${email} has no password hash, password reset required`);
        throw new UnauthorizedException('Password reset required. Please contact administrator.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Update last login time
      await this.pgPool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Get role names
      const roleNames = (user.roles || []).map((r: RoleInfo) => r.role_name).filter(Boolean);
      const primaryRole = roleNames[0] || null; // Return null if no roles assigned

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        roles: roleNames,
      };

      const token = this.jwtService.sign(payload);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name || undefined,
          lastName: user.last_name || undefined,
          role: primaryRole,
        },
      };
    } catch (error) {
      // Log error without sensitive information
      if (error instanceof UnauthorizedException || error instanceof ConflictException) {
        this.logger.warn(`Login failed for email: ${email} - ${error.message}`);
        throw error;
      }
      this.logger.error(`Login failed for email: ${email}`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  /**
   * Validate JWT token
   * Verifies token signature and queries user from database
   */
  async validateToken(token: string): Promise<any> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new UnauthorizedException('Authentication service unavailable');
    }

    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token);

      // Query user from database
      const userQuery = `
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.email_verified,
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
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.email_verified, u.deleted_at
        LIMIT 1;
      `;

      const userResult = await this.pgPool.query<UserWithRoles>(userQuery, [payload.sub]);

      if (userResult.rows.length === 0) {
        throw new UnauthorizedException('User not found');
      }

      const user = userResult.rows[0];
      const roleNames = (user.roles || []).map((r: RoleInfo) => r.role_name).filter(Boolean);
      const primaryRole = roleNames[0] || null; // Return null if no roles assigned

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        role: primaryRole,
        roles: roleNames,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn('Token validation failed', { message: error.message });
        throw error;
      }
      // 区分 DB/网络类错误：跨区域（如 Railway SG → Neon Virginia）超时、连接重置等
      // 返回 503 而非 401，避免前端误判为 token 失效并清空登录态
      const err = error as NodeJS.ErrnoException | undefined;
      const code = err?.code;
      const msg = (err?.message || '').toLowerCase();
      if (
        code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND' ||
        code === 'EPIPE' || code === 'ECONNREFUSED' ||
        /timeout|connection refused|connect econnrefused|connection.*reset/i.test(msg)
      ) {
        this.logger.warn('Token validation failed (DB/network)', { code, message: err?.message });
        throw new ServiceUnavailableException('服务暂时不可用，请稍后重试');
      }
      this.logger.error('Token validation failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Register new user (optional)
   */
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponseDto> {
    if (!this.pgPool) {
      this.logger.error('Database pool not initialized');
      throw new UnauthorizedException('Authentication service unavailable');
    }

    try {
      // Check if user already exists
      const existingUser = await this.pgPool.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        throw new ConflictException('User already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const insertResult = await this.pgPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, email, first_name, last_name, email_verified`,
        [
          data.email.toLowerCase(),
          passwordHash,
          data.firstName || null,
          data.lastName || null,
          false, // Email not verified by default
        ]
      );

      const newUser = insertResult.rows[0];

      // Generate JWT token
      const payload = {
        sub: newUser.id,
        email: newUser.email,
        roles: [], // New users have no roles by default
      };

      const token = this.jwtService.sign(payload);

      return {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name || undefined,
          lastName: newUser.last_name || undefined,
          role: null, // New users have no roles by default
        },
      };
    } catch (error) {
      // Log error without sensitive information (password)
      if (error instanceof ConflictException) {
        this.logger.warn(`Registration failed for email: ${data.email} - ${error.message}`);
        throw error;
      }
      this.logger.error(`Registration failed for email: ${data.email}`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException('Registration failed');
    }
  }

  /**
   * Logout user
   * In JWT-based auth, logout is handled client-side by removing token
   * This method can be used for server-side cleanup if needed
   */
  async logout(token: string): Promise<void> {
    // JWT is stateless, so logout is primarily client-side
    // If token blacklisting is needed, implement it here
    this.logger.log('User logged out');
  }
}
