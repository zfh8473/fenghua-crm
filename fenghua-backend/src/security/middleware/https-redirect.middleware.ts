/**
 * HTTPS Redirect Middleware
 * 
 * Redirects HTTP requests to HTTPS in production environment.
 * Vercel deployments handle this automatically at CDN level.
 * 
 * All custom code is proprietary and not open source.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  /**
   * Middleware to redirect HTTP requests to HTTPS in production
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns void (calls next() or res.redirect())
   */
  use(req: Request, res: Response, next: NextFunction) {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const deploymentPlatform = process.env.DEPLOYMENT_PLATFORM || 'standalone';
    const isVercel = deploymentPlatform === 'vercel' || process.env.VERCEL === '1';
    
    // Skip redirect in development or if Vercel handles it
    if (isDevelopment || isVercel) {
      return next();
    }
    
    // Check if request is HTTP (not HTTPS)
    // In production behind reverse proxy, check X-Forwarded-Proto header
    // Validate X-Forwarded-Proto header value to prevent header injection attacks
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = (forwardedProto === 'http' || forwardedProto === 'https')
      ? forwardedProto
      : req.protocol;
    
    if (protocol === 'http') {
      // Redirect to HTTPS
      const host = req.headers.host || req.hostname;
      const url = req.url;
      const httpsUrl = `https://${host}${url}`;
      
      return res.redirect(301, httpsUrl);
    }
    
    next();
  }
}
