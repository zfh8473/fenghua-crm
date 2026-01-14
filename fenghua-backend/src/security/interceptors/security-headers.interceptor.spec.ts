/**
 * Security Headers Interceptor Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { SecurityHeadersInterceptor } from './security-headers.interceptor';

describe('SecurityHeadersInterceptor', () => {
  let interceptor: SecurityHeadersInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: any;

  beforeEach(() => {
    // Create mock response object
    mockResponse = {
      setHeader: jest.fn(),
      getHeader: jest.fn().mockReturnValue(null),
    };

    // Create mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    // Create mock call handler
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as any;

    interceptor = new SecurityHeadersInterceptor();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.DEPLOYMENT_PLATFORM;
    delete process.env.VERCEL;
    delete process.env.HSTS_MAX_AGE;
    delete process.env.HSTS_INCLUDE_SUBDOMAINS;
  });

  describe('intercept', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should not add security headers in development environment', () => {
      process.env.NODE_ENV = 'development';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });

    it('should add HSTS header in production (standalone deployment)', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      process.env.HSTS_MAX_AGE = '31536000';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000',
      );
    });

    it('should not add HSTS header on Vercel (handled by Vercel)', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'vercel';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String),
      );
    });

    it('should add HSTS header with includeSubDomains when configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      process.env.HSTS_MAX_AGE = '31536000';
      process.env.HSTS_INCLUDE_SUBDOMAINS = 'true';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    });

    it('should use default HSTS max-age when not configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      delete process.env.HSTS_MAX_AGE;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000',
      );
    });

    it('should handle invalid HSTS_MAX_AGE and use default', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      process.env.HSTS_MAX_AGE = 'invalid';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid HSTS_MAX_AGE value'),
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should add X-Frame-Options header', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should add X-Content-Type-Options header', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
    });

    it('should add Referrer-Policy header', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
    });

    it('should add Permissions-Policy header', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()',
      );
    });

    it('should not override existing headers', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockResponse.getHeader = jest.fn().mockReturnValue('SAMEORIGIN');

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'X-Frame-Options',
        expect.any(String),
      );
    });

    it('should handle negative HSTS_MAX_AGE and use default', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      process.env.HSTS_MAX_AGE = '-100';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000',
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
