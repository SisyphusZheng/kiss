/**
 * @kissjs/rpc - Lit ReactiveController for Hono RPC
 *
 * Minimal wrapper to use Hono RPC in Lit Islands.
 * For type-safe API calls, use Hono's `hc()` directly.
 *
 * @example
 * ```typescript
 * import { RpcController } from '@kissjs/rpc'
 * import { hc } from 'hono/client'
 * import type { AppType } from '../server'
 *
 * class MyIsland extends LitElement {
 *   private rpc = new RpcController(this)
 *   private client = hc<AppType>('/')
 *
 *   async loadData() {
 *     const data = await this.rpc.call(() =>
 *       this.client.api.posts.$get()
 *     )
 *     // data is fully typed!
 *   }
 *
 *   render() {
 *     if (this.rpc.loading) return html`<p>Loading...</p>`
 *     if (this.rpc.error) return html`<p>Error: ${this.rpc.error.message}</p>`
 *     return html`...`
 *   }
 * }
 * ```
 *
 * @module
 */

import type { ReactiveController, ReactiveElement } from 'lit';

/**
 * RPC Error — thrown when an API call fails.
 *
 * Aligned with @kissjs/core KissError structure:
 * provides status, code, and message for structured error handling.
 */
export class RpcError extends Error {
  /** HTTP status code (0 if unknown / network error) */
  readonly status: number;
  /** Machine-readable error code (e.g. 'RPC_ERROR', 'NOT_FOUND') */
  readonly code: string;
  /** Optional field-level validation details */
  readonly details?: Array<{ field: string; message: string }>;

  constructor(
    status: number,
    message: string,
    code = 'RPC_ERROR',
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'RpcError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Structured JSON representation, compatible with KissError.toJSON() */
  toJSON(): { error: { code: string; message: string; status: number } } {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
      },
    };
  }
}

/** Configuration options for RpcController */
export interface RpcControllerOptions {
  /** Maximum number of automatic retries on transient failures (default: 0) */
  maxRetries?: number;
  /** Delay in ms between retries, or a function returning delay for exponential backoff (default: 1000) */
  retryDelay?: number | ((attempt: number) => number);
}

/**
 * Lit ReactiveController for declarative RPC calls.
 *
 * Handles loading/error states and triggers host re-renders automatically.
 * Supports optional retry with configurable backoff, and request cancellation
 * via AbortController integration.
 *
 * @example
 * ```typescript
 * // With retry and cancellation
 * const controller = new RpcController(this, { maxRetries: 2 })
 *
 * // Cancel in-flight request (e.g. on page navigation)
 * controller.abort()
 * ```
 */
export class RpcController implements ReactiveController {
  private _loading = false;
  private _error: RpcError | null = null;
  private _abortController: AbortController | null = null;
  private readonly _options: Required<RpcControllerOptions>;

  /** Whether an RPC call is currently in progress */
  get loading(): boolean {
    return this._loading;
  }

  /** The last RPC error, or null if the last call succeeded */
  get error(): RpcError | null {
    return this._error;
  }

  constructor(
    private host: ReactiveElement,
    options?: RpcControllerOptions,
  ) {
    host.addController(this);
    this._options = {
      maxRetries: options?.maxRetries ?? 0,
      retryDelay: options?.retryDelay ?? 1000,
    };
  }

  hostConnected() {}

  hostDisconnected() {
    this.abort();
    this._loading = false;
    this._error = null;
  }

  /**
   * Cancel any in-flight RPC request.
   * Useful when navigating away from a page or when a new request
   * supersedes an old one.
   */
  abort(): void {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  /**
   * Get the current AbortSignal for passing to fetch or Hono client.
   * A new AbortController is created for each call().
   *
   * @example
   * ```typescript
   * // If you need manual signal access:
   * const signal = this.rpc.signal
   * ```
   */
  get signal(): AbortSignal | undefined {
    return this._abortController?.signal;
  }

  /**
   * Call an API endpoint with automatic loading/error handling.
   *
   * KISS Architecture: throws RpcError on failure instead of returning null.
   * The error is still stored in this.error for template access,
   * but callers who want to handle errors must catch.
   *
   * Supports automatic retry with configurable backoff for transient failures
   * (status 0 = network error, or status >= 500 = server error).
   * Retries are not attempted for 4xx client errors.
   *
   * @param fn - Async function that performs the API call
   * @returns The result of the API call
   *
   * @example
   * ```typescript
   * try {
   *   const data = await this.rpc.call(() =>
   *     client.api.posts.$get()
   *   )
   * } catch (err) {
   *   if (err instanceof RpcError) { /* handle *\/ }
   * }
   * ```
   */
  async call<T>(fn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
    // Cancel any previous in-flight request
    this.abort();

    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    this._loading = true;
    this._error = null;
    this.host.requestUpdate();

    let lastError: RpcError | undefined;
    const maxAttempts = this._options.maxRetries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check if aborted before attempting
      if (signal.aborted) {
        this._loading = false;
        this.host.requestUpdate();
        throw new RpcError(0, 'Request aborted', 'ABORTED');
      }

      try {
        const result = await fn(signal);
        this._loading = false;
        this._abortController = null;
        this.host.requestUpdate();
        return result;
      } catch (err) {
        let rpcError: RpcError;
        if (err instanceof RpcError) {
          rpcError = err;
        } else if (err instanceof Error) {
          if (err.name === 'AbortError') {
            this._loading = false;
            this._abortController = null;
            this.host.requestUpdate();
            throw new RpcError(0, 'Request aborted', 'ABORTED');
          }
          rpcError = new RpcError(0, err.message);
        } else {
          rpcError = new RpcError(0, 'Unknown error');
        }

        lastError = rpcError;

        // Only retry on transient errors (network or 5xx), not 4xx
        const isTransient = rpcError.status === 0 || rpcError.status >= 500;
        if (!isTransient || attempt === maxAttempts - 1) {
          break;
        }

        // Wait before retry
        const delay = typeof this._options.retryDelay === 'function'
          ? this._options.retryDelay(attempt)
          : this._options.retryDelay;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this._error = lastError ?? new RpcError(0, 'Unknown error');
    this._loading = false;
    this._abortController = null;
    this.host.requestUpdate();
    throw this._error;
  }
}
