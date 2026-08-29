/**
 * @openelement/element — ErrorBoundary (ADR-0053 Layer 2).
 *
 * Holds render-error state and displays fallback UI instead of a bare tag
 * or broken DOM. Capture is automatic: `static isErrorBoundary = true` marks
 * the component as a boundary, so render failures in its subtree bubble to it
 * — on SSR the nearest boundary renders its onError() fallback in place of
 * the failed subtree (no whole-tree bare-tag degradation), and on the client
 * a failing descendant's render/update hands the error to the nearest
 * ancestor boundary via catchError(). Application code can still report
 * errors explicitly via catchError(). The base-class render() swaps in the
 * onError() fallback while error state is set — but overriding render()
 * replaces that swap, so a subclass render() MUST branch on hasError itself
 * (see below).
 *
 * v0.36.0: Added retry mechanism and degraded rendering fallback.
 * v0.42.0-alpha.16 (#919): Automatic capture/bubbling (static isErrorBoundary,
 * SSR boundary scope, CSR ancestor bubbling, retry re-renders the captured
 * source).
 *
 * Usage:
 * ```tsx
 * class MyBoundary extends ErrorBoundary {
 *   override render() {
 *     // Your override shadows ErrorBoundary.render(), so branch yourself:
 *     if (this.hasError) return this.onError(this.error!);
 *     return <slot />;
 *   }
 * }
 * ```
 */

import type { VNode } from './internal/protocol/vnode.ts';
import { OpenElement } from './open-element.ts';
import { ErrorCode, OpenElementError } from './internal/core/index.ts';
import type { ErrorSeverity } from './internal/protocol/errors.ts';

/** Wrap an unknown thrown value as an OpenElementError with boundary metadata. */
function toBoundaryError(error: unknown): OpenElementError {
  if (error instanceof OpenElementError) return error;
  const cause = error instanceof Error ? error : undefined;
  return new OpenElementError(
    cause?.message ?? String(error),
    {
      code: ErrorCode.BOUNDARY_CAUGHT,
      severity: 'error' as ErrorSeverity,
      phase: 'render',
      recoverable: true,
      cause,
    },
  );
}

export abstract class ErrorBoundary extends OpenElement {
  /**
   * ADR-0053 Layer 2: marks this component as an error boundary. The SSR
   * renderer (render-ir/render-dsd) and the client runtime bubble subtree
   * render failures to the nearest ancestor carrying this flag.
   */
  static override isErrorBoundary = true;

  private _error: OpenElementError | null = null;
  private _retryCount = 0;
  /** Origin element of an automatically captured error (CSR bubbling). */
  private _errorSource: unknown = null;

  /** Maximum number of retry attempts before giving up. Default: 3. */
  protected maxRetries = 3;

  get hasError(): boolean {
    return this._error !== null;
  }

  get error(): OpenElementError | null {
    return this._error;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  /**
   * Render fallback UI when a child component's render() throws.
   * Subclasses SHOULD override this for custom error UI.
   *
   * Default implementation renders a degraded static fallback.
   */
  onError(error: OpenElementError): VNode {
    return {
      tag: 'div',
      props: { class: 'error-boundary-fallback', role: 'alert' },
      children: [
        {
          tag: 'p',
          props: {},
          children: [`Something went wrong: ${error.message}`],
        },
        this._retryCount < this.maxRetries
          ? {
            tag: 'button',
            props: {
              onClick: () => this.retry(),
            },
            children: [`Retry (${this._retryCount}/${this.maxRetries})`],
          }
          : {
            tag: 'p',
            props: { class: 'error-boundary-exhausted' },
            children: ['Max retries reached. Please reload the page.'],
          },
      ],
    };
  }

  /**
   * Retry rendering after an error. Resets error state and increments
   * retry counter. If maxRetries is exceeded, shows exhausted state.
   *
   * When the error was captured automatically, the failing source element is
   * re-rendered too — a repeated failure bubbles back into catchError()
   * through the source's own error path, restoring the fallback.
   */
  retry(): void {
    if (this._retryCount >= this.maxRetries) {
      return; // exhausted
    }
    this._retryCount++;
    this._error = null;
    const source = this._errorSource;
    this._errorSource = null;
    this.update(); // trigger re-render
    if (typeof (source as { update?: unknown } | null)?.update === 'function') {
      (source as { update(): void }).update();
    }
  }

  /**
   * Fully reset the error boundary, including retry count.
   * Call this when the underlying issue has been resolved externally.
   */
  reset(): void {
    this._error = null;
    this._errorSource = null;
    this._retryCount = 0;
    this.update();
  }

  /**
   * Capture and reset error state on re-render.
   */
  override connectedCallback(): void {
    this._error = null;
    this._errorSource = null;
    this._retryCount = 0;
    super.connectedCallback();
  }

  /**
   * Render the captured fallback or the boundary's normal content.
   *
   * NOTE: a subclass that overrides render() shadows this swap — its
   * override must branch on hasError/onError itself.
   */
  override render(): VNode | null {
    if (this._error) {
      return this.onError(this._error);
    }
    return super.render();
  }

  /**
   * Capture an error at this boundary. Called automatically by the client
   * runtime when a descendant's render/update fails (the failing element is
   * passed as `source` so retry() can re-render it), or explicitly by
   * application code.
   */
  catchError(error: Error, source?: unknown): void {
    this._error = toBoundaryError(error);
    this._errorSource = source ?? null;
    // Trigger re-render with error state
    this.update();
  }

  /**
   * @internal SSR capture (ADR-0053 Layer 2): set error state without a DOM
   * update — render-dsd calls this before invoking render(), which then swaps
   * in the onError() fallback.
   */
  _captureSsrError(error: unknown): void {
    this._error = toBoundaryError(error);
  }
}

export {
  CompiledErrorBoundary,
  type CompiledErrorBoundaryOptions,
} from './internal/compiled/runtime/error-boundary.ts';
