import { Controller, Post, Body, Logger, Get, Param } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentResponse, ContextAppendResponse } from '../types';

@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Post('ask')
  async ask(@Body() body: {
    sessionId: string;
    instruction: string;
    fileHints?: string[];
  }) {
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
