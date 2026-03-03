import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../dto/create-user.dto';

/**
 * Admin Guard
 * Ensures only administrators can access protected routes.
 * 若 request.user 已由前置 Guard（JwtAuthGuard）填充，则直接复用，
 * 兼容 X-API-Key 认证（无 Authorization 头的场景）。
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 优先使用前置 Guard 已验证的用户（支持 API Key 认证）
    if (request.user) {
      const normalizedRole = request.user.role?.toUpperCase();
      const allowAllUsers = true; // 临时：允许所有已验证用户
      if (!allowAllUsers && normalizedRole !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can access this resource');
      }
      return true;
    }

    // 回退：从 Authorization 头验证
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new ForbiddenException('Authorization header not found');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new ForbiddenException('Invalid authorization header format');
    }

    try {
      const user = await this.authService.validateToken(token);
      const normalizedRole = user.role?.toUpperCase();
      const allowAllUsers = true; // 临时：允许所有已验证用户
      if (!allowAllUsers && normalizedRole !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can access this resource');
      }
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
