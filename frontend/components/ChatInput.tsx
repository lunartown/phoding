'use client';

import { useState } from 'react';

interface Operation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path?: string;
  oldPath?: string;
  newPath?: string;
  content?: string;
  timestamp?: string;
}

interface ChatInputProps {
  sessionId: string;
  onOperationsUpdate: (operations: Operation[]) => void;
  onPreviewUrlUpdate: (url: string) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

export default function ChatInput({
  sessionId,
  onOperationsUpdate,
  onPreviewUrlUpdate,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileHints, setFileHints] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Resolve Gateway URL
      // 1) Prefer build-time env NEXT_PUBLIC_GATEWAY_URL
      // 2) Fallback: derive from current host with port 3002 (avoids localhost hardcoding)
      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL ||
        (typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.hostname}:3002`
          : '');
      const response = await fetch(`${gatewayUrl}/agent/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          sessionId,
          instruction: input,
          fileHints: fileHints ? fileHints.split(',').map((f) => f.trim()) : undefined,
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
        const assistantMessage: Message = {
          id: Math.random().toString(36),
          type: 'assistant',
          content: `Operations executed: ${data.operations.length}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        onOperationsUpdate(data.operations);

        // Start preview if not already running
        const previewResponse = await fetch(`${gatewayUrl}/preview/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (previewResponse.ok) {
          const previewData = await previewResponse.json();
          if (previewData.previewUrl) {
            onPreviewUrlUpdate(previewData.previewUrl);
          }
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

      // Claude API 과부하 에러에 대한 친화적인 메시지
      if (errorContent.includes('과부하') || errorContent.includes('Overloaded') || errorContent.includes('529')) {
        errorContent = 'Claude API가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
      }

      const errorMessage: Message = {
        id: Math.random().toString(36),
        type: 'error',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'assistant'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
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

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
        <div className="space-y-2">
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
