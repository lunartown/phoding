import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  query,
  SDKMessage,
  SDKResultMessage,
} from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  AgentResponse,
  ContextAppendResponse,
  JSONOperation,
  SessionData,
} from '../types';
import { WorkspaceService } from '../workspace/workspace.service';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly instructionHistoryLimit = 5;
  private readonly sessions = new Map<string, SessionData>();
  private readonly systemPrompt = `You are a coding assistant that generates JSON operations to modify a Vite + React + TypeScript workspace.

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
6. Respond ONLY with the JSON array, no explanations or markdown
7. If any single file would exceed ~6000 characters, refactor into smaller modules or multiple operations while keeping each JSON entry self-contained
8. Never split a single file's contents across multiple operations—each create/update must include the full file content

If you absolutely must send a natural-language reply instead of JSON (for example, when you need more information), respond in Korean.`;

  constructor(
    private readonly configService: ConfigService,
    private readonly workspaceService: WorkspaceService,
    private readonly prisma: PrismaService,
  ) {}

  appendContextChunk(sessionId: string, chunk: string): ContextAppendResponse {
    const session = this.ensureSession(sessionId);
    const trimmedChunk = chunk?.trim() ?? '';

    if (!trimmedChunk) {
      return {
        sessionId,
        status: 'error',
        pendingChunkCount: session.pendingContextChunks.length,
        message: 'Context chunk must not be empty.',
      };
    }

    session.pendingContextChunks.push(chunk);

    return {
      sessionId,
      status: 'success',
      pendingChunkCount: session.pendingContextChunks.length,
    };
  }

  async processInstruction(
    sessionId: string,
    instruction: string,
    fileHints?: string[],
  ): Promise<AgentResponse> {
    try {
      const session = this.ensureSession(sessionId);

      if (!session.hasLoadedHistory) {
        if (session.instructionHistory.length === 0) {
          try {
            const recentLogs = await this.prisma.chatLog.findMany({
              where: { sessionId },
              orderBy: { createdAt: 'desc' },
              take: this.instructionHistoryLimit,
              select: {
                instruction: true,
              },
            });

            session.instructionHistory = recentLogs
              .map((log) => log.instruction)
              .filter((instruction): instruction is string => Boolean(instruction))
              .reverse();
          } catch (historyError) {
            this.logger.error(
              'Failed to load session history from database',
              historyError,
            );
          }
        }

        session.hasLoadedHistory = true;
      }
      const stagedContext = session.pendingContextChunks.join('\n\n');
      const recentInstructions = session.instructionHistory.slice(
        -this.instructionHistoryLimit,
      );

      const { operations, claudeSessionId, message } = await this.callClaudeAgent({
        instruction,
        recentInstructions,
        stagedContext,
        fileHints,
        existingSessionId: session.claudeSessionId,
      });

      session.pendingContextChunks = [];
      session.claudeSessionId = claudeSessionId;
      session.instructionHistory.push(instruction);
      while (session.instructionHistory.length > this.instructionHistoryLimit) {
        session.instructionHistory.shift();
      }

      let logs: string[] = [];
      if (operations.length > 0) {
        logs = await this.workspaceService.applyOperations(operations);
      }

      if (message && operations.length === 0) {
        logs = [...logs, message];
      }

      // 채팅 로그 저장
      await this.saveChatLog({
        sessionId,
        instruction,
        operations,
        logs,
        status: 'success',
      });

      return {
        sessionId,
        status: 'success' as const,
        operations,
        logs,
        message,
      };
    } catch (error) {
      this.logger.error('Agent processing error', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // 에러도 채팅 로그에 저장
      await this.saveChatLog({
        sessionId,
        instruction,
        operations: [],
        logs: [],
        status: 'error',
        error: errorMessage,
      });

      return {
        sessionId,
        status: 'error' as const,
        operations: [],
        logs: [],
        error: errorMessage,
      };
    }
  }

  private async callClaudeAgent({
    instruction,
    recentInstructions,
    stagedContext,
    fileHints,
    existingSessionId,
  }: {
    instruction: string;
    recentInstructions: string[];
    stagedContext: string;
    fileHints?: string[];
    existingSessionId?: string;
  }): Promise<{
    operations: JSONOperation[];
    claudeSessionId: string;
    message?: string;
  }> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error(
        'ANTHROPIC_API_KEY is required. Please set your API key in the .env file. Get one from: https://console.anthropic.com/',
      );
    }

    const fileContext =
      fileHints && fileHints.length > 0
        ? await this.workspaceService.buildFileContext(fileHints)
        : '';

    const promptSections: string[] = [];

    if (stagedContext) {
      promptSections.push(`Staged context:\n${stagedContext}`);
    }

    if (recentInstructions.length > 0) {
      const formattedHistory = recentInstructions
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n');
      promptSections.push(`Recent instructions:\n${formattedHistory}`);
    }

    promptSections.push(`Current instruction:\n${instruction}`);

    if (fileContext) {
      promptSections.push(`File context:\n${fileContext}`);
    }

    promptSections.push(
      'Generate JSON operations to fulfill this instruction.',
    );

    const userPrompt = promptSections.join('\n\n');

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const iterator = query({
          prompt: userPrompt,
          options: {
            resume: existingSessionId,
            systemPrompt: this.systemPrompt,
            settingSources: [],
          },
        });

        let resultMessage: SDKResultMessage | null = null;
        let latestSessionId = existingSessionId ?? null;

        for await (const message of iterator) {
          latestSessionId = this.updateSessionId(latestSessionId, message);

          if (message.type === 'result') {
            if (message.subtype === 'success') {
              resultMessage = message;
            } else {
              throw new Error(
                `Claude session ended unexpectedly (${message.subtype}).`,
              );
            }
          }
        }

        if (!resultMessage) {
          throw new Error('Claude SDK did not return a success result.');
        }

        if (!latestSessionId) {
          throw new Error('Claude SDK did not provide a session id.');
        }

        const parsed = await this.parseOperationsFromText(resultMessage.result);

        if (parsed.success) {
          return {
            operations: parsed.operations,
            claudeSessionId: latestSessionId,
          };
        }

        return {
          operations: [],
          claudeSessionId: latestSessionId,
          message: parsed.rawText,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        const errorMessage = lastError.message.toLowerCase();
        const isOverloadError =
          errorMessage.includes('overloaded') ||
          errorMessage.includes('529') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('too many requests');

        if (!isOverloadError || attempt === maxRetries) {
          break;
        }

        const waitTime = Math.pow(2, attempt - 1) * 1000;
        this.logger.warn(
          `Claude API 과부하 감지 (시도 ${attempt}/${maxRetries}). ${waitTime}ms 후 재시도...`,
        );
        await new Promise<void>((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw new Error(
      `Claude API 호출 실패 (${maxRetries}회 시도). 마지막 오류: ${lastError?.message || 'Unknown error'}. 잠시 후 다시 시도해주세요.`,
    );
  }

  private async parseOperationsFromText(rawText: string): Promise<
    | {
        success: true;
        operations: JSONOperation[];
      }
    | {
        success: false;
        error: Error;
        rawText: string;
      }
  > {
    const jsonText = this.stripCodeFence(rawText.trim());

    const attemptParse = (text: string): JSONOperation[] | null => {
      try {
        return JSON.parse(text) as JSONOperation[];
      } catch {
        return null;
      }
    };

    const directParse = attemptParse(jsonText);
    if (directParse) {
      return { success: true, operations: directParse };
    }

    const arrayText = this.extractJsonArray(jsonText);
    if (arrayText) {
      const arrayParse = attemptParse(arrayText);
      if (arrayParse) {
        this.logger.warn(
          'Claude 응답에 여분의 텍스트가 포함되어 JSON 배열만 추출하여 처리했습니다.',
        );
        return {
          success: true,
          operations: arrayParse,
        };
      }
    }

    const parseError = new SyntaxError(
      '응답에서 JSON 배열을 파싱할 수 없습니다.',
    );
    const maxLogLength = 4000;
    const preview =
      jsonText.length > maxLogLength
        ? `${jsonText.slice(0, maxLogLength)}... [truncated]`
        : jsonText;
    this.logger.error('Claude JSON parse error:', parseError);
    this.logger.error('Raw response preview:', preview);
    const logDir = path.join(process.cwd(), 'logs', 'claude');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logDir, `raw-${timestamp}.json`);
    try {
      await fs.ensureDir(logDir);
      await fs.writeFile(logPath, jsonText, 'utf-8');
      this.logger.error(`Full raw response saved to ${logPath}`);
    } catch (logError) {
      this.logger.error('Failed to persist raw response:', logError);
    }

    return { success: false, error: parseError, rawText };
  }

  private ensureSession(sessionId: string): SessionData {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        instructionHistory: [],
        pendingContextChunks: [],
        hasLoadedHistory: false,
      };
      this.sessions.set(sessionId, session);
    } else if (typeof session.hasLoadedHistory !== 'boolean') {
      session.hasLoadedHistory = false;
    }

    return session;
  }

  private updateSessionId(
    currentSessionId: string | null,
    message: SDKMessage,
  ): string | null {
    if (message.session_id) {
      return message.session_id;
    }

    return currentSessionId;
  }

  private stripCodeFence(text: string): string {
    if (!text.startsWith('```')) {
      return text;
    }

    const lines = text.split('\n');
    lines.shift();
    if (lines.length && lines[lines.length - 1].includes('```')) {
      lines.pop();
    }
    return lines.join('\n');
  }

  private extractJsonArray(text: string): string | null {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    return text.slice(start, end + 1);
  }

  async getChatHistory(sessionId: string) {
    try {
      const logs = await this.prisma.chatLog.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          instruction: true,
          operations: true,
          logs: true,
          status: true,
          error: true,
          createdAt: true,
        },
      });

      return logs;
    } catch (err) {
      this.logger.error('Failed to get chat history from database', err);
      throw err;
    }
  }

  private async saveChatLog({
    sessionId,
    instruction,
    operations,
    logs,
    status,
    error,
  }: {
    sessionId: string;
    instruction: string;
    operations: JSONOperation[];
    logs: string[];
    status: 'success' | 'error';
    error?: string;
  }): Promise<void> {
    try {
      await this.prisma.chatLog.create({
        data: {
          sessionId,
          instruction,
          operations: operations as unknown as Prisma.InputJsonValue,
          logs,
          status,
          error,
        },
      });
    } catch (err) {
      this.logger.error('Failed to save chat log to database', err);
    }
  }
}
