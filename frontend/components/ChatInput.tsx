'use client';

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
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
  const gatewayWarningLogged = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const scrollThreshold = 100;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current || !messagesEndRef.current) {
      return;
    }

    const container = scrollContainerRef.current;
    const scrollThreshold = 100;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;

    const messagesLengthChanged = messages.length !== prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isNearBottom || messagesLengthChanged) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="flex-1 relative border-b border-gray-200 dark:border-gray-700 overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto p-3 space-y-3">
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
            <div className="flex flex-col items-start space-y-1">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
              <StreamingLogs sessionId={sessionId} gatewayUrl={gatewayUrl} isLoading={isLoading} />
            </div>
          )}
          {!isLoading && (
            <StreamingLogs sessionId={sessionId} gatewayUrl={gatewayUrl} isLoading={isLoading} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-500/80 dark:bg-gray-600/80 text-white rounded-full p-1.5 shadow-md hover:bg-gray-600/90 dark:hover:bg-gray-500/90 transition-colors z-10"
            aria-label="Scroll to bottom"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0"
      >
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
      </form>
    </div>
  );
}
