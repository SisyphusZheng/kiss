/**
 * Runtime adapter protocol.
 *
 * Replacement boundary for Nitro, Workers, Node, Deno, or future
 * fetch-compatible runtimes. Preserves openElement semantics while leaving
 * concrete server engines outside this package.
 */

import type {
  OpenElementRequestHandler,
  RuntimeAdapter,
  RuntimeAdapterOptions,
  RuntimeContext,
  RuntimePrerenderResult,
} from '../protocol/runtime.ts';
export type {
  OpenElementRequestHandler,
  RuntimeAdapter,
  RuntimeAdapterOptions,
  RuntimeContext,
  RuntimePrerenderResult,
};

export function createRuntimeAdapter<
  Env extends Record<string, unknown> = Record<string, unknown>,
>(options: RuntimeAdapterOptions<Env>): RuntimeAdapter<Env> {
  return {
    name: options.name,
    fetch: options.fetch,
    ...(options.prerender ? { prerender: options.prerender } : {}),
  };
}
