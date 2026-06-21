/**
 * @openelement/core - Structured Logger
 *
 * Provides scoped, leveled logging for the openElement Framework.
 * - logError: logs only, never throws (owner decision Q-4)
 * - logDebug: guarded by DEBUG compile-time constant for DCE
 *
 * @module @openelement/core/logger
 */

import { OpenElementError } from './errors.js';

/** Log level enum - higher value = less verbose */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

const PREFIX_MAP: Record<string, string> = {
  core: '[openElement]',
  ssg: '[openElement/SSG]',
  blog: '[openElement/Blog]',
  signal: '[openElement/Signal]',
};

declare const DEBUG: boolean;
const _DEBUG: boolean = typeof DEBUG === 'undefined' ? true : DEBUG;

export class OpenElementLogger {
  constructor(private prefix: string) {}

  logError(msg: string, err?: unknown): void {
    if (err instanceof OpenElementError) {
      console.error(`${this.prefix} ${msg}`, {
        code: err.code,
        message: err.message,
        severity: err.severity,
        phase: err.phase,
        cause: err.cause instanceof Error ? err.cause.message : err.cause,
      });
    } else if (err instanceof Error) {
      console.error(`${this.prefix} ${msg}`, err.message);
    } else {
      console.error(`${this.prefix} ${msg}`);
    }
  }

  logWarn(msg: string, detail?: unknown): void {
    if (detail !== undefined) {
      console.warn(`${this.prefix} ${msg}`, detail);
    } else {
      console.warn(`${this.prefix} ${msg}`);
    }
  }

  logInfo(msg: string): void {
    console.info(`${this.prefix} ${msg}`);
  }

  logDebug(msg: string): void {
    if (_DEBUG) {
      console.debug(`${this.prefix} ${msg}`);
    }
  }

  /** Convenience aliases */
  error = this.logError;
  warn = this.logWarn;
  info = this.logInfo;
  debug = this.logDebug;
}

export function createLogger(scope: string): OpenElementLogger {
  const prefix = PREFIX_MAP[scope] ?? `[openElement/${scope}]`;
  return new OpenElementLogger(prefix);
}
