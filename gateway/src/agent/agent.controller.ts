import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  Param,
  Res,
  Req,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentResponse, ContextAppendResponse } from '../types';
import type { Request, Response } from 'express';

@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Post('ask')
  async ask(
    @Body()
    body: {
      sessionId: string;
      instruction: string;
      fileHints?: string[];
    },
  ) {
    try {
      const result = await this.agentService.processInstruction(
        body.sessionId,
        body.instruction,
        body.fileHints,
      );
      return result;
    } catch (error) {
      this.logger.error('Agent controller error:', error);
      const errorResponse: AgentResponse = {
        sessionId: body.sessionId,
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        operations: [],
        logs: [],
      };
      return errorResponse;
    }
  }

  @Get('logs/stream/:sessionId')
  streamLogs(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const { history, unsubscribe } = this.agentService.registerLogListener(
      sessionId,
      (event) => {
        try {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        } catch (writeError) {
          this.logger.warn('Failed to write SSE event', writeError as Error);
        }
      },
    );

    for (const event of history) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const keepAlive = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
      try {
        res.end();
      } catch (endError) {
        this.logger.warn('Failed to end SSE stream', endError as Error);
      }
    });
  }

  @Get('history/:sessionId')
  async getHistory(@Param('sessionId') sessionId: string) {
    try {
      const history = await this.agentService.getChatHistory(sessionId);
      return {
        sessionId,
        status: 'success',
        history,
      };
    } catch (error) {
      this.logger.error('Failed to get chat history:', error);
      return {
        sessionId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        history: [],
      };
    }
  }

  @Post('context')
  appendContext(@Body() body: { sessionId: string; content: string }) {
    const result: ContextAppendResponse = this.agentService.appendContextChunk(
      body.sessionId,
      body.content ?? '',
    );
    return result;
  }
}
