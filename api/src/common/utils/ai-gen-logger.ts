import { Logger } from '@nestjs/common';

const logger = new Logger('AI:Gen');

export interface GenLogEntry {
  generationId: string;
  event: string;
  model?: string;
  textModel?: string;
  imageModel?: string;
  step?: number;
  variations?: number;
  orientation?: string;
  durationMs?: number;
  costUsd?: number;
  isDemoMode?: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Structured logger for the AI generation pipeline.
 * All output is server-side only — never exposed in WebSocket events or API responses.
 * Use `level` to control severity; defaults to 'log'.
 */
export function logGen(
  entry: GenLogEntry,
  level: 'log' | 'warn' | 'error' = 'log',
): void {
  const line = JSON.stringify({ ...entry, ts: new Date().toISOString() });
  if (level === 'error') logger.error(line);
  else if (level === 'warn') logger.warn(line);
  else logger.log(line);
}

/** Convenience: measure elapsed ms from a start timestamp. */
export function elapsed(startMs: number): number {
  return Date.now() - startMs;
}
