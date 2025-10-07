import { Controller, Post, Body, Get, All, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PreviewService } from './preview.service';
import type { Request, Response } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import { PreviewStartResponse } from '../types';

@Controller('preview')
export class PreviewController {
  private proxyMiddleware = createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    pathRewrite: {
      '^/preview/app': '', // /preview/app 경로를 제거하고 프록시
    },
    ws: true, // WebSocket 지원 (Vite HMR용)
  } as Options);

  constructor(
    private readonly previewService: PreviewService,
    private readonly configService: ConfigService,
  ) {}

  @Post('start')
  async start(
    @Body() _body: { sessionId: string },
    @Req() req: Request,
  ): Promise<PreviewStartResponse> {
    const result = await this.previewService.startPreview();

    // PUBLIC_GATEWAY_URL 환경변수 기반으로 프리뷰 URL 생성
    let baseUrl = this.configService.get<string>('PUBLIC_GATEWAY_URL');
    if (!baseUrl) {
      const proto =
        (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
      const host =
        (req.headers['x-forwarded-host'] as string) ||
        req.headers.host ||
        'localhost:3000';
      baseUrl = `${proto}://${host}`;
    }

    if (result.status === 'running' || result.status === 'starting') {
      const externalPreview = this.configService.get<string>('PUBLIC_VITE_URL');
      const rawBase =
        externalPreview && externalPreview.startsWith('http')
          ? externalPreview
          : baseUrl;
      const previewUrl = new URL('/', rawBase);
      if (!externalPreview) {
        previewUrl.searchParams.set('ngrok-skip-browser-warning', 'true');
      }
      previewUrl.searchParams.set('_ts', Date.now().toString());

      return {
        ...result,
        previewUrl: previewUrl.toString(),
      };
    }

    return result;
  }

  @Post('stop')
  stop() {
    return this.previewService.stopPreview();
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
  } as Options);

  @All('frontend/*')
  proxyToFrontend(@Req() req: Request, @Res() res: Response) {
    void this.frontendProxyMiddleware(req, res, (err?: Error) => {
      if (err) {
        res.status(500).send('Frontend Proxy Error');
      }
    });
  }

  @Get('frontend')
  proxyToFrontendRoot(@Req() req: Request, @Res() res: Response) {
    void this.frontendProxyMiddleware(req, res, (err?: Error) => {
      if (err) {
        res.status(500).send('Frontend Proxy Error');
      }
    });
  }
}
