/**
 * ./errors.ts — Unified Error Architecture (ADR-0053 / SOP-011).
 *
 * ERROR_PREFIX and ErrorCode are re-exported from ../protocol/errors.ts.
 * They are pure string constants (no runtime side effects), so importing them
 * here is safe for SSG/browser bundles that tree-shake ./index.ts.
 */

import type { RenderError as ProtocolRenderError } from '../protocol/render.ts';
import {
  ERROR_PREFIX,
  ErrorCode,
  type ErrorPhase,
  type ErrorSeverity,
  type ErrorTelemetryHook,
  type OpenElementError as ProtocolOpenElementError,
} from '../protocol/errors.ts';

// ─── Well-known error codes / prefix (authoritative source in protocol) ───────

export { ERROR_PREFIX, ErrorCode };
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook };

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

// ─── Base Error ─────────────────────────────────────────────────────

export interface OpenElementErrorOptions {
  cause?: Error;
  code?: string;
  statusCode?: number;
  severity?: ErrorSeverity;
  phase?: ErrorPhase;
  recoverable?: boolean;
}

export class OpenElementError extends Error implements ProtocolOpenElementError {
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
      code: ErrorCode.SSR_RENDER_ERROR,
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

// ─── Error Telemetry ────────────────────────────────────────────────

let _telemetryHook: ErrorTelemetryHook | undefined;

export function setErrorTelemetryHook(hook: ErrorTelemetryHook): void {
  // v0.42.0-alpha.9 (#644): the telemetry hook is a startup-time, single
  // configuration. Re-setting it would create last-writer-wins behavior across
  // requests/tenants (a concurrency hazard on shared runtimes). Rather than a
  // per-request hook (which would require threading a context through every
  // reportError call site), we keep the module-level singleton but guard it so
  // an accidental second set surfaces immediately instead of silently
  // overwriting the previous hook.
  if (_telemetryHook) {
    throw new Error(
      '[openElement] setErrorTelemetryHook() was already called. ' +
        'Configure the error telemetry hook exactly once at application startup.',
    );
  }
  _telemetryHook = hook;
}

/** @internal Test isolation only. Not exported from the package public facade. */
export function resetErrorTelemetryHookForTests(): void {
  _telemetryHook = undefined;
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
