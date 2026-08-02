/**
 * errors.ts - Unified error architecture contracts.
 */

// ─── Well-known error codes ─────────────────────────────────────────

/** Well-known error code constants for reference. String values are always accepted. */
export const ErrorCode = {
  SSR_RENDER_ERROR: 'SSR_RENDER_ERROR',
  BOUNDARY_CAUGHT: 'BOUNDARY_CAUGHT',
  UNKNOWN: 'UNKNOWN',
} as const;

/** Error message prefix for all openElement errors. */
export const ERROR_PREFIX = '[openElement]';

// ─── Types ──────────────────────────────────────────────────────────

export type ErrorSeverity = 'error' | 'warning';
export type ErrorPhase =
  | 'render'
  | 'ssr'
  | 'csr'
  | 'build'
  | 'navigation'
  | 'validation'
  | 'unknown';

/** Branded error shape implemented by concrete OpenElementError classes. */
export interface OpenElementError extends Error {
  readonly code: string;
  readonly severity: ErrorSeverity;
  readonly phase: ErrorPhase;
  readonly recoverable: boolean;
}

export type ErrorTelemetryHook = (error: OpenElementError) => void;
