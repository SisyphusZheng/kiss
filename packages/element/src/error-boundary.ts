/**
 * @openelement/element — ErrorBoundary (ADR-0053 Layer 2).
 *
 * Holds render-error state and displays fallback UI instead of a bare tag
 * or broken DOM. There is no automatic catch or bubbling: application code
 * reports errors explicitly via catchError(). The base-class render() swaps
 * in the onError() fallback while error state is set — but overriding
 * render() replaces that swap, so a subclass render() MUST branch on
 * hasError itself (see below).
 *
 * v0.36.0: Added retry mechanism and degraded rendering fallback.
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

export abstract class ErrorBoundary extends OpenElement {
  private _error: OpenElementError | null = null;
  private _retryCount = 0;

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
   */
  retry(): void {
    if (this._retryCount >= this.maxRetries) {
      return; // exhausted
    }
    this._retryCount++;
    this._error = null;
    this.update(); // trigger re-render
  }

  /**
   * Fully reset the error boundary, including retry count.
   * Call this when the underlying issue has been resolved externally.
   */
  reset(): void {
    this._error = null;
    this._retryCount = 0;
    this.update();
  }

  /**
   * Capture and reset error state on re-render.
   */
  override connectedCallback(): void {
    this._error = null;
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

  /** Capture an error explicitly at an application render boundary. */
  catchError(error: Error): void {
    const openElementError = error instanceof OpenElementError ? error : new OpenElementError(
      error.message,
      {
        code: ErrorCode.BOUNDARY_CAUGHT,
        severity: 'error' as ErrorSeverity,
        phase: 'render',
        recoverable: true,
        cause: error,
      },
    );
    this._error = openElementError;
    // Trigger re-render with error state
    this.update();
  }
}
