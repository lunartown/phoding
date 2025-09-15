import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createProxyServer } from 'http-proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend (including mobile access)
  app.enableCors({
    origin: true, // Allow all origins for development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
    exposedHeaders: ['ngrok-skip-browser-warning'],
  });

  // HTTP 프리뷰 경로를 전역 미들웨어로 Vite(dev server)로 프록시
  const expressApp = app.getHttpAdapter().getInstance();
  const catchAllFilter = (pathname: string) => {
    if (
      pathname.startsWith('/agent') ||
      pathname.startsWith('/preview') ||
      pathname.startsWith('/frontend')
    ) {
      return false;
    }
    return true;
  };
  // http-proxy-middleware v3 expects a single options object.
  // Use the `filter` option instead of the old (context, options) signature.
  expressApp.use(
    createProxyMiddleware({
      target: 'http://localhost:5173',
      changeOrigin: true,
      ws: true,
      // Only proxy non-API/non-frontend routes to Vite
      filter: catchAllFilter as any,
    } as any),
  );

  // Vite HMR WebSocket 업그레이드 프록시: 서버 upgrade 이벤트에 직접 연결
  const server = app.getHttpServer();
  const wsProxy = createProxyServer({ target: 'http://localhost:5173', ws: true, changeOrigin: true });
  server.on('upgrade', (req: any, socket: any, head: any) => {
    try {
      const url = (req.url as string) || '/';
      if (
        url.startsWith('/agent') ||
        url.startsWith('/preview') ||
        url.startsWith('/frontend')
      ) {
        return;
      }
      wsProxy.ws(req, socket, head);
    } catch {
      try { socket.destroy(); } catch {}
    }
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  console.log(`Gateway server running on http://0.0.0.0:${port}`);
}
bootstrap();
