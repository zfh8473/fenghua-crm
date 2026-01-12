import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../dto/create-user.dto';

/**
 * Director or Admin Guard
 * Ensures only directors or administrators can access protected routes
 */
@Injectable()
export class DirectorOrAdminGuard implements CanActivate {
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
      
      // Normalize role to uppercase for comparison
      const normalizedRole = user.role?.toUpperCase();
      const isAdmin = normalizedRole === UserRole.ADMIN;
      const isDirector = normalizedRole === UserRole.DIRECTOR;
      
      if (!isAdmin && !isDirector) {
        throw new ForbiddenException('Only directors or administrators can access this resource');
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

