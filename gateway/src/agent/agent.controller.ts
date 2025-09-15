import { Controller, Post, Body } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
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
      console.error('Agent controller error:', error);
      return {
        sessionId: body.sessionId,
        status: 'error',
        error: error.message || 'Unknown error occurred',
        operations: [],
        logs: []
      };
    }
  }
}