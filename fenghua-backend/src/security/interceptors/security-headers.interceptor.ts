/**
 * Security Headers Interceptor
 * 
 * Adds security headers to all HTTP responses, including:
 * - HSTS (HTTP Strict Transport Security)
 * - Other security headers (CSP, X-Frame-Options, etc.)
 * 
 * All custom code is proprietary and not open source.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const deploymentPlatform = process.env.DEPLOYMENT_PLATFORM || 'standalone';
    const isVercel = deploymentPlatform === 'vercel' || process.env.VERCEL === '1';
    
    // Only add security headers in production
    if (!isDevelopment) {
      // HSTS (HTTP Strict Transport Security)
      const hstsMaxAgeRaw = process.env.HSTS_MAX_AGE || '31536000';
      let hstsMaxAge = parseInt(hstsMaxAgeRaw, 10);
      
      // Validate HSTS max-age value
      if (isNaN(hstsMaxAge) || hstsMaxAge < 0) {
        console.warn(`⚠️  Invalid HSTS_MAX_AGE value: ${hstsMaxAgeRaw}, using default 31536000`);
        hstsMaxAge = 31536000;
      }
      
      const hstsIncludeSubDomains = process.env.HSTS_INCLUDE_SUBDOMAINS === 'true';
      
      let hstsValue = `max-age=${hstsMaxAge}`;
      if (hstsIncludeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      
      // Only add HSTS if not on Vercel (Vercel handles this automatically)
      if (!isVercel) {
        response.setHeader('Strict-Transport-Security', hstsValue);
      }
      
      // Other security headers (if not already set)
      // X-Frame-Options: Prevent clickjacking
      if (!response.getHeader('X-Frame-Options')) {
        response.setHeader('X-Frame-Options', 'DENY');
      }
      
      // X-Content-Type-Options: Prevent MIME type sniffing
      if (!response.getHeader('X-Content-Type-Options')) {
        response.setHeader('X-Content-Type-Options', 'nosniff');
      }
      
      // Referrer-Policy: Control referrer information
      if (!response.getHeader('Referrer-Policy')) {
        response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      }
      
      // Permissions-Policy: Control browser features
      if (!response.getHeader('Permissions-Policy')) {
        response.setHeader(
          'Permissions-Policy',
          'geolocation=(), microphone=(), camera=()'
        );
      }
    }
    
    return next.handle().pipe(
      map((data) => data),
    );
  }
}
