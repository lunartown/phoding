'use client';

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Message, Operation } from '@/types/chat';
import StreamingLogs from '@/components/StreamingLogs';

interface ChatInputProps {
  sessionId: string;
  onOperationsUpdate: (operations: Operation[]) => void;
  onPreviewUrlUpdate: (url: string) => void;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  gatewayUrl: string | null;
}

export default function ChatInput({
  sessionId,
  onOperationsUpdate,
  onPreviewUrlUpdate,
  messages,
  setMessages,
  gatewayUrl,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileHints, setFileHints] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [isContextSubmitting, setIsContextSubmitting] = useState(false);
  const gatewayWarningLogged = useRef(false);

  const pushMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => [...prev, message]);
    },
    [setMessages],
  );

  const resolveTimestamp = () => new Date();

  const buildGatewayUrl = useCallback(
    (path: string) => {
      if (!gatewayUrl) {
        return null;
      }

      if (gatewayUrl.endsWith('/') && path.startsWith('/')) {
        return `${gatewayUrl.slice(0, -1)}${path}`;
      }

      return `${gatewayUrl}${path}`;
    },
    [gatewayUrl],
  );

  const handleContextSubmit = async () => {
    if (!contextInput.trim() || isContextSubmitting) {
      return;
    }

    const contextUrl = buildGatewayUrl('/agent/context');
    if (!contextUrl) {
      if (!gatewayWarningLogged.current) {
        console.warn('[ChatInput] Gateway URL is not ready, context skipped.');
        gatewayWarningLogged.current = true;
      }
      pushMessage({
        id: Math.random().toString(36),
        type: 'error',
        content: 'Gateway URL을 확인할 수 없습니다.',
        timestamp: resolveTimestamp(),
      });
      return;
    }

    const contextMessage: Message = {
      id: Math.random().toString(36),
      type: 'context',
      content: contextInput,
      timestamp: resolveTimestamp(),
    };

    pushMessage(contextMessage);
    setContextInput('');
    setIsContextSubmitting(true);

    try {
      const response = await fetch(contextUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          content: contextMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        status: 'success' | 'error';
        pendingChunkCount: number;
        message?: string;
      };

      if (data.status === 'success') {
        pushMessage({
          id: Math.random().toString(36),
          type: 'system',
          content: `컨텍스트가 저장되었습니다 (대기 중 ${data.pendingChunkCount}개).`,
          timestamp: resolveTimestamp(),
        });
      } else {
        throw new Error(data.message || '컨텍스트 저장에 실패했습니다.');
      }
    } catch (error) {
      let errorContent = 'Failed to store context chunk';

      if (error instanceof Error) {
        errorContent = error.message;
      } else if (typeof error === 'string') {
        errorContent = error;
      }

      pushMessage({
        id: Math.random().toString(36),
        type: 'error',
        content: errorContent,
        timestamp: resolveTimestamp(),
      });
    } finally {
      setIsContextSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const askUrl = buildGatewayUrl('/agent/ask');
    if (!askUrl) {
      if (!gatewayWarningLogged.current) {
        console.warn('[ChatInput] Gateway URL is not ready, ask skipped.');
        gatewayWarningLogged.current = true;
      }
      pushMessage({
        id: Math.random().toString(36),
        type: 'error',
        content: 'Gateway URL을 확인할 수 없습니다.',
        timestamp: resolveTimestamp(),
      });
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36),
      type: 'user',
      content: input,
      timestamp: resolveTimestamp(),
    };

    pushMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(askUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          instruction: input,
          fileHints: fileHints
            ? fileHints
                .split(',')
                .map((f) => f.trim())
                .filter((hint) => hint.length > 0)
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(responseText);

      if (data.status === 'success') {
        const ops = Array.isArray(data.operations) ? data.operations : [];

        if (ops.length > 0) {
          pushMessage({
            id: Math.random().toString(36),
            type: 'assistant',
            content: `Operations executed: ${ops.length}`,
            timestamp: resolveTimestamp(),
          });
          onOperationsUpdate(ops);
        } else {
          onOperationsUpdate([]);
        }

        const previewRequestUrl = buildGatewayUrl('/preview/start');
        if (previewRequestUrl) {
          const previewResponse = await fetch(previewRequestUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (previewResponse.ok) {
            const previewData = await previewResponse.json();
            if (previewData.previewUrl) {
              onPreviewUrlUpdate(previewData.previewUrl);
            }
          }
        }

        if (typeof data.message === 'string' && data.message.trim().length > 0) {
          pushMessage({
            id: Math.random().toString(36),
            type: 'assistant',
            content: data.message.trim(),
            timestamp: resolveTimestamp(),
          });
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      let errorContent = 'Failed to process request';

      if (error instanceof Error) {
        errorContent = error.message;
      } else if (typeof error === 'string') {
        errorContent = error;
      }

      if (
        errorContent.includes('과부하') ||
        errorContent.includes('Overloaded') ||
        errorContent.includes('529')
      ) {
        errorContent =
          'Claude API가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
      }

      const errorMessage: Message = {
        id: Math.random().toString(36),
        type: 'error',
        content: errorContent,
        timestamp: resolveTimestamp(),
      };
      pushMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' || message.type === 'context'
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'assistant'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : message.type === 'context'
                  ? 'bg-indigo-500 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      <StreamingLogs sessionId={sessionId} gatewayUrl={gatewayUrl} />

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0"
      >
        <div className="space-y-2">
          <div className="space-y-1">
            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder="컨텍스트를 추가하려면 입력 후 저장하세요 (멀티라인 가능)"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleContextSubmit}
                disabled={isContextSubmitting || !contextInput.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isContextSubmitting ? 'Saving...' : 'Save Context'}
              </button>
            </div>
          </div>
          <input
            type="text"
            value={fileHints}
            onChange={(e) => setFileHints(e.target.value)}
            placeholder="File hints (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter instruction..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
