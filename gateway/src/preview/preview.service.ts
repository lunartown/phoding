import { Injectable } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
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
      const viteProcess = spawn('npm', ['run', 'dev'], {
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

      // Wait a bit for the server to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

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
}
