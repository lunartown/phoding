import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface JSONOperation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path?: string;
  content?: string;
  oldPath?: string;
  newPath?: string;
}

@Injectable()
export class AgentService {
  private sessions = new Map<string, { lastInstructions: string[] }>();
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    // Anthropic client will be initialized when needed
    // API key validation happens in callClaudeAgent method
  }

  async processInstruction(
    sessionId: string,
    instruction: string,
    fileHints?: string[],
  ) {
    try {
      // Session management
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, { lastInstructions: [] });
      }
      const session = this.sessions.get(sessionId)!;
      session.lastInstructions.push(instruction);
      if (session.lastInstructions.length > 5) {
        session.lastInstructions.shift();
      }

      // Call Claude API
      const operations = await this.callClaudeAgent(
        instruction,
        session.lastInstructions,
        fileHints,
      );

      // Apply operations to workspace
      const logs = await this.applyOperations(operations);

      return {
        sessionId,
        status: 'success' as const,
        operations,
        logs,
      };
    } catch (error) {
      return {
        sessionId,
        status: 'error' as const,
        operations: [],
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async callClaudeAgent(
    instruction: string,
    recentInstructions: string[],
    fileHints?: string[],
  ): Promise<JSONOperation[]> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error(
        'ANTHROPIC_API_KEY is required. Please set your API key in the .env file. Get one from: https://console.anthropic.com/',
      );
    }

    // Initialize Anthropic client with valid API key
    if (!this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
    }

    // Build context
    const workspacePath = path.join(process.cwd(), '..', 'workspace');
    let fileContext = '';

    if (fileHints && fileHints.length > 0) {
      for (const hint of fileHints) {
        try {
          const filePath = path.join(workspacePath, hint);
          if (await fs.pathExists(filePath)) {
            const content = await fs.readFile(filePath, 'utf-8');
            fileContext += `\n\n=== ${hint} ===\n${content}`;
          }
        } catch (e) {
          // Ignore file read errors
        }
      }
    }

    const systemPrompt = `You are a coding assistant that generates JSON operations to modify a Vite + React + TypeScript workspace.

IMPORTANT: You must respond ONLY with valid JSON in this exact format:
[
  {"type": "create", "path": "relative/path", "content": "file content"},
  {"type": "update", "path": "relative/path", "content": "full file content"},
  {"type": "delete", "path": "relative/path"},
  {"type": "rename", "oldPath": "old/path", "newPath": "new/path"}
]

Rules:
1. All paths are relative to workspace root
2. For updates, provide the COMPLETE file content
3. Use proper React + TypeScript syntax
4. Follow modern React patterns (hooks, functional components)
5. Include proper imports and exports
6. Respond ONLY with the JSON array, no explanations or markdown`;

    const userPrompt = `Recent instructions: ${recentInstructions.slice(-3).join(', ')}

Current instruction: ${instruction}

${fileContext ? `File context:${fileContext}` : ''}

Generate JSON operations to fulfill this instruction.`;

    // Retry logic for handling API overload
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          system: systemPrompt,
        });

        const content = response.content[0];
        if (content.type !== 'text') {
          throw new Error('Unexpected response type from Claude');
        }

        // Parse JSON response
        let jsonText = content.text.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```')) {
          const lines = jsonText.split('\n');
          lines.shift(); // Remove first ```
          if (lines[lines.length - 1].includes('```')) {
            lines.pop(); // Remove last ```
          }
          jsonText = lines.join('\n');
        }

        const operations: JSONOperation[] = JSON.parse(jsonText);
        return operations;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Check if this is an overload error that should be retried
        const errorMessage = lastError.message.toLowerCase();
        const isOverloadError = errorMessage.includes('overloaded') ||
                               errorMessage.includes('529') ||
                               errorMessage.includes('rate limit') ||
                               errorMessage.includes('too many requests');

        if (!isOverloadError || attempt === maxRetries) {
          // If it's not an overload error or we've exhausted retries, throw
          break;
        }

        // Exponential backoff: wait 1s, 2s, 4s...
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        console.log(`Claude API 과부하 감지 (시도 ${attempt}/${maxRetries}). ${waitTime}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // If we get here, all retries failed
    throw new Error(
      `Claude API 호출 실패 (${maxRetries}회 시도). 마지막 오류: ${lastError?.message || 'Unknown error'}. 잠시 후 다시 시도해주세요.`
    );
  }


  private async applyOperations(
    operations: JSONOperation[],
  ): Promise<string[]> {
    const logs: string[] = [];
    const workspacePath = path.join(process.cwd(), '..', 'workspace');

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'create':
          case 'update':
            if (op.path && op.content) {
              const filePath = path.join(workspacePath, op.path);
              await fs.ensureDir(path.dirname(filePath));
              await fs.writeFile(filePath, op.content);
              logs.push(`${op.type} ${op.path}`);
            }
            break;
          case 'delete':
            if (op.path) {
              const filePath = path.join(workspacePath, op.path);
              await fs.remove(filePath);
              logs.push(`delete ${op.path}`);
            }
            break;
          case 'rename':
            if (op.oldPath && op.newPath) {
              const oldPath = path.join(workspacePath, op.oldPath);
              const newPath = path.join(workspacePath, op.newPath);
              await fs.move(oldPath, newPath);
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
}