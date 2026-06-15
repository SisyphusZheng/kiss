/**
 * @openelement/core — Unified Error Architecture (ADR-0053 / SOP-011).
 */

import type { RenderError as ProtocolRenderError } from '@openelement/protocol/renderer';

// ─── Well-known error codes ─────────────────────────────────────────

/** Well-known error code constants for reference. String values are always accepted. */
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
  return e instanceof Error ? e.message : String(e);
}

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

// ─── Base Error ─────────────────────────────────────────────────────

export class OpenElementError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly phase: ErrorPhase;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code?: string,
    /** Backward compat: if number, treated as statusCode (old API) */
    severityOrStatus?: ErrorSeverity | number,
    phaseOrOperational?: ErrorPhase | boolean,
    recoverable?: boolean,
    cause?: Error,
  ) {
    let severity: ErrorSeverity;
    let phase: ErrorPhase;
    let rec: boolean;

    if (typeof severityOrStatus === 'number') {
      const _statusCode = severityOrStatus;
      severity = 'error';
      phase = 'render';
      rec = phaseOrOperational === true;
    } else {
      severity = severityOrStatus ?? 'error';
      phase =
        (typeof phaseOrOperational === 'string' ? phaseOrOperational : 'unknown') as ErrorPhase;
      rec = recoverable ?? false;
    }

    super(message, cause ? { cause } : undefined);
    this.name = 'OpenElementError';
    this.code = code ?? ErrorCode.UNKNOWN;
    this.severity = severity;
    this.phase = phase;
    this.recoverable = rec;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      phase: this.phase,
      recoverable: this.recoverable,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }
}

// ─── SsrRenderError (backward compat) ────────────────────────────────

export class SsrRenderError extends OpenElementError {
  public readonly componentPath: string;
  public readonly sourceError: Error;

  constructor(componentPath: string, sourceError: Error) {
    super(
      `SSR render failed: ${componentPath}`,
      'SSR_RENDER_ERROR',
      'error',
      'ssr' as ErrorPhase,
      false,
      sourceError,
    );
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
    super(message, code, 'error', 'render', true, cause);
    this.name = 'RenderError';
    this.componentPath = componentPath;
    this.tagName = tagName;
  }
}

export class IslandRenderError extends RenderError {
  constructor(componentPath: string, sourceError: Error) {
    super(
      componentPath,
      `Island render failed: ${componentPath}`,
      'ISLAND_RENDER_ERROR',
      '',
      sourceError,
    );
    this.name = 'IslandRenderError';
  }
}

export class PropValidationError extends OpenElementError {
  public readonly propertyName: string;
  public readonly receivedValue: unknown;

  constructor(propertyName: string, receivedValue: unknown, cause?: Error) {
    super(
      `@prop validation failed for "${propertyName}"`,
      'PROP_VALIDATION_ERROR',
      'warning',
      'validation',
      true,
      cause,
    );
    this.name = 'PropValidationError';
    this.propertyName = propertyName;
    this.receivedValue = receivedValue;
  }
}

export class NavigationError extends OpenElementError {
  public readonly route: string;

  constructor(route: string, cause?: Error) {
    super(`Navigation failed: ${route}`, 'NAVIGATION_ERROR', 'error', 'navigation', true, cause);
    this.name = 'NavigationError';
    this.route = route;
  }
}

export class BuildError extends OpenElementError {
  constructor(message: string, cause?: Error) {
    super(message, 'BUILD_ERROR', 'error', 'build', false, cause);
    this.name = 'BuildError';
  }
}

// ─── Error Telemetry ────────────────────────────────────────────────

export type ErrorTelemetryHook = (error: OpenElementError) => void;

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

export interface SsrErrorEntry {
  componentPath: string;
  error: OpenElementError;
  phase: ErrorPhase;
}

export class SsrErrorContext {
  private errors: SsrErrorEntry[] = [];

  add(entry: SsrErrorEntry): void {
    this.errors.push(entry);
    reportError(entry.error);
  }

  get all(): readonly SsrErrorEntry[] {
    return this.errors;
  }

  get hasErrors(): boolean {
    return this.errors.length > 0;
  }

  merge(other: SsrErrorContext): void {
    for (const e of other.errors) this.add(e);
  }
}
