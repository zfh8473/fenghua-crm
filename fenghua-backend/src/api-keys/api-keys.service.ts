/**
 * API Keys Service
 *
 * 管理供外部自动化工具（如 n8n）使用的长期 API Key。
 * 安全原则：数据库只存储 SHA-256 哈希，明文 Key 仅在创建时返回一次。
 *
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';

@Injectable()
export class ApiKeysService implements OnModuleInit {
  private readonly logger = new Logger(ApiKeysService.name);
  private pgPool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (dbUrl) {
      this.pgPool = new Pool({ connectionString: dbUrl });
      this.logger.log('PostgreSQL connection pool initialized for ApiKeysService');
    }
  }

  // ─── 生成 & 哈希 ────────────────────────────────────────────────────────────

  private generatePlainKey(): string {
    const random = crypto.randomBytes(24).toString('hex'); // 48 hex chars
    return `fh_live_${random}`;
  }

  private hashKey(plainKey: string): string {
    return crypto.createHash('sha256').update(plainKey).digest('hex');
  }

  private getPrefix(plainKey: string): string {
    return plainKey.substring(0, 16); // "fh_live_" + 8 chars
  }

  // ─── 验证 Key（Guard 调用）───────────────────────────────────────────────────

  /**
   * 验证 API Key 并返回关联的用户 ID。
   * 同时更新 last_used_at。
   */
  async validateKey(plainKey: string): Promise<{ userId: string; keyId: string; keyName: string } | null> {
    if (!this.pgPool || !plainKey?.startsWith('fh_live_')) return null;

    const hash = this.hashKey(plainKey);
    try {
      const result = await this.pgPool.query(
        `SELECT id, user_id, name
         FROM api_keys
         WHERE key_hash = $1
           AND is_active = TRUE
           AND deleted_at IS NULL`,
        [hash],
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      // 异步更新 last_used_at，不阻塞请求
      this.pgPool
        .query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [row.id])
        .catch((err) => this.logger.warn('Failed to update last_used_at', err));

      return { userId: row.user_id, keyId: row.id, keyName: row.name };
    } catch (err) {
      this.logger.error('Failed to validate API key', err);
      return null;
    }
  }

  // ─── 用户查询（Guard 调用）──────────────────────────────────────────────────

  /**
   * 根据用户 ID 查询完整用户信息（供 Guard 构造 request.user）。
   * 与 AuthService.validateToken 返回形状一致。
   */
  async findUserById(userId: string): Promise<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string | null;
    roles: string[];
  } | null> {
    if (!this.pgPool) return null;
    try {
      const result = await this.pgPool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name,
                COALESCE(
                  json_agg(json_build_object('role_name', r.name))
                  FILTER (WHERE r.id IS NOT NULL),
                  '[]'::json
                ) as roles
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         WHERE u.id = $1 AND u.deleted_at IS NULL
         GROUP BY u.id, u.email, u.first_name, u.last_name
         LIMIT 1`,
        [userId],
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      const roleNames: string[] = (row.roles || [])
        .map((r: { role_name: string }) => r.role_name)
        .filter(Boolean);
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name || undefined,
        lastName: row.last_name || undefined,
        role: roleNames[0] || null,
        roles: roleNames,
      };
    } catch (err) {
      this.logger.error('Failed to find user by id', err);
      return null;
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(
    dto: CreateApiKeyDto,
    createdByUserId: string,
  ): Promise<ApiKeyResponseDto> {
    if (!this.pgPool) throw new Error('数据库连接未初始化');

    const plainKey = this.generatePlainKey();
    const keyHash = this.hashKey(plainKey);
    const keyPrefix = this.getPrefix(plainKey);
    const targetUserId = dto.userId || createdByUserId;

    const result = await this.pgPool.query(
      `INSERT INTO api_keys (name, key_hash, key_prefix, user_id, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, key_prefix, user_id, is_active, last_used_at, created_at`,
      [dto.name, keyHash, keyPrefix, targetUserId, createdByUserId],
    );

    const row = result.rows[0];
    this.logger.log(`API Key created: "${dto.name}" (prefix: ${keyPrefix}) by user ${createdByUserId}`);

    return {
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      plainKey, // 仅此一次
      userId: row.user_id,
      isActive: row.is_active,
      lastUsedAt: null,
      createdAt: row.created_at,
    };
  }

  async findAll(requestingUserId: string, isAdmin: boolean): Promise<ApiKeyResponseDto[]> {
    if (!this.pgPool) throw new Error('数据库连接未初始化');

    // Admin 可看所有 Key；普通用户只能看自己的
    const query = isAdmin
      ? `SELECT ak.id, ak.name, ak.key_prefix, ak.user_id, ak.is_active,
                ak.last_used_at, ak.created_at,
                u.email as user_email, cb.email as created_by_email
         FROM api_keys ak
         LEFT JOIN users u ON u.id = ak.user_id
         LEFT JOIN users cb ON cb.id = ak.created_by
         WHERE ak.deleted_at IS NULL
         ORDER BY ak.created_at DESC`
      : `SELECT ak.id, ak.name, ak.key_prefix, ak.user_id, ak.is_active,
                ak.last_used_at, ak.created_at,
                u.email as user_email, cb.email as created_by_email
         FROM api_keys ak
         LEFT JOIN users u ON u.id = ak.user_id
         LEFT JOIN users cb ON cb.id = ak.created_by
         WHERE ak.deleted_at IS NULL AND ak.user_id = $1
         ORDER BY ak.created_at DESC`;

    const params = isAdmin ? [] : [requestingUserId];
    const result = await this.pgPool.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      userId: row.user_id,
      userEmail: row.user_email,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
      createdByEmail: row.created_by_email,
    }));
  }

  async revoke(id: string, requestingUserId: string, isAdmin: boolean): Promise<void> {
    if (!this.pgPool) throw new Error('数据库连接未初始化');

    const existing = await this.pgPool.query(
      'SELECT user_id FROM api_keys WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );

    if (existing.rows.length === 0) throw new NotFoundException('API Key 不存在');

    // 只有 Admin 或 Key 所有者可以撤销
    if (!isAdmin && existing.rows[0].user_id !== requestingUserId) {
      throw new ForbiddenException('无权撤销此 API Key');
    }

    await this.pgPool.query(
      'UPDATE api_keys SET is_active = FALSE, deleted_at = NOW() WHERE id = $1',
      [id],
    );

    this.logger.log(`API Key ${id} revoked by user ${requestingUserId}`);
  }
}
