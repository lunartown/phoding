import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentResponse } from '../types';

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
}
