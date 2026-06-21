/**
 * Runtime adapter protocol.
 *
 * Replacement boundary for Nitro, Workers, Node, Deno, or future
 * fetch-compatible runtimes. Preserves openElement semantics while leaving
 * concrete server engines outside this package.
 */

import type { CacheAdapter } from './isr.ts';

export interface RuntimeContext<Env extends Record<string, unknown> = Record<string, unknown>> {
  env?: Env;
  platform?: unknown;
  cache?: CacheAdapter<Response>;
}

export interface RuntimePrerenderResult {
  path: string;
  html: string;
  status?: number;
  headers?: HeadersInit;
}

export type OpenElementRequestHandler<
  Env extends Record<string, unknown> = Record<string, unknown>,
> = (request: Request, context?: RuntimeContext<Env>) => Response | Promise<Response>;

export interface RuntimeAdapter<Env extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  fetch: OpenElementRequestHandler<Env>;
  prerender?(): AsyncIterable<RuntimePrerenderResult> | Iterable<RuntimePrerenderResult>;
}

export interface RuntimeAdapterOptions<
  Env extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  fetch: OpenElementRequestHandler<Env>;
  prerender?(): AsyncIterable<RuntimePrerenderResult> | Iterable<RuntimePrerenderResult>;
}

export function createRuntimeAdapter<
  Env extends Record<string, unknown> = Record<string, unknown>,
>(options: RuntimeAdapterOptions<Env>): RuntimeAdapter<Env> {
  return {
    name: options.name,
    fetch: options.fetch,
    ...(options.prerender ? { prerender: options.prerender } : {}),
  };
}
