/**
 * @kiss/rpc - End-to-end type-safe RPC client
 *
 * Wraps Hono's hc() function for fully typed API communication.
 */

export { hc } from 'hono/client'
export type { InferRequestType, InferResponseType } from 'hono/client'

/**
 * RPC Error class for client-side error handling.
 */
export class RpcError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly message: string,
    public readonly requestId?: string,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message)
    this.name = 'RpcError'
  }
}

/**
 * Lit ReactiveController for declarative RPC calls in Island components.
 *
 * Usage:
 * ```ts
 * class MyElement extends LitElement {
 *   private rpc = new RpcController(this)
 *
 *   async loadData() {
 *     const result = await this.rpc.call(() =>
 *       client.api.posts.$get()
 *     )
 *   }
 *
 *   render() {
 *     if (this.rpc.loading) return html`Loading...`
 *     if (this.rpc.error) return html`Error: ${this.rpc.error.message}`
 *     return html`...`
 *   }
 * }
 * ```
 */
import type { ReactiveController, ReactiveElement } from 'lit'

export class RpcController implements ReactiveController {
  private _loading = false
  private _error: RpcError | null = null

  get loading() { return this._loading }
  get error() { return this._error }

  constructor(private host: ReactiveElement) {
    host.addController(this)
  }

  hostConnected() {}

  hostDisconnected() {
    this._loading = false
    this._error = null
  }

  async call<T>(fn: () => Promise<T>): Promise<T | null> {
    this._loading = true
    this._error = null
    this.host.requestUpdate()

    try {
      const result = await fn()
      return result
    } catch (err) {
      if (err instanceof RpcError) {
        this._error = err
      } else if (err instanceof Error) {
        this._error = new RpcError(0, 'NETWORK_ERROR', err.message)
      } else {
        this._error = new RpcError(0, 'UNKNOWN_ERROR', 'An unknown error occurred')
      }
      return null
    } finally {
      this._loading = false
      this.host.requestUpdate()
    }
  }
}

/**
 * Fetch wrapper with automatic error mapping and retry for 5xx errors.
 */
export async function rpcFetch<T>(
  url: string,
  init: RequestInit = {},
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init)

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const error = new RpcError(
          res.status,
          body?.error?.code || 'UNKNOWN_ERROR',
          body?.error?.message || `HTTP ${res.status}`,
          body?.error?.request_id,
          body?.error?.details,
        )

        // Don't retry 4xx (client errors)
        if (res.status < 500) throw error

        // Last attempt — throw
        if (attempt === maxRetries) throw error

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, delay))
        continue
      }

      if (res.status === 204) return undefined as T
      return (await res.json()) as T
    } catch (err) {
      if (err instanceof RpcError) throw err
      if (attempt === maxRetries) {
        throw new RpcError(0, 'NETWORK_ERROR', 'Network request failed')
      }
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  throw new RpcError(0, 'UNKNOWN_ERROR', 'Unreachable')
}
