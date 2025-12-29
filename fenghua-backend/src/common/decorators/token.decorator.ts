/**
 * Token Decorator
 * Extracts JWT token from Authorization header
 * All custom code is proprietary and not open source.
 */

import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorator to extract JWT token from Authorization header
 * 
 * @example
 * ```typescript
 * @Get()
 * async findAll(@Token() token: string): Promise<UserResponseDto[]> {
 *   return this.usersService.findAll(token);
 * }
 * ```
 */
export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return token;
  },
);

