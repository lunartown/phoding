export interface Operation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path?: string;
  oldPath?: string;
  newPath?: string;
  content?: string;
  timestamp?: string;
}

export type MessageType = 'user' | 'assistant' | 'error' | 'context' | 'system';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}
