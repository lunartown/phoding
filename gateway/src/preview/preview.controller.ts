import { Controller, Post, Body, Get, All, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PreviewService } from './preview.service';
import type { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Controller('preview')
export class PreviewController {
  private proxyMiddleware = createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    pathRewrite: {
      '^/preview/app': '', // /preview/app 경로를 제거하고 프록시
    },
    ws: true, // WebSocket 지원 (Vite HMR용)
  } as any);


  constructor(
    private readonly previewService: PreviewService,
    private readonly configService: ConfigService,
  ) {}

  @Post('start')
  async start(@Body() body: { sessionId: string }, @Req() req: Request) {
    const result = await this.previewService.startPreview(body.sessionId);

    // PUBLIC_GATEWAY_URL 환경변수 기반으로 프리뷰 URL 생성
    let baseUrl = this.configService.get<string>('PUBLIC_GATEWAY_URL');
    if (!baseUrl) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
      const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
      baseUrl = `${proto}://${host}`;
    }

    if (result.status === 'running' || result.status === 'starting') {
      // 별도의 프리뷰 공개 URL이 지정된 경우(예: Vite에 대한 별도 ngrok)
      const externalPreview = this.configService.get<string>('PUBLIC_VITE_URL');
      const urlBase = externalPreview && externalPreview.startsWith('http') ? externalPreview : baseUrl;
      return {
        ...result,
        previewUrl: `${urlBase.replace(/\/$/, '')}/?ngrok-skip-browser-warning=true`,
      };
    }

    return result;
  }

  @Post('stop')
  async stop(@Body() body: { sessionId: string }) {
    return this.previewService.stopPreview(body.sessionId);
  }

  // 프록시는 전역 미들웨어로 이동 (main.ts)

  // 루트 경로 자원 프록시는 별도 컨트롤러에서 처리

  // Frontend proxy for mobile access
  private frontendProxyMiddleware = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/frontend': '',
    },
    ws: true,
  } as any);

  @All('frontend/*')
  proxyToFrontend(@Req() req: Request, @Res() res: Response) {
    this.frontendProxyMiddleware(req, res, (err) => {
      if (err) {
        res.status(500).send('Frontend Proxy Error');
      }
    });
  }

  @Get('frontend')
  proxyToFrontendRoot(@Req() req: Request, @Res() res: Response) {
    this.frontendProxyMiddleware(req, res, (err) => {
      if (err) {
        res.status(500).send('Frontend Proxy Error');
      }
    });
  }
}
