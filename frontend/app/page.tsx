'use client';

import { useState, useEffect } from 'react';
import { Message, Operation } from '@/types/chat';
import ChatInput from '@/components/ChatInput';
import OperationsLog from '@/components/OperationsLog';
import PreviewFrame from '@/components/PreviewFrame';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'logs' | 'preview'>('chat');
  const [sessionId, setSessionId] = useState<string>('');
  const [operations, setOperations] = useState<Operation[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(
    process.env.NEXT_PUBLIC_GATEWAY_URL || null,
  );
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('phoding-session-id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = Math.random().toString(36).substring(7);
      localStorage.setItem('phoding-session-id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    setHasLoadedHistory(false);
  }, [sessionId]);

  useEffect(() => {
    if (gatewayUrl) {
      return;
    }

    if (typeof window !== 'undefined') {
      const fallback = `${window.location.protocol}//${window.location.hostname}:3002`;
      setGatewayUrl(fallback);
    }
  }, [gatewayUrl]);

  useEffect(() => {
    if (!sessionId || !gatewayUrl || hasLoadedHistory) {
      return;
    }

    const abortController = new AbortController();

    const loadHistory = async () => {
      try {
        const historyUrl = `${gatewayUrl}/agent/history/${sessionId}`;
        const response = await fetch(historyUrl, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          console.warn(
            '[Chat] Failed to load history',
            response.status,
            response.statusText,
          );
          return;
        }

        const data = await response.json();
        if (data.status !== 'success' || !Array.isArray(data.history)) {
          return;
        }

        if (data.history.length === 0) {
          return;
        }

        const historyMessages: Message[] = [];

        for (const log of data.history) {
          historyMessages.push({
            id: `${log.id}-user`,
            type: 'user',
            content: log.instruction,
            timestamp: new Date(log.createdAt),
          });

          if (log.status === 'success') {
            const operations = Array.isArray(log.operations)
              ? log.operations
              : [];

            if (operations.length > 0) {
              historyMessages.push({
                id: `${log.id}-assistant`,
                type: 'assistant',
                content: `Operations executed: ${operations.length}`,
                timestamp: new Date(log.createdAt),
              });

              if (log === data.history[data.history.length - 1]) {
                setOperations(operations);
              }
            } else if (Array.isArray(log.logs) && log.logs.length > 0) {
              historyMessages.push({
                id: `${log.id}-assistant-message`,
                type: 'assistant',
                content: log.logs.join('\n\n'),
                timestamp: new Date(log.createdAt),
              });
            }
          } else {
            historyMessages.push({
              id: `${log.id}-error`,
              type: 'error',
              content: log.error || 'Unknown error',
              timestamp: new Date(log.createdAt),
            });
          }
        }

        setMessages(historyMessages);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('[Chat] Failed to fetch history:', error);
      } finally {
        setHasLoadedHistory(true);
      }
    };

    loadHistory();

    return () => {
      abortController.abort();
    };
  }, [gatewayUrl, hasLoadedHistory, sessionId]);

  return (
    <div className="flex flex-col h-dvh bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="px-3 py-2">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Phoding</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Session: {sessionId}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'logs'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && sessionId && (
          <ChatInput
            sessionId={sessionId}
            onOperationsUpdate={setOperations}
            onPreviewUrlUpdate={setPreviewUrl}
            messages={messages}
            setMessages={setMessages}
            gatewayUrl={gatewayUrl}
          />
        )}
        {activeTab === 'chat' && !sessionId && (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Initializing...</div>
          </div>
        )}
        {activeTab === 'logs' && <OperationsLog operations={operations} />}
        {activeTab === 'preview' && <PreviewFrame url={previewUrl} />}
      </div>
    </div>
  );
}
