'use client';

import { useEffect, useMemo, useState } from 'react';

type AgentLogLevel = 'debug' | 'info' | 'warn' | 'error';

interface AgentLogEvent {
  sessionId: string;
  level: AgentLogLevel;
  message: string;
  source?: string;
  timestamp: string;
}

interface StreamingLogsProps {
  sessionId: string;
  gatewayUrl: string | null;
}

const LEVEL_INDICATORS: Record<AgentLogLevel, string> = {
  debug: 'bg-gray-400 dark:bg-gray-600',
  info: 'bg-blue-400/70 dark:bg-blue-500/70',
  warn: 'bg-amber-500/80 dark:bg-amber-400/80',
  error: 'bg-rose-500/90 dark:bg-rose-500',
};

const MAX_BUFFER = 40;

const buildStreamUrl = (gatewayUrl: string | null, sessionId: string): string | null => {
  if (!gatewayUrl) {
    return null;
  }

  const encodedSession = encodeURIComponent(sessionId);

  try {
    const base = new URL(gatewayUrl);
    const normalizedPath = base.pathname.endsWith('/')
      ? base.pathname.slice(0, -1)
      : base.pathname;
    base.pathname = `${normalizedPath}/agent/logs/stream/${encodedSession}`;
    return base.toString();
  } catch {
    const trimmed = gatewayUrl.endsWith('/')
      ? gatewayUrl.slice(0, -1)
      : gatewayUrl;
    return `${trimmed}/agent/logs/stream/${encodedSession}`;
  }
};

export default function StreamingLogs({ sessionId, gatewayUrl }: StreamingLogsProps) {
  const [logs, setLogs] = useState<AgentLogEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const streamUrl = useMemo(
    () => buildStreamUrl(gatewayUrl, sessionId),
    [gatewayUrl, sessionId],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setLogs([]);
    setIsConnected(false);

    if (!streamUrl) {
      return;
    }

    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (!event?.data) {
        return;
      }

      try {
        const parsed = JSON.parse(event.data) as AgentLogEvent;
        if (!parsed || typeof parsed.message !== 'string') {
          return;
        }

        setLogs((prev) => {
          const next = [...prev, parsed];
          if (next.length > MAX_BUFFER) {
            next.splice(0, next.length - MAX_BUFFER);
          }
          return next;
        });
      } catch {
        // Ignore malformed payloads.
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      setIsConnected(false);
      eventSource.close();
    };
  }, [streamUrl]);

  const displayLogs = logs.slice(-3);

  if (!streamUrl) {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-900/40 px-3 py-2">
      <div className="space-y-1 text-[11px] leading-4 text-gray-600 dark:text-gray-400 font-mono">
        {displayLogs.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400/70 dark:bg-gray-600/60" />
            <span className="truncate">
              {isConnected ? '실시간 로그를 대기 중입니다…' : '실시간 로그 연결을 준비 중입니다…'}
            </span>
          </div>
        ) : (
          displayLogs.map((log) => {
            const key = `${log.timestamp}-${log.message}`;
            const sourceLabel = log.source
              ? log.source.charAt(0).toUpperCase() + log.source.slice(1)
              : 'System';
            return (
              <div key={key} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_INDICATORS[log.level]}`} />
                <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {sourceLabel}
                </span>
                <span className="flex-1 truncate">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
