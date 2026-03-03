/**
 * JWT Authentication Guard
 *
 * 支持两种认证方式：
 *   1. Bearer JWT（标准用户登录）
 *   2. X-API-Key 头（供 n8n 等外部自动化工具使用）
 *
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    @Optional() private readonly apiKeysService?: ApiKeysService,
  ) {}

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
      request.user = { ...user, apiKeyId: keyInfo.keyId, apiKeyName: keyInfo.keyName };
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
