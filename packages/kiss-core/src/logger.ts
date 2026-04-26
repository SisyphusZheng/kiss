import process from 'node:process';

/**
 * @kissjs/core - Logger
 *
 * Unified logging with KISS_LOG_LEVEL environment variable control.
 *
 * Levels: debug > info > warn > error
 * Default: info
 *
 * Usage:
 *   KISS_LOG_LEVEL=debug  — verbose output (development)
 *   KISS_LOG_LEVEL=info   — normal output (default)
 *   KISS_LOG_LEVEL=warn   — only warnings and errors
 *   KISS_LOG_LEVEL=error  — only errors
 *   KISS_LOG_LEVEL=none   — silence all logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

function getLogLevel(): LogLevel {
  const env = process.env.KISS_LOG_LEVEL?.toLowerCase();
  if (env && LOG_LEVELS[env] !== undefined) {
    return env as LogLevel;
  }
  return 'info';
}

const currentLevel = getLogLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(`[KISS] ${message}`, ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.log(`[KISS] ${message}`, ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`[KISS] ${message}`, ...args);
    }
  },

  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(`[KISS] ${message}`, ...args);
    }
  },

  /**
   * Log with custom prefix (for sub-modules like SSG)
   */
  withPrefix(prefix: string) {
    return {
      debug(message: string, ...args: unknown[]): void {
        if (shouldLog('debug')) {
          console.log(`[${prefix}] ${message}`, ...args);
        }
      },
      info(message: string, ...args: unknown[]): void {
        if (shouldLog('info')) {
          console.log(`[${prefix}] ${message}`, ...args);
        }
      },
      warn(message: string, ...args: unknown[]): void {
        if (shouldLog('warn')) {
          console.warn(`[${prefix}] ${message}`, ...args);
        }
      },
      error(message: string, ...args: unknown[]): void {
        if (shouldLog('error')) {
          console.error(`[${prefix}] ${message}`, ...args);
        }
      },
    };
  },
};

export default logger;
