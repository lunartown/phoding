import { HttpException, HttpStatus } from '@nestjs/common';
import type { AgentResponse } from '../../types';

export class AgentProcessingException extends HttpException {
  constructor(sessionId: string, error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    const payload: AgentResponse = {
      sessionId,
      status: 'error',
      error: message,
      operations: [],
      logs: [],
    };

    super(payload, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
