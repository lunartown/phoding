/**
 * JSON operation definitions shared across gateway services.
 */
export interface JSONOperation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path?: string;
  content?: string;
  oldPath?: string;
  newPath?: string;
}

/**
 * Standard response structure returned by the agent service.
 */
export interface AgentResponse {
  sessionId: string;
  status: 'success' | 'error';
  operations: JSONOperation[];
  logs: string[];
  error?: string;
}

export interface ContextAppendResponse {
  sessionId: string;
  status: 'success' | 'error';
  pendingChunkCount: number;
  message?: string;
}

/**
 * Minimal session data persisted per instruction sequence.
 */
export interface SessionData {
  pendingContextChunks: string[];
  instructionHistory: string[];
  claudeSessionId?: string;
}
