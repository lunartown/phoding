export interface AgentLogEvent {
  sessionId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
  timestamp: string;
}
