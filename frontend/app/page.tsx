'use client';

import { useState, useEffect } from 'react';

interface Operation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path?: string;
  oldPath?: string;
  newPath?: string;
  content?: string;
  timestamp?: string;
}
import ChatInput from '@/components/ChatInput';
import OperationsLog from '@/components/OperationsLog';
import PreviewFrame from '@/components/PreviewFrame';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'logs' | 'preview'>('chat');
  const [sessionId, setSessionId] = useState<string>('');
  const [operations, setOperations] = useState<Operation[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  return (
    <div className="flex flex-col h-dvh bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="px-3 py-2">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Codemore</h1>
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