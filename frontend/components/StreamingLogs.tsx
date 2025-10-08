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
  isLoading?: boolean;
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

export default function StreamingLogs({ sessionId, gatewayUrl, isLoading = true }: StreamingLogsProps) {
  const [logs, setLogs] = useState<AgentLogEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [displayCount, setDisplayCount] = useState(3);

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
    setDisplayCount(3);

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

  useEffect(() => {
    if (!isLoading && displayCount > 0) {
      const interval = setInterval(() => {
        setDisplayCount((prev) => Math.max(0, prev - 1));
      }, 300);
      return () => clearInterval(interval);
    } else if (isLoading && displayCount < 3) {
      setDisplayCount(3);
    }
  }, [isLoading, displayCount]);

  const displayLogs = logs.slice(-3).slice(0, displayCount);

  if (!streamUrl || displayCount === 0) {
    return null;
  }

  return (
    <div className="ml-3 mt-1 space-y-0.5">
      {displayLogs.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
          {isConnected ? 'Processing...' : 'Connecting...'}
        </div>
      ) : (
        displayLogs.map((log, index) => {
          const key = `${log.timestamp}-${log.message}`;
          const isLatest = index === displayLogs.length - 1;
          const opacity = index === 0 ? 'opacity-30' : index === 1 ? 'opacity-50' : 'opacity-100';

          return (
            <div
              key={key}
              className={`text-xs text-gray-500 dark:text-gray-400 truncate ${opacity} ${isLatest && isLoading ? 'animate-pulse' : ''}`}
            >
              {log.message}
            </div>
          );
        })
      )}
    </div>
  );
}
