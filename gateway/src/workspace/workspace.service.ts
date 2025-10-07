import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { JSONOperation } from '../types';

/**
 * Centralises all workspace file operations to keep the agent service focused on AI orchestration.
 */
@Injectable()
export class WorkspaceService {
  private readonly workspacePath = path.join(process.cwd(), '..', 'workspace');
  private readonly logger = new Logger(WorkspaceService.name);

  getWorkspacePath(): string {
    return this.workspacePath;
  }

  async readFile(relativePath: string): Promise<string | null> {
    try {
      const filePath = this.resolveWorkspacePath(relativePath);
      if (await fs.pathExists(filePath)) {
        return await fs.readFile(filePath, 'utf-8');
      }
      return null;
    } catch (error) {
      this.logger.debug(
        `Failed to read file context for "${relativePath}": ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return null;
    }
  }

  async buildFileContext(fileHints: string[]): Promise<string> {
    const sections: string[] = [];

    for (const rawHint of fileHints) {
      const hint = rawHint?.trim();
      if (!hint) {
        continue;
      }

      const content = await this.readFile(hint);
      if (content !== null) {
        sections.push(`=== ${hint} ===\n${content}`);
      }
    }

    return sections.join('\n\n');
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

  private resolveWorkspacePath(relativePath: string): string {
    const trimmedPath = relativePath?.trim();
    if (!trimmedPath) {
      throw new Error('Path must not be empty');
    }
    if (trimmedPath.includes('\0')) {
      throw new Error('Path contains null bytes');
    }

    const resolvedPath = path.resolve(this.workspacePath, trimmedPath);
    const relative = path.relative(this.workspacePath, resolvedPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Path escapes workspace root: ${trimmedPath}`);
    }

    return resolvedPath;
  }

  private async writeFile(
    relativePath: string,
    content: string,
  ): Promise<void> {
    const filePath = this.resolveWorkspacePath(relativePath);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  private async deleteFile(relativePath: string): Promise<void> {
    const filePath = this.resolveWorkspacePath(relativePath);
    await fs.remove(filePath);
  }

  private async renameFile(
    oldRelativePath: string,
    newRelativePath: string,
  ): Promise<void> {
    const oldPath = this.resolveWorkspacePath(oldRelativePath);
    const newPath = this.resolveWorkspacePath(newRelativePath);
    await fs.ensureDir(path.dirname(newPath));
    await fs.move(oldPath, newPath);
  }
}
