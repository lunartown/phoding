import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createProxyServer } from 'http-proxy';
import type { Request, Response, NextFunction, Application } from 'express';
import type { IncomingMessage, Server } from 'http';
import type { Duplex } from 'stream';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS for frontend (including mobile access)
  app.enableCors({
    origin: true, // Allow all origins for development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
    exposedHeaders: ['ngrok-skip-browser-warning'],
  });

  // HTTP 프리뷰 경로 프록시: http-proxy를 직접 사용해서 API 경로는 확실히 제외
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  const httpProxy = createProxyServer({ target: 'http://localhost:5173', changeOrigin: true });
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    try {
      const url: string = req.url || '/';
      if (
        url.startsWith('/agent') ||
        url.startsWith('/preview') ||
        url.startsWith('/frontend')
      ) {
        return next();
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      httpProxy.web(req, res, {}, (err: Error) => {
        if (err) {
          try {
            res.statusCode = 502;
            res.end('Proxy Error');
          } catch (endError) {
            logger.error('Failed to send proxy error response:', endError);
          }
        }
      });
    } catch (error) {
      logger.error('Proxy middleware error:', error);
      return next();
    }
  });

  // Vite HMR WebSocket 업그레이드 프록시: 서버 upgrade 이벤트에 직접 연결
  const server = app.getHttpServer() as Server;
  const wsProxy = createProxyServer({ target: 'http://localhost:5173', ws: true, changeOrigin: true });
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
      logger.error('WebSocket upgrade error:', error);
      try {
        socket.destroy();
      } catch (destroyError) {
        logger.error('Failed to destroy socket:', destroyError);
      }
    }
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  logger.log(`Gateway server running on http://0.0.0.0:${port}`);
}
void bootstrap();
