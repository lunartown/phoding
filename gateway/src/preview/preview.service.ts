import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import * as path from 'path';
import { PreviewStartResult, PreviewStopResult } from '../types';

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);
  private viteProcess: ChildProcess | null = null;
  private readonly previewPort = 5173; // Default Vite port

  async startPreview(): Promise<PreviewStartResult> {
    try {
      // Check if preview is already running
      if (this.viteProcess && !this.viteProcess.killed) {
        return {
          status: 'running',
        };
      }

      // Start Vite dev server
      const workspacePath = path.join(process.cwd(), '..', 'workspace');
      const viteArgs = [
        'run',
        'dev',
        '--',
        '--host',
        '127.0.0.1',
        '--port',
        String(this.previewPort),
        '--strictPort',
        '--base',
        '/preview/app/',
      ];
      const viteProcess = spawn('npm', viteArgs, {
        cwd: workspacePath,
        shell: true,
        detached: false,
      });

      this.viteProcess = viteProcess;

      // Log output for debugging
      viteProcess.stdout?.on('data', (data) => {
        this.logger.log(`${data}`);
      });

      viteProcess.stderr?.on('data', (data) => {
        this.logger.error(`${data}`);
      });

      viteProcess.on('exit', (code) => {
        this.logger.log(`Preview process exited with code ${code}`);
        this.viteProcess = null;
      });

      // Wait until Vite responds on the configured port (max ~20s)
      const isReady = await this.waitForViteReady(20000);
      if (!isReady) {
        return {
          status: 'error',
          error: 'Vite dev server did not become ready in time',
        };
      }

      return {
        status: 'starting',
      };
    } catch (error) {
      return {
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Failed to start preview',
      };
    }
  }

  stopPreview(): PreviewStopResult {
    if (this.viteProcess && !this.viteProcess.killed) {
      this.viteProcess.kill();
      this.viteProcess = null;
      return { status: 'stopped' };
    }
    return { status: 'not_running' };
  }

  private async waitForViteReady(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const ok = await new Promise<boolean>((resolve) => {
        const req = http.request(
          {
            method: 'HEAD',
            host: '127.0.0.1',
            port: this.previewPort,
            path: '/',
          },
          (res) => {
            try {
              res.resume();
            } catch (resumeError) {
              this.logger.error('Failed to resume response:', resumeError);
            }
            resolve(true);
          },
        );
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          try {
            req.destroy();
          } catch (destroyError) {
            this.logger.error('Failed to destroy request:', destroyError);
          }
          resolve(false);
        });
        req.end();
      });
      if (ok) return true;
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
    }
    return false;
  }
}
