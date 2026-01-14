/**
 * Security Module
 * 
 * Provides security-related middleware and interceptors:
 * - HTTPS redirect middleware
 * - Security headers interceptor (HSTS, etc.)
 * 
 * All custom code is proprietary and not open source.
 */

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpsRedirectMiddleware } from './middleware/https-redirect.middleware';
import { SecurityHeadersInterceptor } from './interceptors/security-headers.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityHeadersInterceptor,
    },
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpsRedirectMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
