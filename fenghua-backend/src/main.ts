import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  // Detect deployment platform
  const deploymentPlatform = process.env.DEPLOYMENT_PLATFORM || 'standalone';
  const isVercel = deploymentPlatform === 'vercel' || process.env.VERCEL === '1';
  
  // HTTPS configuration (only for standalone deployment)
  let httpsOptions: https.ServerOptions | undefined;
  
  if (!isVercel) {
    // Standalone deployment: configure HTTPS if enabled
    const httpsEnabled = process.env.HTTPS_ENABLED === 'true';
    const sslCertPath = process.env.SSL_CERT_PATH;
    const sslKeyPath = process.env.SSL_KEY_PATH;
    
    if (httpsEnabled && sslCertPath && sslKeyPath) {
      try {
        // Validate certificate files exist
        if (!fs.existsSync(sslCertPath)) {
          throw new Error(`SSL certificate file not found: ${sslCertPath}`);
        }
        if (!fs.existsSync(sslKeyPath)) {
          throw new Error(`SSL key file not found: ${sslKeyPath}`);
        }
        
        // Check certificate file permissions (security best practice)
        const keyStats = fs.statSync(sslKeyPath);
        const keyMode = (keyStats.mode & parseInt('777', 8)).toString(8);
        if (keyMode !== '600' && keyMode !== '400') {
          console.warn(`⚠️  SSL key file permissions are ${keyMode}, recommended: 600 (read/write for owner only)`);
        }
        
        // Read certificate files
        const cipherSuite = [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-ECDSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-ECDSA-AES256-GCM-SHA384',
          '!aNULL',
          '!eNULL',
          '!EXPORT',
          '!DES',
          '!RC4',
          '!MD5',
          '!PSK',
          '!SRP',
          '!CAMELLIA',
        ].join(':');
        
        httpsOptions = {
          cert: fs.readFileSync(sslCertPath),
          key: fs.readFileSync(sslKeyPath),
          minVersion: 'TLSv1.2', // Minimum TLS 1.2
          ciphers: cipherSuite,
        };
        
        console.log('✅ HTTPS enabled with TLS 1.2+');
        console.log(`   TLS Configuration: minVersion=TLSv1.2, cipherSuite=${cipherSuite.substring(0, 50)}...`);
      } catch (error) {
        console.error('❌ Failed to load SSL certificates:', error instanceof Error ? error.message : String(error));
        throw error;
      }
    } else if (httpsEnabled) {
      console.warn('⚠️  HTTPS_ENABLED=true but SSL certificate paths not configured. Starting without HTTPS.');
    }
  } else {
    console.log('ℹ️  Vercel deployment detected - HTTPS handled by Vercel');
  }
  
  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});
  
  // Configure trust proxy for reverse proxy deployments (Nginx/Apache)
  // Get Express instance and set trust proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);
  
  // Enable CORS for frontend integration
  // In development, allow all localhost ports for flexibility
  // In production, only allow HTTPS origins
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isProduction = !isDevelopment;
  
  const allowedOrigins = isDevelopment
    ? [
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3005',
        'http://localhost:5173',
        'http://localhost:5174',
      ]
    : (() => {
        const raw = process.env.FRONTEND_URL || 'http://localhost:3002';
        const list = raw
          .split(',')
          .map((s) => s.trim().replace(/\/$/, ''))
          .filter(Boolean);
        if (isProduction && list.some((u) => !u.startsWith('https://'))) {
          console.warn(`⚠️  FRONTEND_URL should use HTTPS in production, got: ${raw}`);
        }
        return list.length ? list : ['http://localhost:3002'];
      })();

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (isDevelopment) {
        // In development, allow any localhost origin (HTTP or HTTPS)
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('https://localhost:') || origin.startsWith('https://127.0.0.1:')) {
          return callback(null, true);
        }
      }
      
      // In production, only allow HTTPS origins
      if (isProduction && !origin.startsWith('https://')) {
        return callback(new Error('Only HTTPS origins are allowed in production'));
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Enable validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
      skipMissingProperties: false, // Don't skip missing properties - validate all
      skipNullProperties: false, // Don't skip null properties
      skipUndefinedProperties: true, // Skip undefined properties (after Transform)
      exceptionFactory: (errors) => {
        // Format validation errors for better error messages
        const messages = errors.map((error) => {
          if (error.constraints) {
            return Object.values(error.constraints).join(', ');
          }
          return `${error.property} 验证失败`;
        });
        return new BadRequestException({
          message: messages.length > 0 ? messages.join('; ') : '请求数据验证失败',
          errors: errors,
        });
      },
    }),
  );

  // Add global exception filter for better error logging
  const globalExceptionFilter: ExceptionFilter = {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();
      
      const status = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
      
      const message = exception instanceof HttpException
        ? exception.getResponse()
        : exception.message || 'Internal server error';
      
      // Always log errors to console (will be captured by log file)
      console.error('[Global Exception Filter]', {
        status,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        url: request.url,
        method: request.method,
        body: request.body,
        query: request.query,
        timestamp: new Date().toISOString(),
      });
      
      response.status(status).json({
        statusCode: status,
        message: typeof message === 'string' ? message : (message as any)?.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    },
  };
  
  app.useGlobalFilters(globalExceptionFilter);

  const port = process.env.PORT || 3001;
  
  // For Vercel Serverless Functions, don't call app.listen()
  if (isVercel) {
    // Export the handler for Vercel
    // The app will be initialized on first request
    console.log('fenghua-backend configured for Vercel Serverless Functions');
    return app;
  } else {
    // Standalone deployment: start the server
    await app.listen(port);
    const protocol = httpsOptions ? 'https' : 'http';
    console.log(`fenghua-backend is running on: ${protocol}://localhost:${port}`);
  }
}

// For Vercel Serverless Functions
let appInstance: any = null;

export default async function handler(req: any, res: any) {
  if (!appInstance) {
    appInstance = await bootstrap();
  }
  // 临时：确认 api 传入的 req.url 在进 Express 前是否为 /health（排查 404 后可删）
  console.log('[main] req.url=%s', req?.url);
  const adapter = appInstance.getHttpAdapter();
  return adapter.getInstance()(req, res);
}

// For standalone deployment
if (process.env.DEPLOYMENT_PLATFORM !== 'vercel' && process.env.VERCEL !== '1') {
  bootstrap();
}

