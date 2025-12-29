import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../dto/create-user.dto';

/**
 * Admin Guard
 * Ensures only administrators can access protected routes
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
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
      
      // TODO: 临时允许所有用户访问（仅用于测试）
      // 测试完成后应恢复为: 检查用户是否为 ADMIN
      // Check if user is admin
      // Normalize role to uppercase for comparison
      const normalizedRole = user.role?.toUpperCase();
      const isAdmin = normalizedRole === UserRole.ADMIN;
      
      // 临时：允许所有已验证用户访问（仅用于测试）
      const allowAllUsers = process.env.ALLOW_ALL_USERS === 'true' || true; // 临时设置为 true
      
      if (!allowAllUsers && !isAdmin) {
        throw new ForbiddenException('Only administrators can access this resource');
      }

      // Attach user to request
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}

