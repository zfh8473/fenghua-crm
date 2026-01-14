/**
 * HTTPS Redirect Middleware Unit Tests
 * 
 * All custom code is proprietary and not open source.
 */

import { HttpsRedirectMiddleware } from './https-redirect.middleware';
import { Request, Response, NextFunction } from 'express';

describe('HttpsRedirectMiddleware', () => {
  let middleware: HttpsRedirectMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new HttpsRedirectMiddleware();
    mockNext = jest.fn();
    mockResponse = {
      redirect: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.DEPLOYMENT_PLATFORM;
    delete process.env.VERCEL;
  });

  describe('use', () => {
    it('should be defined', () => {
      expect(middleware).toBeDefined();
    });

    it('should skip redirect in development environment', () => {
      process.env.NODE_ENV = 'development';
      mockRequest = {
        protocol: 'http',
        headers: {},
        hostname: 'localhost',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should skip redirect on Vercel deployment', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'vercel';
      mockRequest = {
        protocol: 'http',
        headers: {},
        hostname: 'localhost',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should skip redirect when VERCEL env var is set', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';
      mockRequest = {
        protocol: 'http',
        headers: {},
        hostname: 'localhost',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should redirect HTTP to HTTPS in production (standalone)', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockRequest = {
        protocol: 'http',
        headers: {
          host: 'example.com',
        },
        hostname: 'example.com',
        url: '/test?param=value',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        301,
        'https://example.com/test?param=value',
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use X-Forwarded-Proto header when present (valid http)', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockRequest = {
        protocol: 'https', // This would be set by reverse proxy
        headers: {
          'x-forwarded-proto': 'http',
          host: 'example.com',
        },
        hostname: 'example.com',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        301,
        'https://example.com/test',
      );
    });

    it('should use X-Forwarded-Proto header when present (valid https)', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockRequest = {
        protocol: 'http',
        headers: {
          'x-forwarded-proto': 'https',
          host: 'example.com',
        },
        hostname: 'example.com',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.redirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should ignore invalid X-Forwarded-Proto header values', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockRequest = {
        protocol: 'http',
        headers: {
          'x-forwarded-proto': 'invalid-value',
          host: 'example.com',
        },
        hostname: 'example.com',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Should use req.protocol (http) and redirect
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        301,
        'https://example.com/test',
      );
    });

    it('should not redirect HTTPS requests', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockRequest = {
        protocol: 'https',
        headers: {
          host: 'example.com',
        },
        hostname: 'example.com',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.redirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use hostname when host header is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockRequest = {
        protocol: 'http',
        headers: {},
        hostname: 'example.com',
        url: '/test',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        301,
        'https://example.com/test',
      );
    });

    it('should preserve query parameters in redirect', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEPLOYMENT_PLATFORM = 'standalone';
      mockRequest = {
        protocol: 'http',
        headers: {
          host: 'example.com',
        },
        hostname: 'example.com',
        url: '/api/users?page=1&limit=10',
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        301,
        'https://example.com/api/users?page=1&limit=10',
      );
    });
  });
});
