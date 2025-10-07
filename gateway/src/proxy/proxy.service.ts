import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { createProxyServer } from 'http-proxy';
import type { Application, NextFunction, Request, Response } from 'express';
import type { IncomingMessage, Server } from 'http';
import type { Duplex } from 'stream';

@Injectable()
export class ProxyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProxyService.name);
  private readonly httpProxy = createProxyServer({
    target: 'http://localhost:5173',
    changeOrigin: true,
  });
  private readonly wsProxy = createProxyServer({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
  });

  private upgradeHandler?: (
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => void;

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  onModuleInit(): void {
    const httpAdapter = this.adapterHost.httpAdapter;
    if (!httpAdapter) {
      this.logger.warn(
        'HTTP adapter is not available; proxy middleware skipped.',
      );
      return;
    }

    const maybeApp: unknown = httpAdapter.getInstance?.();
    if (!this.isExpressApplication(maybeApp)) {
      this.logger.warn('Express application instance is not available.');
      return;
    }

    const app = maybeApp;
    this.registerHttpProxy(app);

    const maybeServer: unknown = httpAdapter.getHttpServer?.();
    if (!this.isHttpServer(maybeServer)) {
      this.logger.warn(
        'HTTP server is not available; websocket proxy skipped.',
      );
      return;
    }

    this.upgradeHandler = this.createUpgradeHandler();
    const server = maybeServer;
    server.on('upgrade', this.upgradeHandler);
  }

  onModuleDestroy(): void {
    const httpAdapter = this.adapterHost.httpAdapter;
    if (!httpAdapter || !this.upgradeHandler) {
      return;
    }
    const maybeServer: unknown = httpAdapter.getHttpServer?.();
    if (this.isHttpServer(maybeServer)) {
      const server = maybeServer;
      server.off('upgrade', this.upgradeHandler);
    }
  }

  private registerHttpProxy(app: Application): void {
    app.use((req: Request, res: Response, next: NextFunction) => {
      try {
        const url = req.url || '/';
        if (this.isAgentOrPreviewRoute(url) || !this.isSafeMethod(req.method)) {
          return next();
        }

        this.httpProxy.web(req, res, {}, (proxyError: Error) => {
          const normalised = this.toError(proxyError);
          this.logger.error(
            `Proxy request failed: ${normalised.message}`,
            normalised.stack,
          );
          try {
            res.statusCode = 502;
            res.end('Proxy Error');
          } catch (responseError) {
            const fallback = this.toError(responseError);
            this.logger.error(
              `Failed to respond after proxy failure: ${fallback.message}`,
              fallback.stack,
            );
          }
        });
      } catch (error) {
        const normalised = this.toError(error);
        this.logger.error(
          `Proxy middleware error: ${normalised.message}`,
          normalised.stack,
        );
        return next();
      }
    });
  }

  private createUpgradeHandler() {
    return (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      try {
        const url = req.url || '/';
        if (this.isAgentOrPreviewRoute(url)) {
          return;
        }

        this.wsProxy.ws(req, socket, head);
      } catch (error) {
        const normalised = this.toError(error);
        this.logger.error(
          `WebSocket upgrade error: ${normalised.message}`,
          normalised.stack,
        );
        try {
          socket.destroy();
        } catch (destroyError) {
          const fallback = this.toError(destroyError);
          this.logger.error(
            `Failed to destroy socket after proxy error: ${fallback.message}`,
            fallback.stack,
          );
        }
      }
    };
  }

  private isAgentOrPreviewRoute(url: string): boolean {
    return (
      url.startsWith('/agent') ||
      url.startsWith('/preview') ||
      url.startsWith('/frontend')
    );
  }

  private isSafeMethod(method: string | undefined): boolean {
    const normalized = method?.toUpperCase();
    return normalized === 'GET' || normalized === 'HEAD';
  }

  private isExpressApplication(value: unknown): value is Application {
    if (!value || (typeof value !== 'function' && typeof value !== 'object')) {
      return false;
    }
    return typeof (value as Application).use === 'function';
  }

  private isHttpServer(value: unknown): value is Server {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Server;
    return (
      typeof candidate.on === 'function' && typeof candidate.off === 'function'
    );
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error('Unknown proxy error');
    }
  }
}
