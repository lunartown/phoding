import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { JSONOperation } from '../types';

/**
 * Centralises all workspace file operations to keep the agent service focused on AI orchestration.
 */
@Injectable()
export class WorkspaceService {
  private readonly workspacePath = path.join(process.cwd(), '..', 'workspace');

  getWorkspacePath(): string {
    return this.workspacePath;
  }

  async readFile(relativePath: string): Promise<string | null> {
    try {
      const filePath = path.join(this.workspacePath, relativePath);
      if (await fs.pathExists(filePath)) {
        return await fs.readFile(filePath, 'utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }

  async buildFileContext(fileHints: string[]): Promise<string> {
    let fileContext = '';
    for (const hint of fileHints) {
      const content = await this.readFile(hint);
      if (content !== null) {
        fileContext += `\n\n=== ${hint} ===\n${content}`;
      }
    }
    return fileContext;
  }

  async applyOperations(operations: JSONOperation[]): Promise<string[]> {
    const logs: string[] = [];

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'create':
          case 'update':
            if (op.path && op.content !== undefined) {
              await this.writeFile(op.path, op.content);
              logs.push(`${op.type} ${op.path}`);
            }
            break;
          case 'delete':
            if (op.path) {
              await this.deleteFile(op.path);
              logs.push(`delete ${op.path}`);
            }
            break;
          case 'rename':
            if (op.oldPath && op.newPath) {
              await this.renameFile(op.oldPath, op.newPath);
              logs.push(`rename ${op.oldPath} -> ${op.newPath}`);
            }
            break;
        }
      } catch (error) {
        logs.push(
          `Error applying ${op.type}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return logs;
  }

  private async writeFile(relativePath: string, content: string): Promise<void> {
    const filePath = path.join(this.workspacePath, relativePath);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content);
  }

  private async deleteFile(relativePath: string): Promise<void> {
    const filePath = path.join(this.workspacePath, relativePath);
    await fs.remove(filePath);
  }

  private async renameFile(
    oldRelativePath: string,
    newRelativePath: string,
  ): Promise<void> {
    const oldPath = path.join(this.workspacePath, oldRelativePath);
    const newPath = path.join(this.workspacePath, newRelativePath);
    await fs.move(oldPath, newPath);
  }
}
