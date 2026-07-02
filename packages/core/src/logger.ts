/**
 * @openelement/core - Tagged console logger.
 *
 * Lightweight scoped logger. Returns plain functions so it is tree-shakable
 * and has zero class overhead.
 *
 * @module @openelement/core/logger
 */

export interface Logger {
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
}

export function createLogger(tag: string): Logger {
  return {
    debug: (msg: string, ...args: unknown[]) => console.debug(`[${tag}] ${msg}`, ...args),
    info: (msg: string, ...args: unknown[]) => console.info(`[${tag}] ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) => console.warn(`[${tag}] ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) => console.error(`[${tag}] ${msg}`, ...args),
  };
}

// warn-once via Set, two callers, shared helper if >3 callers
const _warned = new Set<string>();
export function warnOnce(key: string, logger: Logger, msg: string): void {
  if (!_warned.has(key)) {
    _warned.add(key);
    logger.warn(msg);
  }
}
