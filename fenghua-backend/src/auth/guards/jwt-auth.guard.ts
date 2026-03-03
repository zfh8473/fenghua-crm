/**
 * JWT Authentication Guard
 *
 * 支持两种认证方式：
 *   1. Bearer JWT（标准用户登录）
 *   2. X-API-Key 头（供 n8n 等外部自动化工具使用）
 *
 * API Key 验证成功后，Guard 会为对应用户生成一个 5 分钟的短期 JWT，
 * 写入 request.headers.authorization，使下游 Service 无需任何改动即可正常工作。
 *
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ModuleRef } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  // 懒加载，避免与 ApiKeysModule 产生循环依赖
  private apiKeysService: ApiKeysService | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    try {
      // strict: false = 在所有已加载模块中查找
      this.apiKeysService = this.moduleRef.get(ApiKeysService, { strict: false });
    } catch {
      // ApiKeysModule 未加载时安全降级（如单元测试环境）
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // ── 优先检查 X-API-Key 头 ──────────────────────────────────────────────
    const apiKey = request.headers['x-api-key'];
    if (apiKey && this.apiKeysService) {
      const keyInfo = await this.apiKeysService.validateKey(apiKey);
      if (!keyInfo) {
        throw new UnauthorizedException('Invalid or inactive API key');
      }
      const user = await this.apiKeysService.findUserById(keyInfo.userId);
      if (!user) {
        throw new UnauthorizedException('API key user not found');
      }

      // 生成短期 JWT，让下游 Service（如 validateToken）透明工作
      const shortToken = this.jwtService.sign(
        { sub: user.id, email: user.email, roles: user.roles },
        { expiresIn: '5m' },
      );
      request.headers['authorization'] = `Bearer ${shortToken}`;
      request.user = { ...user, token: shortToken, apiKeyId: keyInfo.keyId, apiKeyName: keyInfo.keyName };
      return true;
    }

    // ── 回退到 Bearer JWT ──────────────────────────────────────────────────
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const user = await this.authService.validateToken(token);
      request.user = user;
      request.user.token = token;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
