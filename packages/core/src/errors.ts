/**
 * @openelement/core — Unified Error Architecture (ADR-0053 / SOP-011).
 */

import type { RenderError as ProtocolRenderError } from '@openelement/protocol/render';

/** Well-known error code constants for reference. String values are always accepted. */
// ponytail: duplicated from protocol to avoid cross-package runtime import in SSG bundles
export const ErrorCode = {
  SSR_RENDER_ERROR: 'SSR_RENDER_ERROR',
  ISLAND_RENDER_ERROR: 'ISLAND_RENDER_ERROR',
  PROP_VALIDATION_ERROR: 'PROP_VALIDATION_ERROR',
  TAG_VALIDATION_ERROR: 'TAG_VALIDATION_ERROR',
  NAVIGATION_ERROR: 'NAVIGATION_ERROR',
  BUILD_ERROR: 'BUILD_ERROR',
  RENDER_ERROR: 'RENDER_ERROR',
  BOUNDARY_CAUGHT: 'BOUNDARY_CAUGHT',
  UNKNOWN: 'UNKNOWN',
} as const;

/** Error message prefix for all openElement errors. */
export const ERROR_PREFIX = '[openElement]';

// ─── Error formatting helper ────────────────────────────────────────

/** Format an unknown thrown value as a human-readable string. */
export function formatError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const parts = [e.message];
  let cause: unknown = e.cause;
  const seen = new Set<unknown>([e]);
  while (cause instanceof Error && !seen.has(cause)) {
    seen.add(cause);
    parts.push(cause.message);
    cause = cause.cause;
  }
  return parts.join(': ');
}

// ─── Types ──────────────────────────────────────────────────────────

import type { ErrorPhase, ErrorSeverity } from '@openelement/protocol/errors';
export type { ErrorPhase, ErrorSeverity };

// ─── Base Error ─────────────────────────────────────────────────────

export interface OpenElementErrorOptions {
  cause?: Error;
  code?: string;
  statusCode?: number;
  severity?: ErrorSeverity;
  phase?: ErrorPhase;
  recoverable?: boolean;
}

export class OpenElementError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly phase: ErrorPhase;
  public readonly recoverable: boolean;
  public readonly statusCode?: number;

  constructor(message: string, options: OpenElementErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'OpenElementError';
    this.code = options.code ?? ErrorCode.UNKNOWN;
    this.severity = options.severity ?? 'error';
    this.phase = options.phase ?? 'unknown';
    this.recoverable = options.recoverable ?? false;
    this.statusCode = options.statusCode;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      phase: this.phase,
      recoverable: this.recoverable,
      statusCode: this.statusCode,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }
}

// ─── SsrRenderError (backward compat) ────────────────────────────────

export class SsrRenderError extends OpenElementError {
  public readonly componentPath: string;
  public readonly sourceError: Error;

  constructor(componentPath: string, sourceError: Error) {
    super(`SSR render failed: ${componentPath}`, {
      code: 'SSR_RENDER_ERROR',
      severity: 'error',
      phase: 'ssr',
      recoverable: false,
      cause: sourceError,
    });
    this.name = 'SsrRenderError';
    this.componentPath = componentPath;
    this.sourceError = sourceError;
  }
}

// ─── New ADR-0053 error classes ─────────────────────────────────────

export class RenderError extends OpenElementError implements ProtocolRenderError {
  public readonly componentPath: string;
  public readonly tagName: string;

  constructor(
    componentPath: string,
    message: string,
    code = 'RENDER_ERROR',
    tagName = '',
    cause?: Error,
  ) {
    super(message, {
      code,
      severity: 'error',
      phase: 'render',
      recoverable: true,
      cause,
    });
    this.name = 'RenderError';
    this.componentPath = componentPath;
    this.tagName = tagName;
  }
}

export class PropValidationError extends OpenElementError {
  public readonly propertyName: string;
  public readonly receivedValue: unknown;

  constructor(propertyName: string, receivedValue: unknown, cause?: Error) {
    super(`@prop validation failed for "${propertyName}"`, {
      code: 'PROP_VALIDATION_ERROR',
      severity: 'warning',
      phase: 'validation',
      recoverable: true,
      cause,
    });
    this.name = 'PropValidationError';
    this.propertyName = propertyName;
    this.receivedValue = receivedValue;
  }
}

// ─── Error Telemetry ────────────────────────────────────────────────

import type { ErrorTelemetryHook } from '@openelement/protocol/errors';
export type { ErrorTelemetryHook };

let _telemetryHook: ErrorTelemetryHook | undefined;

export function setErrorTelemetryHook(hook: ErrorTelemetryHook): void {
  _telemetryHook = hook;
}

export function reportError(error: OpenElementError): void {
  if (_telemetryHook) {
    try {
      _telemetryHook(error);
    } catch { /* must not throw */ }
  } else {
    console.error(`[openElement:${error.code}] ${error.message}`);
  }
}

// ─── SSR Error Context ──────────────────────────────────────────────
