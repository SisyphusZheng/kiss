/**
 * @kiss/rpc - Lit ReactiveController for Hono RPC
 *
 * Minimal wrapper to use Hono RPC in Lit Islands.
 * For type-safe API calls, use Hono's `hc()` directly.
 *
 * @example
 * ```typescript
 * import { RpcController } from '@kiss/rpc'
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
 */

import type { ReactiveController, ReactiveElement } from 'lit';

/**
 * RPC Error - thrown when API call fails
 */
export class RpcError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

/**
 * Lit ReactiveController for declarative RPC calls
 *
 * Handles loading/error states and triggers re-renders automatically.
 */
export class RpcController implements ReactiveController {
  private _loading = false;
  private _error: RpcError | null = null;

  get loading(): boolean {
    return this._loading;
  }
  get error(): RpcError | null {
    return this._error;
  }

  constructor(private host: ReactiveElement) {
    host.addController(this);
  }

  hostConnected() {}

  hostDisconnected() {
    this._loading = false;
    this._error = null;
  }

  /**
   * Call an API endpoint with automatic loading/error handling
   *
   * @example
   * ```typescript
   * const data = await this.rpc.call(() =>
   *   client.api.posts.$get()
   * )
   * ```
   */
  /**
   * Call an API endpoint with automatic loading/error handling.
   *
   * PIA: throws RpcError on failure instead of returning null.
   * The error is still stored in this.error for template access,
   * but callers who want to handle errors must catch.
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
  async call<T>(fn: () => Promise<T>): Promise<T> {
    this._loading = true;
    this._error = null;
    this.host.requestUpdate();

    try {
      const result = await fn();
      return result;
    } catch (err) {
      let rpcError: RpcError;
      if (err instanceof RpcError) {
        rpcError = err;
      } else if (err instanceof Error) {
        rpcError = new RpcError(0, err.message);
      } else {
        rpcError = new RpcError(0, 'Unknown error');
      }
      this._error = rpcError;
      throw rpcError;
    } finally {
      this._loading = false;
      this.host.requestUpdate();
    }
  }
}
