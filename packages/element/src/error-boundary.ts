/**
 * @openelement/element — ErrorBoundary (ADR-0053 Layer 2).
 *
 * Catches child component render() errors and displays a fallback
 * UI instead of a bare tag or broken DOM. Errors bubble up through
 * the parent tree if no boundary catches them.
 *
 * v0.36.0: Added retry mechanism and degraded rendering fallback.
 *
 * Usage:
 * ```ts
 * class MyBoundary extends ErrorBoundary {
 *   onError(error: OpenElementError) {
 *     return html`<error-panel .message=${error.message}></error-panel>`;
 *   }
 *   render() {
 *     return html`<slot></slot>`;
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
              onclick: () => this.retry(),
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
   * Wrap child render in try/catch.
   */
  override render(): VNode | null {
    if (this._error) {
      return this.onError(this._error);
    }
    return super.render();
  }

  /**
   * Call this from parent to catch a child's error.
   */
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
