import { Injectable } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import * as path from 'path';

@Injectable()
export class PreviewService {
  private previewProcesses = new Map<string, ChildProcess>();
  private readonly previewPort = 5173; // Default Vite port

  async startPreview(sessionId: string) {
    try {
      // Check if preview is already running
      if (this.previewProcesses.has(sessionId)) {
        return {
          status: 'running' as const,
        };
      }

      // Start Vite dev server
      const workspacePath = path.join(process.cwd(), '..', 'workspace');
      const viteArgs = ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(this.previewPort), '--strictPort'];
      const viteProcess = spawn('npm', viteArgs, {
        cwd: workspacePath,
        shell: true,
        detached: false,
      });

      this.previewProcesses.set(sessionId, viteProcess);

      // Log output for debugging
      viteProcess.stdout.on('data', (data) => {
        console.log(`[Preview ${sessionId}] ${data}`);
      });

      viteProcess.stderr.on('data', (data) => {
        console.error(`[Preview ${sessionId} Error] ${data}`);
      });

      viteProcess.on('exit', (code) => {
        console.log(`[Preview ${sessionId}] Process exited with code ${code}`);
        this.previewProcesses.delete(sessionId);
      });

      // Wait until Vite responds on the configured port (max ~20s)
      const isReady = await this.waitForViteReady(20000);
      if (!isReady) {
        return {
          status: 'error' as const,
          error: 'Vite dev server did not become ready in time',
        };
      }

      return {
        status: 'starting' as const,
      };
    } catch (error) {
      return {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Failed to start preview',
      };
    }
  }

  async stopPreview(sessionId: string) {
    const process = this.previewProcesses.get(sessionId);
    if (process) {
      process.kill();
      this.previewProcesses.delete(sessionId);
      return { status: 'stopped' };
    }
    return { status: 'not_running' };
  }

  async stopAllPreviews() {
    for (const [sessionId, process] of this.previewProcesses) {
      process.kill();
      this.previewProcesses.delete(sessionId);
    }
  }

  private async waitForViteReady(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const ok = await new Promise<boolean>((resolve) => {
        const req = http.request(
          { method: 'HEAD', host: '127.0.0.1', port: this.previewPort, path: '/' },
          (res) => {
            try { res.resume(); } catch {}
            resolve(true);
          },
        );
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          try { req.destroy(); } catch {}
          resolve(false);
        });
        req.end();
      });
      if (ok) return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  }
}
