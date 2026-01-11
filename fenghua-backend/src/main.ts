import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  // In development, allow all localhost ports for flexibility
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowedOrigins = isDevelopment
    ? [
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:5173',
        'http://localhost:5174',
      ]
    : [process.env.FRONTEND_URL || 'http://localhost:3002'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (isDevelopment) {
        // In development, allow any localhost origin
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
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
  await app.listen(port);
  
  console.log(`fenghua-backend is running on: http://localhost:${port}`);
}

bootstrap();

