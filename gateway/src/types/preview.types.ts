/**
 * Shared preview service response types.
 */
export type PreviewStatus =
  | 'running'
  | 'starting'
  | 'stopped'
  | 'not_running'
  | 'error';

export interface PreviewStartResult {
  status: PreviewStatus;
  error?: string;
}

export interface PreviewStartResponse extends PreviewStartResult {
  previewUrl?: string;
}

export interface PreviewStopResult {
  status: 'stopped' | 'not_running';
}
