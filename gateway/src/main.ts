import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createProxyServer } from 'http-proxy';
import type { Application, NextFunction, Request, Response } from 'express';
import type { Duplex } from 'stream';
import type { IncomingMessage, Server } from 'http';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS for frontend (including mobile access)
  app.enableCors({
    origin: true, // Allow all origins for development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: [],
  });

  const expressApp = app.getHttpAdapter().getInstance() as Application;
  const httpProxy = createProxyServer({
    target: 'http://127.0.0.1:5173',
    changeOrigin: true,
  });

  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.url || '/';
      const method = req.method?.toUpperCase();
      if (
        url.startsWith('/agent') ||
        url.startsWith('/preview') ||
        url.startsWith('/frontend') ||
        (method !== 'GET' && method !== 'HEAD')
      ) {
        return next();
      }

      httpProxy.web(req, res, {}, (proxyError) => {
        logger.error('HTTP preview proxy error', proxyError);
        if (!res.headersSent) {
          res.statusCode = 502;
        }
        res.end('Proxy Error');
      });
    } catch (error) {
      logger.error('Proxy middleware error', error as Error);
      return next();
    }
  });

  const server = app.getHttpServer() as Server;
  const wsProxy = createProxyServer({
    target: 'http://127.0.0.1:5173',
    ws: true,
    changeOrigin: true,
  });

  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    try {
      const url = req.url || '/';
      if (
        url.startsWith('/agent') ||
        url.startsWith('/preview') ||
        url.startsWith('/frontend')
      ) {
        return;
      }
      wsProxy.ws(req, socket, head);
    } catch (error) {
      logger.error('WebSocket proxy error', error as Error);
      try {
        socket.destroy();
      } catch (destroyError) {
        logger.error('Failed to destroy socket', destroyError as Error);
      }
    }
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  logger.log(`Gateway server running on http://0.0.0.0:${port}`);
}
void bootstrap();
